import { Linking, Platform } from 'react-native';
import {
  IBN_KATHIR_PDF,
  ibnKathirPdfPages,
  ibnKathirPdfUrl,
} from '../data/ibnKathirPdfIndex';

export { IBN_KATHIR_PDF, ibnKathirPdfPages, ibnKathirPdfUrl };

/** Open the bundled Ibn Kathir PDF, optionally at a chapter page. */
export async function openIbnKathirPdf(page?: number): Promise<void> {
  const path = ibnKathirPdfUrl(page);
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.open(path, '_blank', 'noopener,noreferrer');
    return;
  }
  const absolute =
    path.startsWith('http') || path.startsWith('file:')
      ? path
      : `https://afroclovers.com.ng${path}`;
  await Linking.openURL(absolute);
}

export function pdfSpanForSlug(slug: string) {
  return ibnKathirPdfPages[slug] ?? null;
}
