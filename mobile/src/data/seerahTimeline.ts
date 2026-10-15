import type { StoryItem } from '../types/catalog';
import { getSeerahPart, seerahPartToStoryItem } from './seerahParts';
import { shortStoryToStoryItem } from './shortStoriesFromTheLife';

export type SeerahEra = 'makkah' | 'journey' | 'madinah';
export type SeerahEntryKind = 'life' | 'lesson';

export type SeerahTimelineEntry = {
  era: SeerahEra;
  kind: SeerahEntryKind;
  slug: string;
};

export const SEERAH_ERA_LABELS: Record<SeerahEra, { en: string; ar: string }> = {
  makkah: { en: 'Makkah', ar: 'مكة' },
  journey: { en: 'The Journey', ar: 'الإسراء والهجرة' },
  madinah: { en: 'Madinah', ar: 'المدينة' },
};

/**
 * One chronological spine for Seerah & Shama’il.
 * Life chapters are Ibn Kathir; lessons are the Iqra short stories
 * placed where they sit in his life (not a second list).
 */
export const SEERAH_TIMELINE: SeerahTimelineEntry[] = [
  { era: 'makkah', kind: 'life', slug: 'seerah-youth-in-makkah' },
  { era: 'makkah', kind: 'lesson', slug: 'short-black-stone' },
  { era: 'makkah', kind: 'life', slug: 'seerah-the-first-call' },
  { era: 'makkah', kind: 'life', slug: 'seerah-trial-in-makkah' },
  { era: 'makkah', kind: 'lesson', slug: 'short-garbage-thrower' },
  { era: 'journey', kind: 'life', slug: 'seerah-night-journey' },
  { era: 'journey', kind: 'life', slug: 'seerah-the-hijrah' },
  { era: 'madinah', kind: 'lesson', slug: 'short-crying-camel' },
  { era: 'madinah', kind: 'lesson', slug: 'short-ramadan-story' },
  { era: 'madinah', kind: 'lesson', slug: 'short-wealth-and-poverty' },
  { era: 'madinah', kind: 'lesson', slug: 'short-promise-to-tell-the-truth' },
  { era: 'madinah', kind: 'life', slug: 'seerah-struggle-and-opening' },
  { era: 'madinah', kind: 'lesson', slug: 'short-parents-in-islam' },
  { era: 'madinah', kind: 'lesson', slug: 'short-what-is-religion' },
  { era: 'madinah', kind: 'lesson', slug: 'short-allah-is-enough' },
  { era: 'madinah', kind: 'lesson', slug: 'short-story-of-alqamah' },
  { era: 'madinah', kind: 'lesson', slug: 'short-wealth-family-deeds' },
  { era: 'madinah', kind: 'lesson', slug: 'short-dialogue-with-a-traveler' },
  { era: 'madinah', kind: 'life', slug: 'seerah-farewell' },
];

export const EMPTY_SEERAH_FIXTURE_IDS = [
  'first-revelation-hira',
  'noble-character-humility',
] as const;

export function resolveSeerahTimelineStory(slug: string): StoryItem | null {
  if (getSeerahPart(slug)) return seerahPartToStoryItem(slug);
  return shortStoryToStoryItem(slug);
}

export function isSeerahTimelineStory(slug: string): boolean {
  return SEERAH_TIMELINE.some((entry) => entry.slug === slug);
}

export function buildSeerahTimelineStories(): StoryItem[] {
  return SEERAH_TIMELINE.map((entry) => resolveSeerahTimelineStory(entry.slug)).filter(
    (story): story is StoryItem => Boolean(story),
  );
}

/** Replace every Seerah fixture with the chronological timeline — no empty cards. */
export function mergeSeerahTimelineIntoCatalog(stories: StoryItem[]): StoryItem[] {
  const empty = new Set<string>(EMPTY_SEERAH_FIXTURE_IDS);
  const rest = stories.filter(
    (story) => story.sectionSlug !== 'seerah-shamail' && !empty.has(story.id),
  );
  return [...rest, ...buildSeerahTimelineStories()];
}
