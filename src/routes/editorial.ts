import { Router } from 'express';
import type { RowDataPacket } from 'mysql2/promise';
import { z } from 'zod';
import { requireAuth, requireRole } from '../auth/keycloak';
import { query } from '../db/pool';
import { HttpError, asyncHandler } from '../http/errors';
import { editorialRepository } from '../repositories/editorialRepository';
import { objectStorageService } from '../services/ObjectStorageService';

const UuidSchema = z.string().uuid();
const ApprovalSchema = z.object({ changeSummary: z.string().trim().min(10).max(500) });

export const editorialRouter = Router();
editorialRouter.use(requireAuth);

editorialRouter.post(
  '/stories/:storyId/approve',
  requireRole('reviewer', 'admin'),
  asyncHandler(async (request, response) => {
    const storyId = UuidSchema.parse(request.params.storyId);
    const { changeSummary } = ApprovalSchema.parse(request.body);
    await editorialRepository.approveStory(request.user!, storyId, changeSummary);
    response.status(204).end();
  }),
);

editorialRouter.post(
  '/stories/:storyId/publish',
  requireRole('admin'),
  asyncHandler(async (request, response) => {
    await editorialRepository.publishStory(
      request.user!,
      UuidSchema.parse(request.params.storyId),
    );
    response.status(204).end();
  }),
);

editorialRouter.post(
  '/assets/:assetId/approve',
  requireRole('reviewer', 'admin'),
  asyncHandler(async (request, response) => {
    const assetId = UuidSchema.parse(request.params.assetId);
    const asset = await query<RowDataPacket & {
      object_key: string;
      timeline_object_key: string | null;
      story_id: string | null;
      mime_type: string;
      duration_ms: number | null;
    }>(
      `SELECT object_key,timeline_object_key,story_id,mime_type,duration_ms
       FROM media_assets WHERE id=? AND is_public=0`,
      [assetId],
    );
    const draft = asset.rows[0];
    if (!draft) throw new HttpError(404, 'asset_not_found', 'Draft media asset was not found');

    const extension = draft.mime_type === 'audio/mp4' ? 'm4a' : 'mp3';
    const publicKey = `published/${draft.story_id ?? 'episodes'}/${assetId}.${extension}`;
    const promoted = await objectStorageService.promoteToPublic(draft.object_key, publicKey);
    let timelineUrl: string | undefined;
    if (draft.timeline_object_key) {
      const timeline = await objectStorageService.promoteToPublic(
        draft.timeline_object_key,
        `published/${draft.story_id ?? 'episodes'}/${assetId}.timeline.json`,
      );
      timelineUrl = timeline.publicUrl ?? undefined;
    }

    const updated = await editorialRepository.approveAsset(
      request.user!,
      assetId,
      promoted.objectKey,
      promoted.publicUrl!,
      promoted.bucket,
    );
    if (updated.storyId) {
      const audioPayload = {
        url: promoted.publicUrl,
        mimeType: draft.mime_type,
        durationSeconds: Math.round((draft.duration_ms ?? 0) / 1000),
        checksum: promoted.checksumSha256,
        objectKey: promoted.objectKey,
        timelineUrl: timelineUrl ?? null,
      };
      await query(
        `UPDATE stories SET audio_url=?,audio=? WHERE id=?`,
        [promoted.publicUrl, JSON.stringify(audioPayload), updated.storyId],
      );
    }
    response.status(200).json({ data: { ...promoted, timelineUrl } });
  }),
);
