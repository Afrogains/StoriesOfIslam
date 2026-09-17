import type { AuthenticatedUser } from '../auth/keycloak';
import { query, transaction } from '../db/pool';
import { HttpError } from '../http/errors';
import { ensureProfile } from './userRepository';

export const editorialRepository = {
  async approveStory(user: AuthenticatedUser, storyId: string, changeSummary: string): Promise<void> {
    const reviewerId = await ensureProfile(user);
    await transaction(async (client) => {
      const story = await client.query<{ snapshot: Record<string, unknown>; revision: number }>(
        `SELECT to_jsonb(s.*) AS snapshot,revision FROM stories s WHERE id=$1 FOR UPDATE`,
        [storyId],
      );
      if (!story.rows[0]) throw new HttpError(404, 'story_not_found', 'Story was not found');
      await client.query(
        `INSERT INTO story_revisions(story_id,revision,snapshot,change_summary,created_by)
         VALUES($1,$2,$3,$4,$5) ON CONFLICT(story_id,revision) DO NOTHING`,
        [storyId, story.rows[0].revision, story.rows[0].snapshot, changeSummary, reviewerId],
      );
      await client.query(
        `UPDATE stories SET publication_status='approved',reviewer_id=$2,
          reviewed_at=now() WHERE id=$1`,
        [storyId, reviewerId],
      );
    });
  },

  async publishStory(user: AuthenticatedUser, storyId: string): Promise<void> {
    const reviewerId = await ensureProfile(user);
    const result = await query(
      `UPDATE stories SET publication_status='published',published_at=now()
       WHERE id=$1 AND publication_status='approved' AND reviewer_id IS NOT NULL
         AND reviewed_at IS NOT NULL AND reviewer_id<>$2`,
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
    const result = await query<{ story_id: string | null; timeline_object_key: string | null }>(
      `UPDATE media_assets SET bucket=$3,object_key=$4,public_url=$5,is_public=true,
        approved_by=$2,approved_at=now()
       WHERE id=$1 AND is_public=false
       RETURNING story_id,timeline_object_key`,
      [assetId, reviewerId, bucket, publicObjectKey, publicUrl],
    );
    if (!result.rows[0]) {
      throw new HttpError(404, 'asset_not_found', 'Draft media asset was not found');
    }
    return {
      storyId: result.rows[0].story_id,
      timelineObjectKey: result.rows[0].timeline_object_key,
    };
  },
};
