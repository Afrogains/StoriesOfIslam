import { Router } from 'express';
import type { RowDataPacket } from 'mysql2/promise';
import { z } from 'zod';
import { requireAuth, requireRole, type AuthenticatedUser } from '../auth/keycloak';
import { query } from '../db/pool';
import { HttpError, asyncHandler } from '../http/errors';
import { editorialRepository } from '../repositories/editorialRepository';
import { namesMediaRepository } from '../repositories/namesMediaRepository';
import { objectStorageService } from '../services/ObjectStorageService';

const UuidSchema = z.string().uuid();
const ApprovalSchema = z.object({ changeSummary: z.string().trim().min(10).max(500) });
const NamesMediaQuerySchema = z.object({
  status: z.enum(['needs_review', 'approved', 'rejected']).optional(),
  name: z.coerce.number().int().min(1).max(99).optional(),
});
const NamesMediaDraftSchema = z
  .object({
    descriptionDraft: z.string().trim().min(1).max(8000).optional(),
    transcript: z.string().trim().min(1).max(500_000).optional(),
  })
  .refine((body) => body.descriptionDraft || body.transcript, 'Provide descriptionDraft or transcript');
const NamesMediaApprovalSchema = z.object({
  description: z.string().trim().min(40).max(8000),
  /** Publish the stored audio copy; by default Listen streams from the podcast source. */
  includeAudio: z.boolean().default(false),
  confirmOverwrite: z.boolean().default(false),
});
const NamesMediaRejectSchema = z.object({ confirmOverwrite: z.boolean().default(false) });

export const editorialRouter = Router();
editorialRouter.use(requireAuth);

async function publishDraftAsset(user: AuthenticatedUser, assetId: string) {
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
    user,
    assetId,
    promoted.objectKey,
    promoted.publicUrl!,
    promoted.bucket,
  );
  return { draft, promoted, timelineUrl, storyId: updated.storyId };
}

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
    const { draft, promoted, timelineUrl, storyId } = await publishDraftAsset(request.user!, assetId);
    if (storyId) {
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
        [promoted.publicUrl, JSON.stringify(audioPayload), storyId],
      );
    }
    response.status(200).json({ data: { ...promoted, timelineUrl } });
  }),
);

editorialRouter.get(
  '/names-media',
  requireRole('reviewer', 'admin'),
  asyncHandler(async (request, response) => {
    const filters = NamesMediaQuerySchema.parse(request.query);
    response.setHeader('Cache-Control', 'no-store');
    response.json({ data: await namesMediaRepository.listForReview(filters.status, filters.name) });
  }),
);

editorialRouter.get(
  '/names-media/:id',
  requireRole('reviewer', 'admin'),
  asyncHandler(async (request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    response.json({ data: await namesMediaRepository.getForReview(UuidSchema.parse(request.params.id)) });
  }),
);

editorialRouter.patch(
  '/names-media/:id',
  requireRole('reviewer', 'admin'),
  asyncHandler(async (request, response) => {
    const id = UuidSchema.parse(request.params.id);
    await namesMediaRepository.updateDraft(id, NamesMediaDraftSchema.parse(request.body));
    response.status(204).end();
  }),
);

editorialRouter.post(
  '/names-media/:id/approve',
  requireRole('reviewer', 'admin'),
  asyncHandler(async (request, response) => {
    const id = UuidSchema.parse(request.params.id);
    const body = NamesMediaApprovalSchema.parse(request.body);
    const record = await namesMediaRepository.getForReview(id);
    if (record.reviewStatus === 'approved' && !body.confirmOverwrite) {
      const unchanged = record.approvedDescription === body.description;
      if (!unchanged) {
        throw new HttpError(
          409,
          'approved_content_locked',
          'This record is already approved; resend with confirmOverwrite=true to replace it',
        );
      }
    }

    let audioUrl: string | null = null;
    if (body.includeAudio && record.audioAssetId) {
      const asset = await query<RowDataPacket & { is_public: number; public_url: string | null }>(
        'SELECT is_public,public_url FROM media_assets WHERE id=?',
        [record.audioAssetId],
      );
      audioUrl = asset.rows[0]?.is_public
        ? asset.rows[0].public_url
        : (await publishDraftAsset(request.user!, record.audioAssetId)).promoted.publicUrl;
    }

    await namesMediaRepository.approve(request.user!, id, {
      description: body.description,
      audioUrl,
      confirmOverwrite: body.confirmOverwrite,
    });
    response.status(200).json({ data: { id, audioUrl, reviewStatus: 'approved' } });
  }),
);

editorialRouter.post(
  '/names-media/:id/reject',
  requireRole('reviewer', 'admin'),
  asyncHandler(async (request, response) => {
    const id = UuidSchema.parse(request.params.id);
    const { confirmOverwrite } = NamesMediaRejectSchema.parse(request.body ?? {});
    await namesMediaRepository.reject(id, confirmOverwrite);
    response.status(204).end();
  }),
);
