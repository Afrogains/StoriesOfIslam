import { Router } from 'express';
import { CategorySlugSchema, StoryQuerySchema } from '../contracts/api';
import { HttpError, asyncHandler } from '../http/errors';
import { catalogRepository } from '../repositories/catalogRepository';
import { namesMediaRepository } from '../repositories/namesMediaRepository';

export const catalogRouter = Router();

/** Only reviewer-approved lesson notes and audio are exposed; drafts and transcripts never are. */
catalogRouter.get(
  '/names/media',
  asyncHandler(async (_request, response) => {
    response.setHeader('Cache-Control', 'public,max-age=300,stale-while-revalidate=3600');
    response.json({ data: await namesMediaRepository.listApproved() });
  }),
);

catalogRouter.get(
  '/categories',
  asyncHandler(async (_request, response) => {
    response.setHeader('Cache-Control', 'public,max-age=300,stale-while-revalidate=3600');
    response.json({ data: await catalogRepository.listCategories() });
  }),
);

catalogRouter.get(
  '/figures',
  asyncHandler(async (request, response) => {
    const category = request.query.category
      ? CategorySlugSchema.parse(request.query.category)
      : undefined;
    response.setHeader('Cache-Control', 'public,max-age=300,stale-while-revalidate=3600');
    response.json({ data: await catalogRepository.listFigures(category) });
  }),
);

catalogRouter.get(
  '/stories',
  asyncHandler(async (request, response) => {
    const filters = StoryQuerySchema.parse(request.query);
    const result = await catalogRepository.listStories(filters);
    response.setHeader('Cache-Control', 'public,max-age=60,stale-while-revalidate=300');
    response.json({ data: result.items, pagination: {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      pageCount: Math.ceil(result.total / result.pageSize),
    } });
  }),
);

catalogRouter.get(
  '/stories/:idOrSlug',
  asyncHandler(async (request, response) => {
    const story = await catalogRepository.getStory(request.params.idOrSlug);
    if (!story) throw new HttpError(404, 'story_not_found', 'Story was not found');
    response.setHeader('Cache-Control', 'public,max-age=60,stale-while-revalidate=300');
    response.json({ data: story });
  }),
);
