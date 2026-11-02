import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../auth/keycloak';
import { ProgressUpdateSchema } from '../contracts/api';
import { asyncHandler } from '../http/errors';
import { LOCAL_SUBJECT_PREFIX } from '../auth/localAuth';
import { accountRepository } from '../repositories/accountRepository';
import { ensureProfile, userRepository } from '../repositories/userRepository';
import { keycloakAdminService } from '../services/KeycloakAdminService';

const StoryIdSchema = z.string().uuid();
const CatalogStoryIdSchema = z.string().regex(/^[a-z0-9][a-z0-9-]{0,159}$/i);
export const GameSectionSchema = z.enum(['all', 'qisas-al-anbiya', 'qisas-al-quran', 'seerah-shamail', 'sahabah']);

const QuizResultsSchema = z.object({
  results: z
    .array(
      z
        .object({
          storyId: CatalogStoryIdSchema,
          chapterIndex: z.number().int().min(0).max(200),
          score: z.number().int().min(0).max(20),
          total: z.number().int().min(1).max(20),
          completedAt: z.string().datetime(),
        })
        .refine((value) => value.score <= value.total, 'score cannot exceed total'),
    )
    .min(1)
    .max(500),
});

const GameScoreSchema = z
  .object({
    section: GameSectionSchema,
    score: z.number().int().min(0).max(100_000),
    correct: z.number().int().min(0).max(50),
    total: z.number().int().min(1).max(50),
    bestStreak: z.number().int().min(0).max(50),
    playedAt: z.string().datetime(),
  })
  .refine((value) => value.correct <= value.total && value.bestStreak <= value.correct, 'inconsistent score');

export const meRouter = Router();
meRouter.use(requireAuth);

meRouter.get(
  '/favorites',
  asyncHandler(async (request, response) => {
    response.setHeader('Cache-Control', 'private,no-store');
    response.json({ data: await userRepository.listFavorites(request.user!) });
  }),
);

meRouter.put(
  '/favorites/:storyId',
  asyncHandler(async (request, response) => {
    const storyId = StoryIdSchema.parse(request.params.storyId);
    await userRepository.addFavorite(request.user!, storyId);
    response.status(204).end();
  }),
);

meRouter.delete(
  '/favorites/:storyId',
  asyncHandler(async (request, response) => {
    const storyId = StoryIdSchema.parse(request.params.storyId);
    await userRepository.removeFavorite(request.user!, storyId);
    response.status(204).end();
  }),
);

meRouter.get(
  '/progress',
  asyncHandler(async (request, response) => {
    response.setHeader('Cache-Control', 'private,no-store');
    response.json({ data: await userRepository.listProgress(request.user!) });
  }),
);

meRouter.put(
  '/progress/:storyId',
  asyncHandler(async (request, response) => {
    const storyId = StoryIdSchema.parse(request.params.storyId);
    const update = ProgressUpdateSchema.parse(request.body);
    await userRepository.updateProgress(request.user!, storyId, update);
    response.status(204).end();
  }),
);

meRouter.get(
  '/profile',
  asyncHandler(async (request, response) => {
    const profileId = await ensureProfile(request.user!);
    const profile = await accountRepository.getProfile(profileId);
    response.setHeader('Cache-Control', 'private,no-store');
    response.json({ data: profile });
  }),
);

meRouter.get(
  '/quiz-results',
  asyncHandler(async (request, response) => {
    const profileId = await ensureProfile(request.user!);
    response.setHeader('Cache-Control', 'private,no-store');
    response.json({ data: await accountRepository.listQuizResults(profileId) });
  }),
);

meRouter.post(
  '/quiz-results',
  asyncHandler(async (request, response) => {
    const { results } = QuizResultsSchema.parse(request.body);
    const profileId = await ensureProfile(request.user!);
    await accountRepository.upsertQuizResults(profileId, results);
    response.status(204).end();
  }),
);

meRouter.get(
  '/game-scores',
  asyncHandler(async (request, response) => {
    const profileId = await ensureProfile(request.user!);
    response.setHeader('Cache-Control', 'private,no-store');
    response.json({ data: await accountRepository.gameSummary(profileId) });
  }),
);

meRouter.post(
  '/game-scores',
  asyncHandler(async (request, response) => {
    const score = GameScoreSchema.parse(request.body);
    const profileId = await ensureProfile(request.user!);
    await accountRepository.addGameScore(profileId, score);
    response.status(201).json({ data: await accountRepository.gameSummary(profileId) });
  }),
);

meRouter.delete(
  '/',
  asyncHandler(async (request, response) => {
    const subject = request.user!.subject;
    if (subject.startsWith(LOCAL_SUBJECT_PREFIX)) {
      const profileId = await ensureProfile(request.user!);
      await accountRepository.deleteLocalAccount(profileId);
      await userRepository.softDeleteAccount(request.user!);
      response.status(204).end();
      return;
    }
    // Delete the identity first; if this fails, local user data remains intact
    // and the operation can be retried safely.
    await keycloakAdminService.deleteUser(subject);
    await userRepository.softDeleteAccount(request.user!);
    response.status(204).end();
  }),
);
