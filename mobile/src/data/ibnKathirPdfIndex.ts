/**
 * Canonical in-app source for Qisas al-Anbiya: Ibn Kathir, Stories of the Prophets
 * (English PDF). Text/audio for Prophets resolve against this edition.
 */
export const IBN_KATHIR_PDF = {
  title: 'Stories of the Prophets',
  author: 'Al-Imam Ibn Kathir',
  edition: 'English PDF (Kalamullah / bundled in-app)',
  /** Served from Expo web public/ and available as a static asset path. */
  publicPath: '/sources/ibn-kathir-stories-of-the-prophets.pdf',
  pageCount: 227,
} as const;

export type IbnKathirPdfSpan = { start: number; end: number; nameEn: string };

export const ibnKathirPdfPages: Record<string, IbnKathirPdfSpan> = {
  "adam": {
    "start": 3,
    "end": 19,
    "nameEn": "Adam"
  },
  "idris": {
    "start": 20,
    "end": 20,
    "nameEn": "Idris"
  },
  "nuh": {
    "start": 21,
    "end": 28,
    "nameEn": "Nuh"
  },
  "hud": {
    "start": 29,
    "end": 33,
    "nameEn": "Hud"
  },
  "salih": {
    "start": 34,
    "end": 37,
    "nameEn": "Salih"
  },
  "ibrahim": {
    "start": 38,
    "end": 47,
    "nameEn": "Ibrahim"
  },
  "ismail": {
    "start": 48,
    "end": 54,
    "nameEn": "Isma‘il"
  },
  "ishaq": {
    "start": 55,
    "end": 55,
    "nameEn": "Ishaq"
  },
  "yaqub": {
    "start": 56,
    "end": 62,
    "nameEn": "Yaqub"
  },
  "lut": {
    "start": 63,
    "end": 66,
    "nameEn": "Lut"
  },
  "shuaib": {
    "start": 67,
    "end": 68,
    "nameEn": "Shu‘aib"
  },
  "yusuf": {
    "start": 69,
    "end": 91,
    "nameEn": "Yusuf"
  },
  "ayyub": {
    "start": 92,
    "end": 96,
    "nameEn": "Ayyub"
  },
  "dhul-kifl": {
    "start": 97,
    "end": 97,
    "nameEn": "Dhul-Kifl"
  },
  "yunus": {
    "start": 98,
    "end": 100,
    "nameEn": "Yunus"
  },
  "musa": {
    "start": 101,
    "end": 136,
    "nameEn": "Musa"
  },
  "harun": {
    "start": 101,
    "end": 136,
    "nameEn": "Musa"
  },
  "hizqeel": {
    "start": 137,
    "end": 138,
    "nameEn": "Hizqeel"
  },
  "ilyas": {
    "start": 139,
    "end": 139,
    "nameEn": "Ilyas"
  },
  "shammil": {
    "start": 140,
    "end": 143,
    "nameEn": "Shammil"
  },
  "dawud": {
    "start": 144,
    "end": 149,
    "nameEn": "Dawud"
  },
  "sulaiman": {
    "start": 150,
    "end": 156,
    "nameEn": "Sulaiman"
  },
  "shia": {
    "start": 157,
    "end": 158,
    "nameEn": "Shi‘a"
  },
  "aramaya": {
    "start": 159,
    "end": 164,
    "nameEn": "Aramaya"
  },
  "daniel": {
    "start": 165,
    "end": 166,
    "nameEn": "Daniel"
  },
  "uzair": {
    "start": 167,
    "end": 168,
    "nameEn": "Uzair"
  },
  "zakariyah": {
    "start": 169,
    "end": 170,
    "nameEn": "Zakariyah"
  },
  "yahya": {
    "start": 171,
    "end": 172,
    "nameEn": "Yahya"
  },
  "isa": {
    "start": 173,
    "end": 187,
    "nameEn": "Isa"
  },
  "__muhammad_boundary__": {
    "start": 188,
    "end": 227,
    "nameEn": "Muhammad"
  }
} as const;

export function ibnKathirPdfUrl(page?: number): string {
  const base = IBN_KATHIR_PDF.publicPath;
  if (!page || page < 1) return base;
  return `${base}#page=${page}`;
}
