import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../auth/keycloak';
import { ProgressUpdateSchema } from '../contracts/api';
import { asyncHandler } from '../http/errors';
import { userRepository } from '../repositories/userRepository';
import { keycloakAdminService } from '../services/KeycloakAdminService';

const StoryIdSchema = z.string().uuid();

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

meRouter.delete(
  '/',
  asyncHandler(async (request, response) => {
    // Delete the identity first; if this fails, local user data remains intact
    // and the operation can be retried safely.
    await keycloakAdminService.deleteUser(request.user!.subject);
    await userRepository.softDeleteAccount(request.user!);
    response.status(204).end();
  }),
);
