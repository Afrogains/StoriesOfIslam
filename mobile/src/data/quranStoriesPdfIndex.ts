/**
 * Canonical in-app source for Stories of the Quran: Ibn Kathir
 * (English translation by Ali As-Sayed Al-Halawani).
 */
export const QURAN_STORIES_PDF = {
  title: 'Stories of the Quran',
  author: 'Al-Imam Ibn Kathir',
  translator: 'Ali As-Sayed Al-Halawani',
  edition: 'English PDF (bundled in-app)',
  publicPath: '/sources/ibn-kathir-stories-of-the-quran.pdf',
  pageCount: 110,
} as const;

export type QuranStoryPdfSpan = { start: number; end: number; nameEn: string };

export const quranStoriesPdfPages: Record<string, QuranStoryPdfSpan> = {
  "quran-habil-qabil": {
    "start": 7,
    "end": 12,
    "nameEn": "Habil and Qabil"
  },
  "quran-harut-marut": {
    "start": 13,
    "end": 23,
    "nameEn": "Harut and Marut"
  },
  "quran-dwellers-of-the-town": {
    "start": 24,
    "end": 27,
    "nameEn": "Dwellers of the Town"
  },
  "quran-the-heifer": {
    "start": 28,
    "end": 29,
    "nameEn": "The Story of the Heifer"
  },
  "quran-musa-and-al-khidr": {
    "start": 30,
    "end": 38,
    "nameEn": "Musa and Al-Khidr"
  },
  "quran-qarun": {
    "start": 39,
    "end": 43,
    "nameEn": "The Story of Qarun"
  },
  "quran-bilqis": {
    "start": 44,
    "end": 50,
    "nameEn": "Bilqis, Queen of Sheba"
  },
  "quran-saba": {
    "start": 51,
    "end": 54,
    "nameEn": "The Story of Saba'"
  },
  "quran-uzair": {
    "start": 55,
    "end": 59,
    "nameEn": "Uzair"
  },
  "quran-dhul-qarnayn": {
    "start": 60,
    "end": 67,
    "nameEn": "Dhul-Qarnayn"
  },
  "quran-gog-and-magog": {
    "start": 68,
    "end": 72,
    "nameEn": "Gog and Magog"
  },
  "quran-people-of-the-cave": {
    "start": 73,
    "end": 79,
    "nameEn": "People of the Cave"
  },
  "quran-believer-and-disbeliever": {
    "start": 80,
    "end": 83,
    "nameEn": "The Believer and the Disbeliever"
  },
  "quran-people-of-the-garden": {
    "start": 84,
    "end": 86,
    "nameEn": "People of the Garden"
  },
  "quran-sabbath-breakers": {
    "start": 87,
    "end": 89,
    "nameEn": "The Sabbath-Breakers"
  },
  "quran-luqman": {
    "start": 90,
    "end": 98,
    "nameEn": "The Story of Luqman"
  },
  "quran-people-of-the-ditch": {
    "start": 99,
    "end": 101,
    "nameEn": "People of the Ditch"
  },
  "quran-barsisa": {
    "start": 102,
    "end": 103,
    "nameEn": "Barsisa the Worshipper"
  },
  "quran-owners-of-the-elephant": {
    "start": 104,
    "end": 110,
    "nameEn": "Owners of the Elephant"
  }
} as const;

export function quranStoriesPdfUrl(page?: number): string {
  const base = QURAN_STORIES_PDF.publicPath;
  if (!page || page < 1) return base;
  return `${base}#page=${page}`;
}

export function quranStoryPdfSpanForSlug(slug: string): QuranStoryPdfSpan | null {
  return quranStoriesPdfPages[slug] ?? null;
}
