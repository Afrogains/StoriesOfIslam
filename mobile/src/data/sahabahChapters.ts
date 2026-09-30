import type { StoryItem } from '../types/catalog';
import { SAHABAH_PDF } from './sahabahPdfIndex';
import pdfChapters from './sahabahChaptersFromPdf.json';

export type SahabahChapterSection = {
  heading: string;
  body: string;
};

export type SahabahChapter = {
  slug: string;
  titleEn: string;
  titleAr: string;
  nameEn: string;
  nameAr: string;
  honorificEn?: string;
  honorificAr?: string;
  contentEn: string;
  summaryEn: string;
  sections: SahabahChapterSection[];
  durationMs: number;
  sourceCitation: string;
  pdfPageStart?: number;
  pdfPageEnd?: number;
};

const bySlug = pdfChapters as unknown as Record<string, SahabahChapter>;

export function getSahabahChapter(slug: string): SahabahChapter | undefined {
  return bySlug[slug];
}

export function listSahabahChapterSlugs(): string[] {
  return Object.keys(bySlug);
}

function cuesFromSections(
  chapter: SahabahChapter,
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
      // Shorter cue groups for a calm educational listen pace.
      if (sentences.length <= 1) {
        chunks.push({ en: para });
      } else {
        for (let i = 0; i < sentences.length; i += 1) {
          chunks.push({ en: sentences[i]! });
        }
      }
    }
  }

  const maxChunks = 200;
  const used =
    chunks.length <= maxChunks
      ? chunks
      : chunks.filter((_, index) => index % Math.ceil(chunks.length / maxChunks) === 0);

  const durationMs = Math.max(chapter.durationMs, used.length * 7_500);
  const slice = Math.max(Math.floor(durationMs / Math.max(used.length, 1)), 5_500);

  return used.map((chunk, index) => ({
    textEn: chunk.en,
    textAr: index === 0 ? chapter.titleAr : '',
    startMs: index * slice,
    endMs: index === used.length - 1 ? durationMs : (index + 1) * slice,
  }));
}

/** Build a catalog StoryItem from the bundled Sahaba PDF chapter. */
export function sahabahChapterToStoryItem(
  slug: string,
  existing?: StoryItem | null,
): StoryItem | null {
  const chapter = getSahabahChapter(slug);
  if (!chapter) return existing ?? null;

  const durationMs = Math.max(chapter.durationMs, existing?.durationMs ?? 0);
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);
  const timedCues = cuesFromSections(chapter);
  const pageLabel =
    chapter.pdfPageStart && chapter.pdfPageEnd
      ? `pp. ${chapter.pdfPageStart}–${chapter.pdfPageEnd}`
      : `Chapter: ${chapter.nameEn}`;

  return {
    id: existing?.id ?? `sahabah-chapter-${slug}`,
    sectionSlug: 'sahabah',
    title: chapter.titleEn,
    titleAr: chapter.titleAr,
    figureName: chapter.nameEn,
    figureNameAr: chapter.nameAr,
    honorific: chapter.honorificEn ?? existing?.honorific ?? 'may Allah be pleased with him',
    honorificAr: chapter.honorificAr ?? existing?.honorificAr ?? 'رضي الله عنه',
    summary: chapter.summaryEn,
    content: chapter.contentEn,
    contentAr: existing?.contentAr,
    durationLabel: `${minutes}:${seconds.toString().padStart(2, '0')}`,
    durationMs,
    authenticityGrade: existing?.authenticityGrade ?? 'historical',
    sourceCitation: chapter.sourceCitation,
    sourceBook: `${SAHABAH_PDF.author} — ${SAHABAH_PDF.title}`,
    sourceVolume: SAHABAH_PDF.edition,
    sourcePageOrHadith: pageLabel,
    hasAudio: true,
    audioUrl:
      existing?.audioUrl &&
      !existing.audioUrl.includes('.example') &&
      !existing.audioUrl.includes('placeholder')
        ? existing.audioUrl
        : null,
    artworkUrl: existing?.artworkUrl ?? null,
    timedCues,
    isFavorite: existing?.isFavorite ?? false,
    keyTakeaway: `Biography of ${chapter.nameEn} from the in-app Sahaba PDF (${pageLabel}).`,
  };
}

/** Prefer an exact companion catalog row, else first sahabah match. */
export function preferSahabahCatalogStory(
  matches: StoryItem[],
  nameEn: string,
): StoryItem | undefined {
  if (!matches.length) return undefined;
  const needle = nameEn.toLowerCase();
  const exact = matches.find((story) => story.figureName.toLowerCase() === needle);
  return exact ?? matches[0];
}

/** All PDF companions as StoryItems for preview / offline catalog. */
export function buildSahabahCatalogStories(): StoryItem[] {
  return listSahabahChapterSlugs()
    .map((slug) => sahabahChapterToStoryItem(slug))
    .filter((story): story is StoryItem => Boolean(story));
}

/** Replace thin sahabah fixtures with full PDF chapters. */
export function mergeSahabahChaptersIntoCatalog(stories: StoryItem[]): StoryItem[] {
  const withoutThinSahabah = stories.filter((story) => story.sectionSlug !== 'sahabah');
  return [...withoutThinSahabah, ...buildSahabahCatalogStories()];
}
