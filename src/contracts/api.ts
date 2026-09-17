import { z } from 'zod';

export const CategorySlugSchema = z.enum([
  'qisas-al-anbiya',
  'seerah-shamail',
  'sahabah',
  'gleanings',
]);

export const AuthenticityGradeSchema = z.enum(['sahih', 'hasan', 'athar', 'historical']);

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export const StoryQuerySchema = PaginationSchema.extend({
  category: CategorySlugSchema.optional(),
  grade: AuthenticityGradeSchema.optional(),
  search: z.string().trim().max(120).optional(),
  hasAudio: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
});

export const ProgressUpdateSchema = z.object({
  positionMs: z.number().int().min(0).max(86_400_000),
  completed: z.boolean().default(false),
});

export const CreateGenerationJobSchema = z.object({
  jobType: z.enum(['podcast_script', 'voice_synthesis', 'full_episode']),
  storyId: z.string().uuid().optional(),
  input: z.record(z.string(), z.unknown()),
});

export type StoryQuery = z.infer<typeof StoryQuerySchema>;
