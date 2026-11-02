import { sectionsMeta } from './catalogMeta';
import { allStandardStories } from './mockHome';
import { mergeProphetChaptersIntoCatalog } from './prophetChapters';
import { mergeQuranStoriesIntoCatalog } from './quranStories';
import { mergeSahabahChaptersIntoCatalog } from './sahabahChapters';
import { mergeSeerahTimelineIntoCatalog } from './seerahTimeline';
import type { StoryItem } from '../types/catalog';

export function publishedCatalogStories(stories: StoryItem[]): StoryItem[] {
  return stories.filter((story) => story.sectionSlug in sectionsMeta);
}

/**
 * In-app catalog is the production source of truth until HostAfrica publishes a
 * richer reviewed feed. Metro includes these chapters in every export.
 */
export function loadBundledCatalog(): StoryItem[] {
  return publishedCatalogStories(
    mergeQuranStoriesIntoCatalog(
      mergeSeerahTimelineIntoCatalog(
        mergeProphetChaptersIntoCatalog(mergeSahabahChaptersIntoCatalog(allStandardStories)),
      ),
    ),
  );
}
