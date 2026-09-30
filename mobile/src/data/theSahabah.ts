/**
 * Sahabah roster ordered from the bundled Companions biographies PDF.
 */
import { SAHABAH_PDF, SAHABAH_ROSTER_META } from './sahabahPdfIndex';

export interface SahabahFigure {
  sortOrder: number;
  slug: string;
  nameEn: string;
  nameAr: string;
  honorificEn: string;
  honorificAr: string;
  summaryEn: string;
  female?: boolean;
}

export const SAHABAH_SERIES = {
  title: SAHABAH_PDF.title,
  author: SAHABAH_PDF.author,
  credit: 'Companions of the Prophet — in-app PDF',
  description:
    'Educational biographies of the noble Companions from the bundled English PDF. Read and listen both target that source edition.',
  pdfPath: SAHABAH_PDF.publicPath,
} as const;

export const theSahabah: SahabahFigure[] = SAHABAH_ROSTER_META.map((item) => ({
  sortOrder: item.sortOrder,
  slug: item.slug,
  nameEn: item.nameEn,
  nameAr: item.nameAr,
  honorificEn: item.honorificEn,
  honorificAr: item.honorificAr,
  summaryEn: item.summaryEn,
  female: item.female,
}));
