import { Linking, Platform } from 'react-native';
import { NAWAWI_PDF, nawawiPdfUrl } from '../data/nawawiPdfIndex';

export { NAWAWI_PDF, nawawiPdfUrl };

/** Open the bundled Nawawi Forty PDF, optionally at a hadith page. */
export async function openNawawiPdf(page?: number): Promise<void> {
  const path = nawawiPdfUrl(page);
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
