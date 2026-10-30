import { Linking, Platform } from 'react-native';
import {
  SHORT_STORIES_PDF,
  shortStoriesPdfUrl,
  shortStoryPdfSpanForSlug,
} from '../data/shortStoriesPdfIndex';

export { SHORT_STORIES_PDF, shortStoriesPdfUrl, shortStoryPdfSpanForSlug };

/** Open the bundled Iqra short-stories PDF, optionally at a chapter page. */
export async function openShortStoriesPdf(page?: number): Promise<void> {
  const path = shortStoriesPdfUrl(page);
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
