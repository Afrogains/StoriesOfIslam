import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';
import type { AuthenticatedUser } from '../auth/keycloak';
import { asJson, query, transaction } from '../db/pool';
import { HttpError } from '../http/errors';
import { ensureProfile } from './userRepository';

export const editorialRepository = {
  async approveStory(user: AuthenticatedUser, storyId: string, changeSummary: string): Promise<void> {
    const reviewerId = await ensureProfile(user);
    await transaction(async (client) => {
      const story = await client.query<RowDataPacket & { revision: number } & Record<string, unknown>>(
        `SELECT * FROM stories WHERE id=? FOR UPDATE`,
        [storyId],
      );
      if (!story.rows[0]) throw new HttpError(404, 'story_not_found', 'Story was not found');
      const row = story.rows[0];
      await client.query(
        `INSERT IGNORE INTO story_revisions(id,story_id,revision,snapshot,change_summary,created_by)
         VALUES(?,?,?,?,?,?)`,
        [
          randomUUID(),
          storyId,
          row.revision,
          JSON.stringify(row),
          changeSummary,
          reviewerId,
        ],
      );
      await client.query(
        `UPDATE stories SET publication_status='approved',reviewer_id=?,
          reviewed_at=UTC_TIMESTAMP(3) WHERE id=?`,
        [reviewerId, storyId],
      );
    });
  },

  async publishStory(user: AuthenticatedUser, storyId: string): Promise<void> {
    const reviewerId = await ensureProfile(user);
    const result = await query(
      `UPDATE stories SET publication_status='published',published_at=UTC_TIMESTAMP(3)
       WHERE id=? AND publication_status='approved' AND reviewer_id IS NOT NULL
         AND reviewed_at IS NOT NULL AND reviewer_id<>?`,
      [storyId, reviewerId],
    );
    if (!result.rowCount) {
      throw new HttpError(
        409,
        'story_not_publishable',
        'Story must be approved by a different qualified reviewer before publication',
      );
    }
  },

  async approveAsset(
    user: AuthenticatedUser,
    assetId: string,
    publicObjectKey: string,
    publicUrl: string,
    bucket: string,
  ): Promise<{ storyId: string | null; timelineObjectKey: string | null }> {
    const reviewerId = await ensureProfile(user);
    const result = await query(
      `UPDATE media_assets SET bucket=?,object_key=?,public_url=?,is_public=1,
        approved_by=?,approved_at=UTC_TIMESTAMP(3)
       WHERE id=? AND is_public=0`,
      [bucket, publicObjectKey, publicUrl, reviewerId, assetId],
    );
    if (!result.rowCount) {
      throw new HttpError(404, 'asset_not_found', 'Draft media asset was not found');
    }
    const row = await query<RowDataPacket & {
      story_id: string | null;
      timeline_object_key: string | null;
    }>('SELECT story_id,timeline_object_key FROM media_assets WHERE id=? LIMIT 1', [assetId]);
    return {
      storyId: row.rows[0]?.story_id ?? null,
      timelineObjectKey: row.rows[0]?.timeline_object_key ?? null,
    };
  },
};

export function parseStorySnapshot(value: unknown): Record<string, unknown> {
  return asJson<Record<string, unknown>>(value, {});
}
