import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import type { AuthenticatedUser } from '../auth/keycloak';
import { getEnv } from '../config/env';
import { query, transaction } from '../db/pool';
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

interface JobRow {
  id: string;
  job_type: JobType;
  status: JobStatus;
  requested_by: string;
  story_id: string | null;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
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
    input: row.input,
    output: row.output,
    attempts: row.attempts,
    maxAttempts: row.max_attempts,
    errorCode: row.error_code,
    errorMessage: row.error_message,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export const jobRepository = {
  async create(
    user: AuthenticatedUser,
    value: { jobType: JobType; storyId?: string; input: Record<string, unknown> },
    idempotencyKey: string,
  ): Promise<GenerationJob> {
    const profileId = await ensureProfile(user);
    const recent = await query<{ count: string }>(
      `SELECT count(*) FROM generation_jobs
       WHERE requested_by=$1 AND created_at >= now() - interval '24 hours'`,
      [profileId],
    );
    if (Number(recent.rows[0]?.count ?? 0) >= getEnv().MAX_GENERATION_JOBS_PER_USER_PER_DAY) {
      throw new HttpError(
        429,
        'generation_budget_exceeded',
        'The daily generation allowance has been reached',
      );
    }
    const result = await query<JobRow>(
      `INSERT INTO generation_jobs(
        id,job_type,requested_by,story_id,input,idempotency_key
      ) VALUES($1,$2,$3,$4,$5,$6)
      ON CONFLICT(idempotency_key) DO UPDATE SET idempotency_key=EXCLUDED.idempotency_key
      RETURNING *`,
      [
        randomUUID(),
        value.jobType,
        profileId,
        value.storyId ?? null,
        JSON.stringify(value.input),
        idempotencyKey,
      ],
    );
    return mapJob(result.rows[0]!);
  },

  async get(id: string): Promise<GenerationJob | null> {
    const result = await query<JobRow>('SELECT * FROM generation_jobs WHERE id=$1', [id]);
    return result.rows[0] ? mapJob(result.rows[0]) : null;
  },

  async cancel(id: string, requestedBy: string, privileged: boolean): Promise<boolean> {
    const result = await query(
      `UPDATE generation_jobs SET status='cancelled'
       WHERE id=$1 AND status='queued' AND ($2 OR requested_by=$3)`,
      [id, privileged, requestedBy],
    );
    return Boolean(result.rowCount);
  },

  async claim(workerId: string): Promise<GenerationJob | null> {
    return transaction(async (client: PoolClient) => {
      const result = await client.query<JobRow>(
        `SELECT * FROM generation_jobs
         WHERE status='queued' AND available_at<=now() AND attempts<max_attempts
         ORDER BY created_at
         FOR UPDATE SKIP LOCKED LIMIT 1`,
      );
      const row = result.rows[0];
      if (!row) return null;
      const claimed = await client.query<JobRow>(
        `UPDATE generation_jobs SET status='running',locked_at=now(),locked_by=$2,
          attempts=attempts+1,error_code=NULL,error_message=NULL
         WHERE id=$1 RETURNING *`,
        [row.id, workerId],
      );
      return mapJob(claimed.rows[0]!);
    });
  },

  async complete(id: string, output: Record<string, unknown>, reviewRequired = true): Promise<void> {
    await query(
      `UPDATE generation_jobs SET status=$2,output=$3,completed_at=now(),
        locked_at=NULL,locked_by=NULL WHERE id=$1`,
      [id, reviewRequired ? 'review_required' : 'completed', JSON.stringify(output)],
    );
  },

  async fail(id: string, error: unknown): Promise<void> {
    const job = await this.get(id);
    if (!job) return;
    const retry = job.attempts < job.maxAttempts;
    await query(
      `UPDATE generation_jobs SET status=$2,error_code=$3,error_message=$4,
        available_at=CASE WHEN $2='queued' THEN now() + (interval '30 seconds' * attempts) ELSE available_at END,
        locked_at=NULL,locked_by=NULL WHERE id=$1`,
      [
        id,
        retry ? 'queued' : 'failed',
        error instanceof Error ? error.name : 'GenerationError',
        error instanceof Error ? error.message.slice(0, 1000) : String(error).slice(0, 1000),
      ],
    );
  },
};
