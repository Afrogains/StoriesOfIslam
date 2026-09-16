import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../auth/keycloak';
import { CreateGenerationJobSchema } from '../contracts/api';
import { HttpError, asyncHandler } from '../http/errors';
import { jobRepository } from '../repositories/jobRepository';
import { ensureProfile } from '../repositories/userRepository';

const JobIdSchema = z.string().uuid();
const operatorRoles = ['editor', 'reviewer', 'admin'];

export const jobsRouter = Router();
jobsRouter.use(requireAuth);

jobsRouter.post(
  '/',
  requireRole('editor', 'admin'),
  asyncHandler(async (request, response) => {
    const value = CreateGenerationJobSchema.parse(request.body);
    const suppliedKey = request.header('idempotency-key')?.trim();
    const idempotencyKey = suppliedKey || randomUUID();
    if (idempotencyKey.length > 160) {
      throw new HttpError(400, 'invalid_idempotency_key', 'Idempotency key is too long');
    }
    const job = await jobRepository.create(request.user!, value, idempotencyKey);
    response
      .status(job.status === 'queued' ? 202 : 200)
      .setHeader('Location', `/v1/generation-jobs/${job.id}`)
      .json({ data: job });
  }),
);

jobsRouter.get(
  '/:jobId',
  asyncHandler(async (request, response) => {
    const job = await jobRepository.get(JobIdSchema.parse(request.params.jobId));
    if (!job) throw new HttpError(404, 'job_not_found', 'Generation job was not found');
    const profileId = await ensureProfile(request.user!);
    const privileged = operatorRoles.some((role) => request.user!.roles.includes(role));
    if (!privileged && job.requestedBy !== profileId) {
      throw new HttpError(403, 'job_forbidden', 'You cannot access this generation job');
    }
    response.setHeader('Cache-Control', 'private,no-store');
    response.json({ data: job });
  }),
);

jobsRouter.delete(
  '/:jobId',
  asyncHandler(async (request, response) => {
    const jobId = JobIdSchema.parse(request.params.jobId);
    const profileId = await ensureProfile(request.user!);
    const privileged = operatorRoles.some((role) => request.user!.roles.includes(role));
    const cancelled = await jobRepository.cancel(jobId, profileId, privileged);
    if (!cancelled) {
      throw new HttpError(409, 'job_not_cancellable', 'Only queued jobs can be cancelled');
    }
    response.status(204).end();
  }),
);
