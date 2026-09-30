import type { SectionSlug, StoryItem } from '../types/catalog';
import { sectionsMeta } from './catalogMeta';

export const SECTION_ORDER = Object.keys(sectionsMeta) as SectionSlug[];

/**
 * Pick one story from each catalog section so Home suggestions span
 * Prophets, Seerah, Sahabah, and Narratives rather than clustering one shelf.
 */
export function pickCrossCategorySuggestions(
  stories: StoryItem[],
  options?: { excludeId?: string | null; limit?: number },
): StoryItem[] {
  const excludeId = options?.excludeId ?? null;
  const limit = options?.limit ?? SECTION_ORDER.length;
  const picks: StoryItem[] = [];

  for (const slug of SECTION_ORDER) {
    if (picks.length >= limit) break;
    const match = stories.find(
      (story) => story.sectionSlug === slug && story.id !== excludeId,
    );
    if (match) picks.push(match);
  }

  return picks;
}

/** Group stories in stable section order for categorized Explore browse. */
export function groupStoriesBySection(
  stories: StoryItem[],
): { slug: SectionSlug; stories: StoryItem[] }[] {
  return SECTION_ORDER.map((slug) => ({
    slug,
    stories: stories.filter((story) => story.sectionSlug === slug),
  })).filter((group) => group.stories.length > 0);
}
