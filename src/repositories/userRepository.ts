import type { AuthenticatedUser } from '../auth/keycloak';
import { query, transaction } from '../db/pool';

export async function ensureProfile(user: AuthenticatedUser): Promise<string> {
  const result = await query<{ id: string }>(
    `INSERT INTO profiles(keycloak_subject,email,display_name,roles)
     VALUES($1,$2,$3,$4)
     ON CONFLICT(keycloak_subject) DO UPDATE SET
       email=EXCLUDED.email,display_name=EXCLUDED.display_name,roles=EXCLUDED.roles,
       deleted_at=NULL
     RETURNING id`,
    [user.subject, user.email ?? null, user.displayName ?? null, user.roles],
  );
  return result.rows[0]!.id;
}

export const userRepository = {
  async listFavorites(user: AuthenticatedUser): Promise<string[]> {
    const profileId = await ensureProfile(user);
    const result = await query<{ story_id: string }>(
      'SELECT story_id FROM favorites WHERE profile_id=$1 ORDER BY created_at DESC',
      [profileId],
    );
    return result.rows.map((row) => row.story_id);
  },

  async addFavorite(user: AuthenticatedUser, storyId: string): Promise<void> {
    const profileId = await ensureProfile(user);
    await query(
      `INSERT INTO favorites(profile_id,story_id) VALUES($1,$2)
       ON CONFLICT(profile_id,story_id) DO NOTHING`,
      [profileId, storyId],
    );
  },

  async removeFavorite(user: AuthenticatedUser, storyId: string): Promise<void> {
    const profileId = await ensureProfile(user);
    await query('DELETE FROM favorites WHERE profile_id=$1 AND story_id=$2', [
      profileId,
      storyId,
    ]);
  },

  async listProgress(user: AuthenticatedUser) {
    const profileId = await ensureProfile(user);
    const result = await query<{
      story_id: string;
      position_ms: number;
      completed: boolean;
      updated_at: Date;
    }>(
      `SELECT story_id,position_ms,completed,updated_at
       FROM playback_progress WHERE profile_id=$1 ORDER BY updated_at DESC`,
      [profileId],
    );
    return result.rows.map((row) => ({
      storyId: row.story_id,
      positionMs: row.position_ms,
      completed: row.completed,
      updatedAt: row.updated_at.toISOString(),
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
       VALUES($1,$2,$3,$4)
       ON CONFLICT(profile_id,story_id) DO UPDATE SET
         position_ms=EXCLUDED.position_ms,completed=EXCLUDED.completed,updated_at=now()`,
      [profileId, storyId, value.positionMs, value.completed],
    );
  },

  async softDeleteAccount(user: AuthenticatedUser): Promise<void> {
    await transaction(async (client) => {
      const profile = await client.query<{ id: string }>(
        'SELECT id FROM profiles WHERE keycloak_subject=$1 FOR UPDATE',
        [user.subject],
      );
      const profileId = profile.rows[0]?.id;
      if (!profileId) return;
      await client.query('DELETE FROM favorites WHERE profile_id=$1', [profileId]);
      await client.query('DELETE FROM playback_progress WHERE profile_id=$1', [profileId]);
      await client.query(
        `UPDATE profiles SET email=NULL,display_name=NULL,roles='{}',
          deleted_at=now(),updated_at=now() WHERE id=$1`,
        [profileId],
      );
    });
  },
};
