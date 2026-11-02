import { resolveFullText, type StorySection } from './storyText';
import { toParagraphs } from './text';
import type { StoryItem } from '../types/catalog';

export type ChapterBlock = {
  /** Section heading shown above this block; continued sections are suffixed. */
  heading?: string;
  paragraphs: string[];
};

export type StoryChapter = {
  index: number;
  title: string;
  blocks: ChapterBlock[];
  words: number;
};

type Unit = {
  sectionIndex: number;
  sectionStart: boolean;
  heading?: string;
  text: string;
  words: number;
};

const TARGET_WORDS = 900;
const SINGLE_CHAPTER_MAX_WORDS = 700;
const MAX_CHAPTERS = 24;
const MIN_CHAPTER_WORDS = 250;
const LONG_PARAGRAPH_WORDS = 350;

export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/** Breaks very long PDF paragraphs at sentence ends so chapters can split inside them. */
function splitLongParagraph(text: string): string[] {
  if (countWords(text) <= LONG_PARAGRAPH_WORDS) return [text];
  const sentences = text.split(/(?<=[.!?”"])\s+(?=[A-Z“"‘'(])/);
  const chunks: string[] = [];
  let current = '';
  for (const sentence of sentences) {
    const next = current ? `${current} ${sentence}` : sentence;
    if (current && countWords(next) > 250) {
      chunks.push(current);
      current = sentence;
    } else {
      current = next;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function toUnits(sections: StorySection[]): Unit[] {
  const units: Unit[] = [];
  sections.forEach((section, sectionIndex) => {
    const paragraphs = toParagraphs(section.body).flatMap(splitLongParagraph);
    paragraphs.forEach((text, paragraphIndex) => {
      units.push({
        sectionIndex,
        sectionStart: paragraphIndex === 0,
        heading: section.heading?.trim() || undefined,
        text,
        words: countWords(text),
      });
    });
  });
  return units;
}

function groupUnits(units: Unit[]): Unit[][] {
  const total = units.reduce((sum, unit) => sum + unit.words, 0);
  if (total <= SINGLE_CHAPTER_MAX_WORDS || units.length < 2) return [units];

  const count = Math.min(MAX_CHAPTERS, Math.max(2, Math.round(total / TARGET_WORDS)));
  const target = total / count;
  const groups: Unit[][] = [];
  let current: Unit[] = [];
  let words = 0;

  for (const unit of units) {
    const preferBreak = unit.sectionStart && words >= target * 0.7;
    const forceBreak = words >= target * 1.3;
    if (current.length && (preferBreak || forceBreak)) {
      groups.push(current);
      current = [];
      words = 0;
    }
    current.push(unit);
    words += unit.words;
  }
  if (current.length) groups.push(current);

  const groupWords = (group: Unit[]) => group.reduce((sum, unit) => sum + unit.words, 0);
  for (let index = groups.length - 1; index >= 0 && groups.length > 1; index -= 1) {
    if (groupWords(groups[index]) >= Math.max(MIN_CHAPTER_WORDS, target * 0.35)) continue;
    if (index === 0) {
      groups[1].unshift(...groups[0]);
    } else {
      groups[index - 1].push(...groups[index]);
    }
    groups.splice(index, 1);
  }
  return groups;
}

function toChapter(units: Unit[], index: number): StoryChapter {
  const blocks: ChapterBlock[] = [];
  let lastSection = -1;
  for (const unit of units) {
    if (unit.sectionIndex !== lastSection) {
      const heading = unit.heading
        ? unit.sectionStart
          ? unit.heading
          : `${unit.heading} (continued)`
        : undefined;
      blocks.push({ heading, paragraphs: [] });
      lastSection = unit.sectionIndex;
    }
    blocks[blocks.length - 1].paragraphs.push(unit.text);
  }
  const firstHeading =
    units.find((unit) => unit.sectionStart && unit.heading)?.heading ?? units[0]?.heading;
  return {
    index,
    title: firstHeading ?? `Part ${index + 1}`,
    blocks,
    words: units.reduce((sum, unit) => sum + unit.words, 0),
  };
}

export function buildChapters(sections: StorySection[]): StoryChapter[] {
  const units = toUnits(sections);
  if (!units.length) return [{ index: 0, title: 'Part 1', blocks: [], words: 0 }];
  const chapters = groupUnits(units).map(toChapter);
  const totals = new Map<string, number>();
  for (const chapter of chapters) totals.set(chapter.title, (totals.get(chapter.title) ?? 0) + 1);
  const seen = new Map<string, number>();
  return chapters.map((chapter) => {
    if ((totals.get(chapter.title) ?? 0) < 2) return chapter;
    const occurrence = (seen.get(chapter.title) ?? 0) + 1;
    seen.set(chapter.title, occurrence);
    return { ...chapter, title: `${chapter.title} · Part ${occurrence}` };
  });
}

const chapterCache = new Map<string, StoryChapter[]>();

export function getStoryChapters(story: StoryItem): StoryChapter[] {
  const cached = chapterCache.get(story.id);
  if (cached) return cached;
  const chapters = buildChapters(resolveFullText(story).sections);
  chapterCache.set(story.id, chapters);
  return chapters;
}

export function chapterPlainText(chapter: StoryChapter): string {
  return chapter.blocks.flatMap((block) => block.paragraphs).join('\n\n');
}
