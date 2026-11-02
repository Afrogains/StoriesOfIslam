import { NAWAWI_COLLECTION } from './nawawiForty';

export const NAWAWI_PDF = NAWAWI_COLLECTION;

export function nawawiPdfUrl(page?: number): string {
  const base = NAWAWI_COLLECTION.publicPath;
  if (!page || page < 1) return base;
  return `${base}#page=${page}`;
}
