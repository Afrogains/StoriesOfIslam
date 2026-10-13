import { Linking, Platform } from 'react-native';
import {
  QURAN_STORIES_PDF,
  quranStoriesPdfUrl,
  quranStoryPdfSpanForSlug,
} from '../data/quranStoriesPdfIndex';

export { QURAN_STORIES_PDF, quranStoriesPdfUrl, quranStoryPdfSpanForSlug };

/** Open the bundled Stories of the Quran PDF, optionally at a chapter page. */
export async function openQuranStoriesPdf(page?: number): Promise<void> {
  const path = quranStoriesPdfUrl(page);
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
