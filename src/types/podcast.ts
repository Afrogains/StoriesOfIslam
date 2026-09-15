import { z } from 'zod';

export type StoryCategory = 'gleanings' | 'prophets' | 'seerah' | 'sahabah';
export type SpeakerRole = 'host_a' | 'host_b';

export const PodcastDialogueTurnSchema = z.object({
  id: z.string().optional(),
  speaker: z.enum(['host_a', 'host_b']),
  text: z.string().describe('Synthesized conversational text spoken by the host'),
  arabicTerms: z.array(z.string()).optional().describe('Key Arabic terms or Hadith vocabulary introduced in this turn'),
  startMs: z.number().optional(),
  endMs: z.number().optional(),
});

export type PodcastDialogueTurn = z.infer<typeof PodcastDialogueTurnSchema>;

export const GeneratePodcastInputSchema = z.object({
  sourceText: z
    .string()
    .min(10, 'Source text must contain classical narration content')
    .max(50_000, 'Source text exceeds the generation safety limit'),
  referenceUrl: z.string().url().or(z.string()),
  category: z.enum(['gleanings', 'prophets', 'seerah', 'sahabah']),
  title: z.string().optional(),
  titleAr: z.string().optional(),
  scholarSpeaker: z.string().optional(),
});

export type GeneratePodcastInput = z.infer<typeof GeneratePodcastInputSchema>;

export const GeneratedPodcastScriptSchema = z.object({
  storyId: z.string(),
  title: z.string(),
  titleAr: z.string(),
  category: z.enum(['gleanings', 'prophets', 'seerah', 'sahabah']),
  referenceUrl: z.string(),
  scholarSpeaker: z.string(),
  summary: z.string(),
  keyTakeaways: z.array(z.string()).min(2),
  dialogueTurns: z.array(PodcastDialogueTurnSchema).min(2),
  totalDurationMs: z.number(),
});

export type GeneratedPodcastScript = z.infer<typeof GeneratedPodcastScriptSchema>;
