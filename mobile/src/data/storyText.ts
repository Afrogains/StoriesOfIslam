import { getProphetChapter } from './prophetChapters';
import { getQuranStory } from './quranStories';
import { getSahabahChapter } from './sahabahChapters';
import { getSeerahPart } from './seerahParts';
import { getShortStory } from './shortStoriesFromTheLife';
import { toParagraphs } from './text';
import { theProphets } from './theProphets';
import { theSahabah } from './theSahabah';
import type { StoryItem } from '../types/catalog';

export type StorySection = { heading?: string; body: string };
export type StoryFullText = { sections: StorySection[]; plain: string };

function matchesFigure(story: StoryItem, nameEn: string): boolean {
  const figure = story.figureName.toLowerCase();
  const name = nameEn.toLowerCase();
  return figure === name || figure.includes(name);
}

export function prophetSlugForStory(story: StoryItem): string | null {
  if (story.sectionSlug !== 'qisas-al-anbiya') return null;
  return theProphets.find((item) => matchesFigure(story, item.nameEn))?.slug ?? null;
}

export function sahabahSlugForStory(story: StoryItem): string | null {
  if (story.sectionSlug !== 'sahabah') return null;
  return (
    theSahabah.find((item) => matchesFigure(story, item.nameEn) || story.id.includes(item.slug))
      ?.slug ?? null
  );
}

function fromSections(
  sections: { heading?: string; body: string }[] | undefined,
  plain: string,
): StoryFullText | null {
  if (!sections?.length) return null;
  return {
    sections: sections.map((section) => ({ heading: section.heading, body: section.body })),
    plain,
  };
}

export function resolveFullText(story: StoryItem): StoryFullText {
  const prophetSlug = prophetSlugForStory(story);
  if (prophetSlug) {
    const chapter = getProphetChapter(prophetSlug);
    const resolved = chapter && fromSections(chapter.sections, chapter.contentEn);
    if (resolved) return resolved;
  }

  if (story.sectionSlug === 'qisas-al-quran') {
    const chapter = getQuranStory(story.id);
    const resolved = chapter && fromSections(chapter.sections, chapter.contentEn);
    if (resolved) return resolved;
  }

  if (story.sectionSlug === 'seerah-shamail') {
    const part = getSeerahPart(story.id);
    const fromPart = part && fromSections(part.sections, part.contentEn);
    if (fromPart) return fromPart;
    const shortStory = getShortStory(story.id);
    const fromShort = shortStory && fromSections(shortStory.sections, shortStory.contentEn);
    if (fromShort) return fromShort;
  }

  const sahabahSlug = sahabahSlugForStory(story);
  if (sahabahSlug) {
    const chapter = getSahabahChapter(sahabahSlug);
    const resolved = chapter && fromSections(chapter.sections, chapter.contentEn);
    if (resolved) return resolved;
  }

  const content = (story.content ?? story.summary ?? '').trim();
  const paragraphs = toParagraphs(content).map((body) => ({ body }));
  return { sections: paragraphs.length ? paragraphs : [{ body: content }], plain: content };
}
