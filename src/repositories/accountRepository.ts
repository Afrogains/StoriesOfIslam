import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';
import { LOCAL_SUBJECT_PREFIX } from '../auth/localAuth';
import { query, transaction } from '../db/pool';

export type AccountProfile = {
  id: string;
  email: string;
  name: string;
};

export type CredentialRecord = AccountProfile & {
  passwordHash: string;
  failedAttempts: number;
  lockedUntil: Date | null;
};

export type QuizResultInput = {
  storyId: string;
  chapterIndex: number;
  score: number;
  total: number;
  completedAt: string;
};

export type QuizResultRecord = QuizResultInput & { bestScore: number; attempts: number };

export type GameScoreInput = {
  section: string;
  score: number;
  correct: number;
  total: number;
  bestStreak: number;
  playedAt: string;
};

export type LeaderboardEntry = { name: string; score: number; isYou: boolean };

export class EmailTakenError extends Error {}

const LOCK_AFTER_FAILURES = 10;
const LOCK_MINUTES = 15;

function toMysqlDate(value: Date | string): string {
  return new Date(value).toISOString().slice(0, 23).replace('T', ' ');
}

export const accountRepository = {
  async createAccount(input: { email: string; name: string; passwordHash: string }): Promise<AccountProfile> {
    const id = randomUUID();
    try {
      await transaction(async (client) => {
        const existing = await client.query<RowDataPacket & { profile_id: string }>(
          'SELECT profile_id FROM user_credentials WHERE email_normalized=? FOR UPDATE',
          [input.email],
        );
        if (existing.rows[0]) throw new EmailTakenError();
        await client.query(
          `INSERT INTO profiles(id,keycloak_subject,email,display_name,roles) VALUES(?,?,?,?,JSON_ARRAY())`,
          [id, `${LOCAL_SUBJECT_PREFIX}${id}`, input.email, input.name],
        );
        await client.query(
          `INSERT INTO user_credentials(profile_id,email_normalized,password_hash,last_login_at)
           VALUES(?,?,?,UTC_TIMESTAMP(3))`,
          [id, input.email, input.passwordHash],
        );
      });
    } catch (error) {
      if (error instanceof EmailTakenError) throw error;
      if ((error as { code?: string }).code === 'ER_DUP_ENTRY') throw new EmailTakenError();
      throw error;
    }
    return { id, email: input.email, name: input.name };
  },

  async findCredentials(email: string): Promise<CredentialRecord | null> {
    const result = await query<
      RowDataPacket & {
        profile_id: string;
        email_normalized: string;
        display_name: string | null;
        password_hash: string;
        failed_attempts: number;
        locked_until: Date | null;
      }
    >(
      `SELECT c.profile_id,c.email_normalized,p.display_name,c.password_hash,c.failed_attempts,c.locked_until
       FROM user_credentials c JOIN profiles p ON p.id=c.profile_id
       WHERE c.email_normalized=? AND p.deleted_at IS NULL LIMIT 1`,
      [email],
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      id: row.profile_id,
      email: row.email_normalized,
      name: row.display_name ?? '',
      passwordHash: row.password_hash,
      failedAttempts: Number(row.failed_attempts),
      lockedUntil: row.locked_until ? new Date(row.locked_until) : null,
    };
  },

  async recordLogin(profileId: string, success: boolean): Promise<void> {
    if (success) {
      await query(
        `UPDATE user_credentials SET failed_attempts=0,locked_until=NULL,last_login_at=UTC_TIMESTAMP(3)
         WHERE profile_id=?`,
        [profileId],
      );
      return;
    }
    await query(
      `UPDATE user_credentials SET failed_attempts=failed_attempts+1,
         locked_until=IF(failed_attempts+1>=?, DATE_ADD(UTC_TIMESTAMP(3), INTERVAL ? MINUTE), locked_until)
       WHERE profile_id=?`,
      [LOCK_AFTER_FAILURES, LOCK_MINUTES, profileId],
    );
  },

  async getProfile(profileId: string): Promise<AccountProfile | null> {
    const result = await query<RowDataPacket & { id: string; email: string | null; display_name: string | null }>(
      'SELECT id,email,display_name FROM profiles WHERE id=? AND deleted_at IS NULL LIMIT 1',
      [profileId],
    );
    const row = result.rows[0];
    return row ? { id: row.id, email: row.email ?? '', name: row.display_name ?? '' } : null;
  },

  async createSession(profileId: string, tokenHash: string, ttlDays: number, userAgent?: string): Promise<void> {
    await query(
      `INSERT INTO auth_sessions(id,profile_id,refresh_token_hash,user_agent,expires_at)
       VALUES(?,?,?,?,DATE_ADD(UTC_TIMESTAMP(3), INTERVAL ? DAY))`,
      [randomUUID(), profileId, tokenHash, userAgent?.slice(0, 255) ?? null, ttlDays],
    );
  },

  /** Swaps a live refresh token for a new one; returns the owner, or null if the token is unusable. */
  async rotateSession(tokenHash: string, nextHash: string, ttlDays: number): Promise<string | null> {
    return transaction(async (client) => {
      const found = await client.query<RowDataPacket & { id: string; profile_id: string }>(
        `SELECT s.id,s.profile_id FROM auth_sessions s JOIN profiles p ON p.id=s.profile_id
         WHERE s.refresh_token_hash=? AND s.revoked_at IS NULL AND s.expires_at>UTC_TIMESTAMP(3)
           AND p.deleted_at IS NULL
         FOR UPDATE`,
        [tokenHash],
      );
      const session = found.rows[0];
      if (!session) return null;
      await client.query(
        `UPDATE auth_sessions SET refresh_token_hash=?,last_used_at=UTC_TIMESTAMP(3),
           expires_at=DATE_ADD(UTC_TIMESTAMP(3), INTERVAL ? DAY) WHERE id=?`,
        [nextHash, ttlDays, session.id],
      );
      return session.profile_id;
    });
  },

  async revokeSession(tokenHash: string): Promise<void> {
    await query(
      'UPDATE auth_sessions SET revoked_at=UTC_TIMESTAMP(3) WHERE refresh_token_hash=? AND revoked_at IS NULL',
      [tokenHash],
    );
  },

  async deleteLocalAccount(profileId: string): Promise<void> {
    await transaction(async (client) => {
      await client.query('DELETE FROM auth_sessions WHERE profile_id=?', [profileId]);
      await client.query('DELETE FROM user_credentials WHERE profile_id=?', [profileId]);
      await client.query('DELETE FROM quiz_results WHERE profile_id=?', [profileId]);
      await client.query('DELETE FROM game_scores WHERE profile_id=?', [profileId]);
    });
  },

  async upsertQuizResults(profileId: string, results: QuizResultInput[]): Promise<void> {
    for (const result of results) {
      await query(
        `INSERT INTO quiz_results(profile_id,story_id,chapter_index,score,total,best_score,attempts,completed_at)
         VALUES(?,?,?,?,?,?,1,?)
         ON DUPLICATE KEY UPDATE
           attempts=IF(VALUES(completed_at)>completed_at, attempts+1, attempts),
           best_score=GREATEST(best_score,VALUES(score)),
           score=IF(VALUES(completed_at)>completed_at, VALUES(score), score),
           total=VALUES(total),
           completed_at=GREATEST(completed_at,VALUES(completed_at))`,
        [
          profileId,
          result.storyId,
          result.chapterIndex,
          result.score,
          result.total,
          result.score,
          toMysqlDate(result.completedAt),
        ],
      );
    }
  },

  async listQuizResults(profileId: string): Promise<QuizResultRecord[]> {
    const result = await query<
      RowDataPacket & {
        story_id: string;
        chapter_index: number;
        score: number;
        total: number;
        best_score: number;
        attempts: number;
        completed_at: Date;
      }
    >(
      `SELECT story_id,chapter_index,score,total,best_score,attempts,completed_at
       FROM quiz_results WHERE profile_id=? ORDER BY completed_at DESC LIMIT 5000`,
      [profileId],
    );
    return result.rows.map((row) => ({
      storyId: row.story_id,
      chapterIndex: Number(row.chapter_index),
      score: Number(row.score),
      total: Number(row.total),
      bestScore: Number(row.best_score),
      attempts: Number(row.attempts),
      completedAt: new Date(row.completed_at).toISOString(),
    }));
  },

  async addGameScore(profileId: string, score: GameScoreInput): Promise<void> {
    await query(
      `INSERT INTO game_scores(id,profile_id,section,score,correct,total,best_streak,played_at)
       VALUES(?,?,?,?,?,?,?,?)`,
      [
        randomUUID(),
        profileId,
        score.section,
        score.score,
        score.correct,
        score.total,
        score.bestStreak,
        toMysqlDate(score.playedAt),
      ],
    );
  },

  async gameSummary(profileId: string): Promise<{ games: number; best: Record<string, number> }> {
    const result = await query<RowDataPacket & { section: string; best: number; games: number }>(
      'SELECT section,MAX(score) AS best,COUNT(*) AS games FROM game_scores WHERE profile_id=? GROUP BY section',
      [profileId],
    );
    return {
      games: result.rows.reduce((sum, row) => sum + Number(row.games), 0),
      best: Object.fromEntries(result.rows.map((row) => [row.section, Number(row.best)])),
    };
  },

  async leaderboard(section: string, viewerProfileId?: string): Promise<LeaderboardEntry[]> {
    const result = await query<RowDataPacket & { profile_id: string; display_name: string | null; best: number }>(
      `SELECT g.profile_id,p.display_name,MAX(g.score) AS best
       FROM game_scores g JOIN profiles p ON p.id=g.profile_id
       WHERE g.section=? AND p.deleted_at IS NULL
       GROUP BY g.profile_id,p.display_name
       ORDER BY best DESC LIMIT 20`,
      [section],
    );
    return result.rows.map((row) => ({
      name: publicName(row.display_name),
      score: Number(row.best),
      isYou: row.profile_id === viewerProfileId,
    }));
  },
};

/** "Aisha Bello" → "Aisha B." so the public board never shows full names or emails. */
export function publicName(displayName: string | null): string {
  const parts = (displayName ?? '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'Reader';
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.` : parts[0];
}
