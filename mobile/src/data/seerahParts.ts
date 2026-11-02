import type { StoryItem } from '../types/catalog';
import { IBN_KATHIR_PDF } from './ibnKathirPdfIndex';
import { getProphetChapter, type ProphetChapterSection } from './prophetChapters';
import { toParagraphs } from './text';

export type SeerahPartDef = {
  sortOrder: number;
  slug: string;
  titleEn: string;
  titleAr: string;
  summaryEn: string;
  /** Inclusive indexes into the Ibn Kathir Muhammad chapter sections. */
  fromSection: number;
  toSection: number;
};

/**
 * Seven chronological Seerah shelves — enough to teach the life in order
 * without turning Seerah into one card per PDF heading.
 */
export const SEERAH_PARTS: SeerahPartDef[] = [
  {
    sortOrder: 1,
    slug: 'seerah-youth-in-makkah',
    titleEn: 'Youth in Makkah',
    titleAr: 'نشأته في مكة',
    summaryEn:
      'Birth, orphanhood, the journey to Busra, his honest character, and marriage to Khadijah.',
    fromSection: 0,
    toSection: 7,
  },
  {
    sortOrder: 2,
    slug: 'seerah-the-first-call',
    titleEn: 'The First Call',
    titleAr: 'بدء الدعوة',
    summaryEn:
      'The first visions, the command to rise and warn, the earliest companions, and the start of public preaching.',
    fromSection: 8,
    toSection: 15,
  },
  {
    sortOrder: 3,
    slug: 'seerah-trial-in-makkah',
    titleEn: 'Trial in Makkah',
    titleAr: 'المحنة في مكة',
    summaryEn:
      'Persecution, the migration to Abyssinia, Abu Talib’s protection, Umar’s Islam, and the Year of Sorrow.',
    fromSection: 16,
    toSection: 24,
  },
  {
    sortOrder: 4,
    slug: 'seerah-night-journey',
    titleEn: 'The Night Journey',
    titleAr: 'الإسراء والمعراج',
    summaryEn:
      'The people of Yathrib accept him, then the Isra and Mi‘raj and the gift of the five prayers.',
    fromSection: 25,
    toSection: 35,
  },
  {
    sortOrder: 5,
    slug: 'seerah-the-hijrah',
    titleEn: 'The Hijrah',
    titleAr: 'الهجرة إلى المدينة',
    summaryEn:
      'The pledges of Aqabah, the plot to kill him, the journey with Abu Bakr, and the mosque in Madinah.',
    fromSection: 36,
    toSection: 42,
  },
  {
    sortOrder: 6,
    slug: 'seerah-struggle-and-opening',
    titleEn: 'Struggle and the Opening',
    titleAr: 'المغازي وفتح مكة',
    summaryEn:
      'Badr, Uhud, the Confederates, Hudaibiyyah, Khaybar, and the opening of Makkah.',
    fromSection: 43,
    toSection: 58,
  },
  {
    sortOrder: 7,
    slug: 'seerah-farewell',
    titleEn: 'The Farewell',
    titleAr: 'حجة الوداع واللحاق بالرفيق الأعلى',
    summaryEn:
      'The Farewell Sermon at Arafat, the return to Madinah, his last days, and his passing.',
    fromSection: 59,
    toSection: 63,
  },
];

export const SEERAH_SERIES = {
  title: 'Seerah of the Prophet ﷺ',
  credit: 'Ibn Kathir — Seerah of Muhammad ﷺ (in-app PDF)',
  description:
    'The life of the Messenger ﷺ, grouped into seven parts from the bundled Ibn Kathir chapter so Seerah stays readable.',
} as const;

export type SeerahPartChapter = {
  slug: string;
  titleEn: string;
  titleAr: string;
  summaryEn: string;
  contentEn: string;
  sections: ProphetChapterSection[];
  durationMs: number;
  sortOrder: number;
};

function cuesFromSections(
  sections: ProphetChapterSection[],
  durationMs: number,
): { startMs: number; endMs: number; textEn: string; textAr: string }[] {
  const chunks: { en: string }[] = [];
  for (const section of sections) {
    chunks.push({ en: section.heading });
    for (const para of toParagraphs(section.body)) {
      const sentences = para
        .split(/(?<=[.!?])\s+/)
        .map((part) => part.trim())
        .filter(Boolean);
      if (sentences.length <= 2) chunks.push({ en: para });
      else {
        for (let i = 0; i < sentences.length; i += 2) {
          chunks.push({ en: sentences.slice(i, i + 2).join(' ') });
        }
      }
    }
  }
  const maxChunks = 180;
  const used =
    chunks.length <= maxChunks
      ? chunks
      : chunks.filter((_, index) => index % Math.ceil(chunks.length / maxChunks) === 0);
  const slice = Math.max(Math.floor(durationMs / Math.max(used.length, 1)), 6_000);
  return used.map((chunk, index) => ({
    textEn: chunk.en,
    textAr: '',
    startMs: index * slice,
    endMs: index === used.length - 1 ? durationMs : (index + 1) * slice,
  }));
}

function buildParts(): SeerahPartChapter[] {
  const source = getProphetChapter('muhammad');
  const sections = source?.sections ?? [];
  return SEERAH_PARTS.map((part) => {
    const slice = sections.slice(part.fromSection, part.toSection + 1);
    const contentEn = slice
      .map((section) => `${section.heading}\n\n${section.body}`.trim())
      .join('\n\n');
    const durationMs = Math.max(90_000, Math.round(contentEn.length * 18));
    return {
      slug: part.slug,
      titleEn: part.titleEn,
      titleAr: part.titleAr,
      summaryEn: part.summaryEn,
      contentEn,
      sections: slice,
      durationMs,
      sortOrder: part.sortOrder,
    };
  });
}

const partsBySlug = new Map(buildParts().map((part) => [part.slug, part]));

export function getSeerahPart(slug: string): SeerahPartChapter | undefined {
  return partsBySlug.get(slug);
}

export function listSeerahPartSlugs(): string[] {
  return SEERAH_PARTS.map((part) => part.slug);
}

export function seerahPartToStoryItem(slug: string): StoryItem | null {
  const part = getSeerahPart(slug);
  const def = SEERAH_PARTS.find((item) => item.slug === slug);
  if (!part || !def) return null;
  const minutes = Math.floor(part.durationMs / 60000);
  const seconds = Math.floor((part.durationMs % 60000) / 1000);
  return {
    id: part.slug,
    sectionSlug: 'seerah-shamail',
    title: part.titleEn,
    titleAr: part.titleAr,
    figureName: 'Muhammad',
    figureNameAr: 'محمد',
    honorific: 'peace and blessings of Allah be upon him',
    honorificAr: 'صلى الله عليه وسلم',
    summary: part.summaryEn,
    content: part.contentEn,
    durationLabel: `${minutes}:${seconds.toString().padStart(2, '0')}`,
    durationMs: part.durationMs,
    authenticityGrade: 'historical',
    sourceCitation: 'Ibn Kathir, Stories of the Prophets — Seerah of Muhammad ﷺ (in-app English PDF)',
    sourceBook: `${IBN_KATHIR_PDF.author} — ${IBN_KATHIR_PDF.title}`,
    sourceVolume: IBN_KATHIR_PDF.edition,
    sourcePageOrHadith: `pp. 188–227 · Part ${def.sortOrder} of 7`,
    hasAudio: true,
    audioUrl: null,
    timedCues: cuesFromSections(part.sections, part.durationMs),
    isFavorite: false,
    keyTakeaway: `${part.titleEn}: part ${def.sortOrder} of the Seerah from the in-app Ibn Kathir PDF.`,
  };
}

export function buildSeerahCatalogStories(): StoryItem[] {
  return listSeerahPartSlugs()
    .map((slug) => seerahPartToStoryItem(slug))
    .filter((story): story is StoryItem => Boolean(story));
}

/** Keep short Shama’il fixtures and add the seven Ibn Kathir Seerah parts in order. */
export function mergeSeerahChaptersIntoCatalog(stories: StoryItem[]): StoryItem[] {
  const rest = stories.filter((story) => story.sectionSlug !== 'seerah-shamail');
  const existing = stories.filter((story) => story.sectionSlug === 'seerah-shamail');
  return [...rest, ...buildSeerahCatalogStories(), ...existing];
}
