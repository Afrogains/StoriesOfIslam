import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';
import type { AuthenticatedUser } from '../auth/keycloak';
import { asJson, query, transaction } from '../db/pool';
import { HttpError } from '../http/errors';
import type { DivineNameRecord } from '../names/matching';
import { ensureProfile } from './userRepository';

export type ReviewStatus = 'needs_review' | 'approved' | 'rejected';
export type TranscriptStatus = 'pending' | 'complete' | 'partial' | 'failed' | 'manual';
export type TranscriptSource = 'youtube_captions' | 'speech_to_text' | 'manual';

export interface NameMediaRow extends RowDataPacket {
  id: string;
  name_number: number;
  source_video_id: string;
  playlist_id: string;
  class_number: number | null;
  video_title: string;
  video_duration_seconds: number | null;
  podcast_title: string | null;
  podcast_audio_url: string | null;
  audio_asset_id: string | null;
  transcript_status: TranscriptStatus;
  transcript_source: TranscriptSource | null;
  transcript_text: string | null;
  transcript_segments: unknown;
  description_draft: string | null;
  review_status: ReviewStatus;
  approved_description: string | null;
  approved_audio_url: string | null;
  approved_by: string | null;
  approved_at: Date | null;
  last_error: string | null;
  import_attempts: number;
  updated_at: Date;
}

export interface ApprovedNameMedia {
  nameNumber: number;
  description: string;
  audioUrl: string | null;
  podcastAudioUrl: string | null;
  durationSeconds: number | null;
  videoId: string;
  videoTitle: string;
  watchUrl: string;
  embedUrl: string;
  classNumber: number | null;
  approvedAt: string;
}

export const namesMediaRepository = {
  async upsertNames(names: DivineNameRecord[]): Promise<void> {
    for (const name of names) {
      await query(
        `INSERT INTO divine_names(number,arabic,transliteration,meaning) VALUES(?,?,?,?)
         ON DUPLICATE KEY UPDATE arabic=VALUES(arabic),transliteration=VALUES(transliteration),
           meaning=VALUES(meaning)`,
        [name.number, name.arabic, name.transliteration, name.meaning],
      );
    }
  },

  async findByVideo(videoId: string): Promise<NameMediaRow[]> {
    const result = await query<NameMediaRow>(
      'SELECT * FROM divine_name_media WHERE source_video_id=? ORDER BY name_number',
      [videoId],
    );
    return result.rows;
  },

  /** Creates or refreshes source metadata only; reviewed fields are never touched here. */
  async upsertSource(input: {
    nameNumber: number;
    videoId: string;
    playlistId: string;
    classNumber: number | null;
    videoTitle: string;
    durationSeconds: number | null;
    podcastTitle: string | null;
    podcastAudioUrl: string | null;
  }): Promise<{ id: string; created: boolean }> {
    const id = randomUUID();
    const result = await query(
      `INSERT INTO divine_name_media(id,name_number,source_video_id,playlist_id,class_number,video_title,
         video_duration_seconds,podcast_title,podcast_audio_url,import_attempts)
       VALUES(?,?,?,?,?,?,?,?,?,1)
       ON DUPLICATE KEY UPDATE playlist_id=VALUES(playlist_id),class_number=VALUES(class_number),
         video_title=VALUES(video_title),
         video_duration_seconds=COALESCE(VALUES(video_duration_seconds),video_duration_seconds),
         podcast_title=COALESCE(VALUES(podcast_title),podcast_title),
         podcast_audio_url=COALESCE(VALUES(podcast_audio_url),podcast_audio_url),
         import_attempts=import_attempts+1`,
      [
        id,
        input.nameNumber,
        input.videoId,
        input.playlistId,
        input.classNumber,
        input.videoTitle.slice(0, 512),
        input.durationSeconds,
        input.podcastTitle?.slice(0, 512) ?? null,
        input.podcastAudioUrl,
      ],
    );
    const row = await query<RowDataPacket & { id: string }>(
      'SELECT id FROM divine_name_media WHERE name_number=? AND source_video_id=?',
      [input.nameNumber, input.videoId],
    );
    // MySQL reports 1 affected row for an insert and 2 for an update.
    return { id: row.rows[0].id, created: result.rowCount === 1 };
  },

  async findDraftAssetByKey(bucket: string, objectKey: string): Promise<string | null> {
    const result = await query<RowDataPacket & { id: string }>(
      'SELECT id FROM media_assets WHERE bucket=? AND object_key=? LIMIT 1',
      [bucket, objectKey],
    );
    return result.rows[0]?.id ?? null;
  },

  async insertDraftAsset(input: {
    bucket: string;
    objectKey: string;
    mimeType: string;
    sizeBytes: number;
    checksumSha256: string;
    durationMs: number | null;
  }): Promise<string> {
    const id = randomUUID();
    await query(
      `INSERT INTO media_assets(id,bucket,object_key,mime_type,size_bytes,checksum_sha256,duration_ms,is_public)
       VALUES(?,?,?,?,?,?,?,0)
       ON DUPLICATE KEY UPDATE size_bytes=VALUES(size_bytes),checksum_sha256=VALUES(checksum_sha256)`,
      [id, input.bucket, input.objectKey, input.mimeType, input.sizeBytes, input.checksumSha256, input.durationMs],
    );
    return (await this.findDraftAssetByKey(input.bucket, input.objectKey)) ?? id;
  },

  async attachAudio(videoId: string, assetId: string): Promise<void> {
    await query(
      'UPDATE divine_name_media SET audio_asset_id=? WHERE source_video_id=? AND audio_asset_id IS NULL',
      [assetId, videoId],
    );
  },

  /**
   * Imports may refresh drafts on approved rows only when explicitly confirmed;
   * even then the approved description/audio stay live until a reviewer re-approves.
   */
  async saveTranscript(input: {
    id: string;
    status: TranscriptStatus;
    source: TranscriptSource | null;
    text: string | null;
    segments: unknown;
    descriptionDraft: string | null;
    allowApproved: boolean;
  }): Promise<boolean> {
    const result = await query(
      `UPDATE divine_name_media SET transcript_status=?,transcript_source=?,transcript_text=?,
         transcript_segments=?,description_draft=COALESCE(?,description_draft),
         last_error=IF(?='complete',NULL,last_error)
       WHERE id=? AND (review_status<>'approved' OR ?=1)`,
      [
        input.status,
        input.source,
        input.text,
        input.segments == null ? null : JSON.stringify(input.segments),
        input.descriptionDraft,
        input.status,
        input.id,
        input.allowApproved ? 1 : 0,
      ],
    );
    return result.rowCount > 0;
  },

  async recordError(videoId: string, message: string): Promise<void> {
    await query('UPDATE divine_name_media SET last_error=? WHERE source_video_id=?', [
      message.slice(0, 1024),
      videoId,
    ]);
  },

  async listApproved(): Promise<ApprovedNameMedia[]> {
    const result = await query<NameMediaRow & { asset_public_url: string | null; duration_ms: number | null }>(
      `SELECT m.*, a.public_url AS asset_public_url, a.duration_ms
       FROM divine_name_media m
       LEFT JOIN media_assets a ON a.id=m.audio_asset_id AND a.is_public=1
       WHERE m.review_status='approved' AND m.approved_description IS NOT NULL
       ORDER BY m.name_number, m.class_number DESC, m.approved_at DESC`,
    );
    const seen = new Set<number>();
    return result.rows.flatMap((row) => {
      if (seen.has(row.name_number)) return [];
      seen.add(row.name_number);
      return [toApproved(row, row.approved_audio_url ?? row.asset_public_url, row.duration_ms)];
    });
  },

  async listForReview(status: ReviewStatus | undefined, nameNumber: number | undefined) {
    const clauses: string[] = [];
    const values: unknown[] = [];
    if (status) {
      clauses.push('review_status=?');
      values.push(status);
    }
    if (nameNumber) {
      clauses.push('name_number=?');
      values.push(nameNumber);
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const result = await query<NameMediaRow>(
      `SELECT * FROM divine_name_media ${where} ORDER BY name_number, class_number`,
      values,
    );
    return result.rows.map(toReviewItem);
  },

  async getForReview(id: string) {
    const result = await query<NameMediaRow>('SELECT * FROM divine_name_media WHERE id=?', [id]);
    const row = result.rows[0];
    if (!row) throw new HttpError(404, 'name_media_not_found', 'Name media record was not found');
    return { ...toReviewItem(row), transcript: row.transcript_text };
  },

  async updateDraft(id: string, input: { descriptionDraft?: string; transcript?: string }): Promise<void> {
    const result = await query(
      `UPDATE divine_name_media SET
         description_draft=COALESCE(?,description_draft),
         transcript_text=COALESCE(?,transcript_text),
         transcript_status=IF(? IS NULL,transcript_status,'manual'),
         transcript_source=IF(? IS NULL,transcript_source,'manual')
       WHERE id=?`,
      [
        input.descriptionDraft ?? null,
        input.transcript ?? null,
        input.transcript ?? null,
        input.transcript ?? null,
        id,
      ],
    );
    if (!result.rowCount) throw new HttpError(404, 'name_media_not_found', 'Name media record was not found');
  },

  async approve(
    user: AuthenticatedUser,
    id: string,
    input: { description: string; audioUrl: string | null; confirmOverwrite: boolean },
  ): Promise<void> {
    const reviewerId = await ensureProfile(user);
    await transaction(async (client) => {
      const current = await client.query<NameMediaRow>(
        'SELECT * FROM divine_name_media WHERE id=? FOR UPDATE',
        [id],
      );
      const row = current.rows[0];
      if (!row) throw new HttpError(404, 'name_media_not_found', 'Name media record was not found');
      const changesApproved =
        row.review_status === 'approved' &&
        (row.approved_description !== input.description || row.approved_audio_url !== input.audioUrl);
      if (changesApproved && !input.confirmOverwrite) {
        throw new HttpError(
          409,
          'approved_content_locked',
          'This record is already approved; resend with confirmOverwrite=true to replace it',
        );
      }
      await client.query(
        `UPDATE divine_name_media SET review_status='approved',approved_description=?,approved_audio_url=?,
           approved_by=?,approved_at=UTC_TIMESTAMP(3) WHERE id=?`,
        [input.description, input.audioUrl, reviewerId, id],
      );
    });
  },

  async reject(id: string, confirmOverwrite: boolean): Promise<void> {
    const result = await query(
      `UPDATE divine_name_media SET review_status='rejected',approved_description=NULL,approved_audio_url=NULL,
         approved_by=NULL,approved_at=NULL
       WHERE id=? AND (review_status<>'approved' OR ?=1)`,
      [id, confirmOverwrite ? 1 : 0],
    );
    if (!result.rowCount) {
      throw new HttpError(
        409,
        'approved_content_locked',
        'Record not found or already approved; resend with confirmOverwrite=true to withdraw it',
      );
    }
  },
};

function toApproved(row: NameMediaRow, audioUrl: string | null, durationMs: number | null): ApprovedNameMedia {
  return {
    nameNumber: row.name_number,
    description: row.approved_description ?? '',
    audioUrl,
    podcastAudioUrl: row.podcast_audio_url,
    durationSeconds: durationMs ? Math.round(durationMs / 1000) : row.video_duration_seconds,
    videoId: row.source_video_id,
    videoTitle: row.video_title,
    watchUrl: `https://www.youtube.com/watch?v=${row.source_video_id}`,
    embedUrl: `https://www.youtube-nocookie.com/embed/${row.source_video_id}`,
    classNumber: row.class_number,
    approvedAt: new Date(row.approved_at ?? row.updated_at).toISOString(),
  };
}

function toReviewItem(row: NameMediaRow) {
  return {
    id: row.id,
    nameNumber: row.name_number,
    videoId: row.source_video_id,
    videoTitle: row.video_title,
    classNumber: row.class_number,
    podcastTitle: row.podcast_title,
    podcastAudioUrl: row.podcast_audio_url,
    audioAssetId: row.audio_asset_id,
    transcriptStatus: row.transcript_status,
    transcriptSource: row.transcript_source,
    transcriptChars: row.transcript_text?.length ?? 0,
    transcriptSegments: asJson<unknown[]>(row.transcript_segments, []),
    descriptionDraft: row.description_draft,
    reviewStatus: row.review_status,
    approvedDescription: row.approved_description,
    approvedAudioUrl: row.approved_audio_url,
    approvedAt: row.approved_at ? new Date(row.approved_at).toISOString() : null,
    lastError: row.last_error,
    importAttempts: row.import_attempts,
  };
}
