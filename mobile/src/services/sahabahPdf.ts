import { Linking, Platform } from 'react-native';
import {
  SAHABAH_PDF,
  sahabahPdfPages,
  sahabahPdfUrl,
} from '../data/sahabahPdfIndex';

export { SAHABAH_PDF, sahabahPdfPages, sahabahPdfUrl };

/** Open the bundled Sahaba biographies PDF, optionally at a chapter page. */
export async function openSahabahPdf(page?: number): Promise<void> {
  const path = sahabahPdfUrl(page);
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

export function sahabahPdfSpanForSlug(slug: string) {
  return sahabahPdfPages[slug] ?? null;
}
