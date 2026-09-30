import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';
import type { AuthenticatedUser } from '../auth/keycloak';
import { getEnv } from '../config/env';
import { asJson, query, transaction } from '../db/pool';
import { HttpError } from '../http/errors';
import { ensureProfile } from './userRepository';

export type JobType = 'podcast_script' | 'voice_synthesis' | 'full_episode';
export type JobStatus =
  | 'queued'
  | 'running'
  | 'review_required'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface GenerationJob {
  id: string;
  jobType: JobType;
  status: JobStatus;
  requestedBy: string;
  storyId: string | null;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  attempts: number;
  maxAttempts: number;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

interface JobRow extends RowDataPacket {
  id: string;
  job_type: JobType;
  status: JobStatus;
  requested_by: string;
  story_id: string | null;
  input: unknown;
  output: unknown;
  attempts: number;
  max_attempts: number;
  error_code: string | null;
  error_message: string | null;
  created_at: Date;
  updated_at: Date;
}

function mapJob(row: JobRow): GenerationJob {
  return {
    id: row.id,
    jobType: row.job_type,
    status: row.status,
    requestedBy: row.requested_by,
    storyId: row.story_id,
    input: asJson<Record<string, unknown>>(row.input, {}),
    output: row.output == null ? null : asJson<Record<string, unknown>>(row.output, {}),
    attempts: row.attempts,
    maxAttempts: row.max_attempts,
    errorCode: row.error_code,
    errorMessage: row.error_message,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export const jobRepository = {
  async create(
    user: AuthenticatedUser,
    value: { jobType: JobType; storyId?: string; input: Record<string, unknown> },
    idempotencyKey: string,
  ): Promise<GenerationJob> {
    const profileId = await ensureProfile(user);
    const recent = await query<RowDataPacket & { count: number }>(
      `SELECT COUNT(*) AS count FROM generation_jobs
       WHERE requested_by=? AND created_at >= (UTC_TIMESTAMP(3) - INTERVAL 24 HOUR)`,
      [profileId],
    );
    if (Number(recent.rows[0]?.count ?? 0) >= getEnv().MAX_GENERATION_JOBS_PER_USER_PER_DAY) {
      throw new HttpError(
        429,
        'generation_budget_exceeded',
        'The daily generation allowance has been reached',
      );
    }

    const id = randomUUID();
    await query(
      `INSERT INTO generation_jobs(
        id,job_type,requested_by,story_id,input,idempotency_key
      ) VALUES(?,?,?,?,?,?)
      ON DUPLICATE KEY UPDATE id=id`,
      [
        id,
        value.jobType,
        profileId,
        value.storyId ?? null,
        JSON.stringify(value.input),
        idempotencyKey,
      ],
    );
    const existing = await query<JobRow>(
      'SELECT * FROM generation_jobs WHERE idempotency_key=? LIMIT 1',
      [idempotencyKey],
    );
    return mapJob(existing.rows[0]!);
  },

  async get(id: string): Promise<GenerationJob | null> {
    const result = await query<JobRow>('SELECT * FROM generation_jobs WHERE id=? LIMIT 1', [id]);
    return result.rows[0] ? mapJob(result.rows[0]) : null;
  },

  async cancel(id: string, requestedBy: string, privileged: boolean): Promise<boolean> {
    const result = await query(
      `UPDATE generation_jobs SET status='cancelled'
       WHERE id=? AND status='queued' AND (? OR requested_by=?)`,
      [id, privileged ? 1 : 0, requestedBy],
    );
    return result.rowCount > 0;
  },

  async claim(workerId: string): Promise<GenerationJob | null> {
    return transaction(async (client) => {
      const result = await client.query<JobRow>(
        `SELECT * FROM generation_jobs
         WHERE status='queued' AND available_at<=UTC_TIMESTAMP(3) AND attempts<max_attempts
         ORDER BY created_at
         FOR UPDATE SKIP LOCKED LIMIT 1`,
      );
      const row = result.rows[0];
      if (!row) return null;
      await client.query(
        `UPDATE generation_jobs SET status='running',locked_at=UTC_TIMESTAMP(3),locked_by=?,
          attempts=attempts+1,error_code=NULL,error_message=NULL
         WHERE id=?`,
        [workerId, row.id],
      );
      const claimed = await client.query<JobRow>(
        'SELECT * FROM generation_jobs WHERE id=? LIMIT 1',
        [row.id],
      );
      return mapJob(claimed.rows[0]!);
    });
  },

  async complete(id: string, output: Record<string, unknown>, reviewRequired = true): Promise<void> {
    await query(
      `UPDATE generation_jobs SET status=?,output=?,completed_at=UTC_TIMESTAMP(3),
        locked_at=NULL,locked_by=NULL WHERE id=?`,
      [reviewRequired ? 'review_required' : 'completed', JSON.stringify(output), id],
    );
  },

  async fail(id: string, error: unknown): Promise<void> {
    const job = await this.get(id);
    if (!job) return;
    const retry = job.attempts < job.maxAttempts;
    const nextStatus = retry ? 'queued' : 'failed';
    await query(
      `UPDATE generation_jobs SET status=?,error_code=?,error_message=?,
        available_at=CASE WHEN ?='queued'
          THEN DATE_ADD(UTC_TIMESTAMP(3), INTERVAL (30 * attempts) SECOND)
          ELSE available_at END,
        locked_at=NULL,locked_by=NULL WHERE id=?`,
      [
        nextStatus,
        error instanceof Error ? error.name : 'GenerationError',
        error instanceof Error ? error.message.slice(0, 1000) : String(error).slice(0, 1000),
        nextStatus,
        id,
      ],
    );
  },
};
