import type { StoryItem } from '../types/catalog';
import { IBN_KATHIR_PDF } from './ibnKathirPdfIndex';
import pdfChapters from './prophetChaptersFromPdf.json';
import { prophetBySlug } from './theProphets';
import { toParagraphs } from './text';

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
  pdfPageStart?: number;
  pdfPageEnd?: number;
};

/**
 * Canonical Prophets chapters — extracted from the bundled Ibn Kathir
 * Stories of the Prophets English PDF (see public/sources/).
 */
const bySlug = pdfChapters as unknown as Record<string, ProphetChapter>;

export function getProphetChapter(slug: string): ProphetChapter | undefined {
  if (slug.startsWith('__')) return undefined;
  return (
    bySlug[slug] ??
    (slug === 'muhammad' ? (bySlug as Record<string, ProphetChapter>).__muhammad_boundary__ : undefined)
  );
}

export function listProphetChapterSlugs(): string[] {
  return Object.keys(bySlug).filter((slug) => !slug.startsWith('__') && slug !== 'muhammad');
}

function cuesFromSections(
  chapter: ProphetChapter,
): { startMs: number; endMs: number; textEn: string; textAr: string }[] {
  const chunks: { en: string }[] = [];
  for (const section of chapter.sections) {
    chunks.push({ en: section.heading });
    const paras = toParagraphs(section.body);
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

  // Cap cue count for very long chapters so the audio UI stays usable.
  const maxChunks = 180;
  const used =
    chunks.length <= maxChunks
      ? chunks
      : chunks.filter((_, index) => index % Math.ceil(chunks.length / maxChunks) === 0);

  const durationMs = Math.max(chapter.durationMs, used.length * 8_000);
  const slice = Math.max(Math.floor(durationMs / used.length), 6_000);

  return used.map((chunk, index) => ({
    textEn: chunk.en,
    textAr: index === 0 ? chapter.titleAr : '',
    startMs: index * slice,
    endMs: index === used.length - 1 ? durationMs : (index + 1) * slice,
  }));
}

/** Build a catalog StoryItem from the Ibn Kathir PDF chapter for a prophet slug. */
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
  const figure = prophetBySlug(slug);
  const pageLabel =
    chapter.pdfPageStart && chapter.pdfPageEnd
      ? `pp. ${chapter.pdfPageStart}–${chapter.pdfPageEnd}`
      : `Chapter: ${chapter.nameEn}`;

  return {
    id: existing?.id ?? `prophet-chapter-${slug}`,
    sectionSlug: 'qisas-al-anbiya',
    title: chapter.titleEn,
    titleAr: chapter.titleAr,
    figureName: chapter.nameEn,
    figureNameAr: chapter.nameAr,
    honorific: existing?.honorific ?? figure?.honorificEn ?? 'peace be upon him',
    honorificAr: existing?.honorificAr ?? figure?.honorificAr ?? 'عليه السلام',
    summary: figure?.summaryEn ?? chapter.summaryEn,
    content: chapter.contentEn,
    contentAr: existing?.contentAr,
    durationLabel: `${minutes}:${seconds.toString().padStart(2, '0')}`,
    durationMs,
    authenticityGrade: existing?.authenticityGrade ?? 'sahih',
    sourceCitation: chapter.sourceCitation,
    sourceBook: `${IBN_KATHIR_PDF.author} — ${IBN_KATHIR_PDF.title}`,
    sourceVolume: IBN_KATHIR_PDF.edition,
    sourcePageOrHadith: pageLabel,
    // Listen uses client/cloud TTS until a reviewed MP3 is published.
    // Do not inherit placeholder example CDN URLs from fixtures.
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
    keyTakeaway: `Full account of ${chapter.nameEn} from the in-app Ibn Kathir PDF (${pageLabel}).`,
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

export function buildProphetCatalogStories(): StoryItem[] {
  return listProphetChapterSlugs()
    .map((slug) => prophetChapterToStoryItem(slug))
    .filter((story): story is StoryItem => Boolean(story));
}

/** Replace thin prophet fixtures with the full Ibn Kathir chapters (Muhammad ﷺ is under Seerah). */
export function mergeProphetChaptersIntoCatalog(stories: StoryItem[]): StoryItem[] {
  const withoutThinQisas = stories.filter((story) => story.sectionSlug !== 'qisas-al-anbiya');
  return [...withoutThinQisas, ...buildProphetCatalogStories()];
}
