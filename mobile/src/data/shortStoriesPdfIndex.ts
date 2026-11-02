/**
 * In-app source for the Shama’il teaching collection:
 * 12 Short Stories from the Life of the Prophet (Iqra Publications).
 */
export const SHORT_STORIES_PDF = {
  title: '12 Short Stories from the Life of the Prophet',
  author: 'Iqra Publications',
  edition: 'English PDF (bundled in-app)',
  publicPath: '/sources/12-short-stories-from-the-life-of-the-prophet.pdf',
  pageCount: 30,
} as const;

export type ShortStoryPdfSpan = { start: number; end: number; nameEn: string };

export const shortStoriesPdfPages: Record<string, ShortStoryPdfSpan> = {
  'short-garbage-thrower': { start: 4, end: 5, nameEn: 'The Garbage Thrower' },
  'short-wealth-and-poverty': { start: 6, end: 7, nameEn: 'Wealth and Poverty' },
  'short-crying-camel': { start: 8, end: 9, nameEn: 'The Crying Camel' },
  'short-promise-to-tell-the-truth': {
    start: 10,
    end: 11,
    nameEn: 'The Man Who Made A Promise to Tell the Truth',
  },
  'short-wealth-family-deeds': { start: 12, end: 13, nameEn: 'Wealth, Family and His Deeds' },
  'short-ramadan-story': { start: 14, end: 15, nameEn: 'Ramadan Story' },
  'short-parents-in-islam': { start: 16, end: 17, nameEn: 'Parents in Islam' },
  'short-what-is-religion': { start: 18, end: 19, nameEn: 'What is Religion?' },
  'short-allah-is-enough': { start: 20, end: 21, nameEn: 'Allah is Enough as A Surety' },
  'short-story-of-alqamah': { start: 22, end: 23, nameEn: 'The Story of Alqamah' },
  'short-black-stone': { start: 24, end: 26, nameEn: 'Installation of Sacred Black Stone' },
  'short-dialogue-with-a-traveler': {
    start: 27,
    end: 29,
    nameEn: 'Dialogue between Prophet and a Traveler',
  },
};

export function shortStoriesPdfUrl(page?: number): string {
  const base = SHORT_STORIES_PDF.publicPath;
  if (!page || page < 1) return base;
  return `${base}#page=${page}`;
}

export function shortStoryPdfSpanForSlug(slug: string): ShortStoryPdfSpan | null {
  return shortStoriesPdfPages[slug] ?? null;
}
