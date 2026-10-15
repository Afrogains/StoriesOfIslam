import type { AuthenticityGrade } from '../types/catalog';
import records from './nawawiFortyData.json';

export type NawawiHadith = {
  n: number;
  subject: string;
  narrator: string;
  textEn: string;
  textAr: string;
  source: string;
  grade: AuthenticityGrade;
  pdfPage: number;
};

/** An-Nawawi titled the collection Forty; this edition contains 42 hadiths. */
export const NAWAWI_COLLECTION = {
  title: "An-Nawawi's Forty Hadith",
  titleAr: 'الأربعون النووية',
  compiler: 'Imam Yahya bin Sharaf an-Nawawi',
  edition: 'Abul-Qasim Publishing House / Saheeh International, 1999',
  note: 'The collection is titled Forty and contains 42 hadiths.',
  publicPath: '/sources/en-hadith-nawawy-sahih.pdf',
  pageCount: 107,
  count: 42,
} as const;

export const NAWAWI_FORTY: readonly NawawiHadith[] = records as NawawiHadith[];

const MS_DAY = 86_400_000;
const COLLAPSED_EN_CHARS = 220;
const COLLAPSED_AR_CHARS = 90;

/** UTC calendar day so the same hadith is featured worldwide for 24 hours. */
export function utcDayNumber(at = Date.now()): number {
  return Math.floor(at / MS_DAY);
}

export function nawawiIndexForDay(at = Date.now()): number {
  const len = NAWAWI_FORTY.length;
  return ((utcDayNumber(at) % len) + len) % len;
}

export function todaysHadith(at = Date.now()): NawawiHadith {
  return NAWAWI_FORTY[nawawiIndexForDay(at)]!;
}

export function nextRotationAt(at = Date.now()): number {
  return (utcDayNumber(at) + 1) * MS_DAY;
}

export function isLongHadith(hadith: NawawiHadith): boolean {
  return hadith.textEn.length > COLLAPSED_EN_CHARS || hadith.textAr.length > COLLAPSED_AR_CHARS;
}

export function gradeLabel(grade: AuthenticityGrade): string {
  if (grade === 'hasan') return 'HASAN';
  if (grade === 'athar') return 'ATHAR';
  if (grade === 'historical') return 'HISTORICAL';
  return 'SAHIH';
}
