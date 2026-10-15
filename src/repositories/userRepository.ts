import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';
import type { AuthenticatedUser } from '../auth/keycloak';
import { asBool, query, transaction } from '../db/pool';

export async function ensureProfile(user: AuthenticatedUser): Promise<string> {
  const existing = await query<RowDataPacket & { id: string }>(
    'SELECT id FROM profiles WHERE keycloak_subject=? LIMIT 1',
    [user.subject],
  );
  if (existing.rows[0]) {
    await query(
      `UPDATE profiles SET email=?,display_name=?,roles=?,deleted_at=NULL,updated_at=UTC_TIMESTAMP(3)
       WHERE keycloak_subject=?`,
      [user.email ?? null, user.displayName ?? null, JSON.stringify(user.roles), user.subject],
    );
    return existing.rows[0].id;
  }
  const id = randomUUID();
  try {
    await query(
      `INSERT INTO profiles(id,keycloak_subject,email,display_name,roles)
       VALUES(?,?,?,?,?)`,
      [id, user.subject, user.email ?? null, user.displayName ?? null, JSON.stringify(user.roles)],
    );
    return id;
  } catch {
    const raced = await query<RowDataPacket & { id: string }>(
      'SELECT id FROM profiles WHERE keycloak_subject=? LIMIT 1',
      [user.subject],
    );
    if (!raced.rows[0]) throw new Error('Unable to ensure profile');
    return raced.rows[0].id;
  }
}

export const userRepository = {
  async listFavorites(user: AuthenticatedUser): Promise<string[]> {
    const profileId = await ensureProfile(user);
    const result = await query<RowDataPacket & { story_id: string }>(
      'SELECT story_id FROM favorites WHERE profile_id=? ORDER BY created_at DESC',
      [profileId],
    );
    return result.rows.map((row) => row.story_id);
  },

  async addFavorite(user: AuthenticatedUser, storyId: string): Promise<void> {
    const profileId = await ensureProfile(user);
    await query(
      `INSERT IGNORE INTO favorites(profile_id,story_id) VALUES(?,?)`,
      [profileId, storyId],
    );
  },

  async removeFavorite(user: AuthenticatedUser, storyId: string): Promise<void> {
    const profileId = await ensureProfile(user);
    await query('DELETE FROM favorites WHERE profile_id=? AND story_id=?', [
      profileId,
      storyId,
    ]);
  },

  async listProgress(user: AuthenticatedUser) {
    const profileId = await ensureProfile(user);
    const result = await query<RowDataPacket & {
      story_id: string;
      position_ms: number;
      completed: number | boolean;
      updated_at: Date;
    }>(
      `SELECT story_id,position_ms,completed,updated_at
       FROM playback_progress WHERE profile_id=? ORDER BY updated_at DESC`,
      [profileId],
    );
    return result.rows.map((row) => ({
      storyId: row.story_id,
      positionMs: row.position_ms,
      completed: asBool(row.completed),
      updatedAt: new Date(row.updated_at).toISOString(),
    }));
  },

  async updateProgress(
    user: AuthenticatedUser,
    storyId: string,
    value: { positionMs: number; completed: boolean },
  ): Promise<void> {
    const profileId = await ensureProfile(user);
    await query(
      `INSERT INTO playback_progress(profile_id,story_id,position_ms,completed)
       VALUES(?,?,?,?)
       ON DUPLICATE KEY UPDATE
         position_ms=VALUES(position_ms),completed=VALUES(completed),updated_at=UTC_TIMESTAMP(3)`,
      [profileId, storyId, value.positionMs, value.completed ? 1 : 0],
    );
  },

  async softDeleteAccount(user: AuthenticatedUser): Promise<void> {
    await transaction(async (client) => {
      const profile = await client.query<RowDataPacket & { id: string }>(
        'SELECT id FROM profiles WHERE keycloak_subject=? FOR UPDATE',
        [user.subject],
      );
      const profileId = profile.rows[0]?.id;
      if (!profileId) return;
      await client.query('DELETE FROM favorites WHERE profile_id=?', [profileId]);
      await client.query('DELETE FROM playback_progress WHERE profile_id=?', [profileId]);
      await client.query(
        `UPDATE profiles SET email=NULL,display_name=NULL,roles=JSON_ARRAY(),
          deleted_at=UTC_TIMESTAMP(3),updated_at=UTC_TIMESTAMP(3) WHERE id=?`,
        [profileId],
      );
    });
  },
};
