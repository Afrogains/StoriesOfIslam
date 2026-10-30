import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../http/errors';
import { accountRepository } from '../repositories/accountRepository';
import { ensureProfile } from '../repositories/userRepository';
import { GameSectionSchema } from './me';

export const gameRouter = Router();

gameRouter.get(
  '/leaderboard',
  asyncHandler(async (request, response) => {
    const section = GameSectionSchema.parse(z.string().default('all').parse(request.query.section));
    const viewer = request.user ? await ensureProfile(request.user) : undefined;
    response.setHeader('Cache-Control', 'private,max-age=30');
    response.json({ data: await accountRepository.leaderboard(section, viewer) });
  }),
);
