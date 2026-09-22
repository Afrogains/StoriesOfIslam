import type { StoryItem } from '../types/catalog';
import { prophetChaptersData } from './prophetChaptersData';

export type ProphetChapterSection = {
  heading: string;
  body: string;
};

export type ProphetChapter = {
  slug: string;
  titleEn: string;
  titleAr: string;
  nameEn: string;
  nameAr: string;
  contentEn: string;
  summaryEn: string;
  sections: ProphetChapterSection[];
  durationMs: number;
  sourceCitation: string;
};

const bySlug = prophetChaptersData as unknown as Record<string, ProphetChapter>;

export function getProphetChapter(slug: string): ProphetChapter | undefined {
  return bySlug[slug];
}

export function listProphetChapterSlugs(): string[] {
  return Object.keys(bySlug);
}

function cuesFromSections(
  chapter: ProphetChapter,
): { startMs: number; endMs: number; textEn: string; textAr: string }[] {
  const chunks: { en: string }[] = [];
  for (const section of chapter.sections) {
    chunks.push({ en: section.heading });
    const paras = section.body
      .split(/\n+/)
      .map((p) => p.trim())
      .filter(Boolean);
    for (const para of paras) {
      const sentences = para
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (sentences.length <= 2) {
        chunks.push({ en: para });
      } else {
        for (let i = 0; i < sentences.length; i += 2) {
          chunks.push({ en: sentences.slice(i, i + 2).join(' ') });
        }
      }
    }
  }

  const durationMs = Math.max(chapter.durationMs, chunks.length * 12_000);
  const slice = Math.max(Math.floor(durationMs / chunks.length), 10_000);

  return chunks.map((chunk, index) => ({
    textEn: chunk.en,
    textAr: index === 0 ? chapter.titleAr : '',
    startMs: index * slice,
    endMs: index === chunks.length - 1 ? durationMs : (index + 1) * slice,
  }));
}

/** Build a catalog StoryItem from the Ibn Kathir chapter paraphrase for a prophet slug. */
export function prophetChapterToStoryItem(
  slug: string,
  existing?: StoryItem | null,
): StoryItem | null {
  const chapter = getProphetChapter(slug);
  if (!chapter) return existing ?? null;

  const durationMs = Math.max(chapter.durationMs, existing?.durationMs ?? 0);
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);
  const timedCues = cuesFromSections(chapter);

  return {
    id: existing?.id ?? `prophet-chapter-${slug}`,
    sectionSlug: 'qisas-al-anbiya',
    title: chapter.titleEn,
    titleAr: chapter.titleAr,
    figureName: chapter.nameEn,
    figureNameAr: chapter.nameAr,
    honorific: existing?.honorific ?? 'peace be upon him',
    honorificAr: existing?.honorificAr ?? 'عليه السلام',
    summary: chapter.summaryEn,
    content: chapter.contentEn,
    contentAr: existing?.contentAr,
    durationLabel: `${minutes}:${seconds.toString().padStart(2, '0')}`,
    durationMs,
    authenticityGrade: existing?.authenticityGrade ?? 'sahih',
    sourceCitation: chapter.sourceCitation,
    sourceBook: 'Ibn Kathir — Stories of the Prophets (Qisas al-Anbiya)',
    sourceVolume: 'English teaching edition',
    sourcePageOrHadith: `Chapter: ${chapter.nameEn}`,
    hasAudio: existing?.hasAudio ?? false,
    audioUrl: existing?.audioUrl ?? null,
    artworkUrl: existing?.artworkUrl ?? null,
    timedCues,
    isFavorite: existing?.isFavorite ?? false,
    keyTakeaway: `Full teaching account of ${chapter.nameEn} from Ibn Kathir’s Stories of the Prophets.`,
  };
}

/** Prefer “The Story of …” catalog row for a prophet, then any qisas match. */
export function preferProphetCatalogStory(
  matches: StoryItem[],
  nameEn: string,
): StoryItem | undefined {
  if (!matches.length) return undefined;
  const needle = nameEn.toLowerCase();
  const exact = matches.find((story) => {
    const title = story.title.toLowerCase();
    return (
      title === `the story of ${needle}` ||
      title.startsWith(`the story of ${needle} `) ||
      title.startsWith(`the story of ${needle} and`)
    );
  });
  return exact ?? matches[0];
}
