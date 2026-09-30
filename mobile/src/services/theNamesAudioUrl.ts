import { Platform } from 'react-native';
import { appConfig } from '../config';

const PROXY_PATH = '/v1/media/the-names-audio';

/**
 * Native apps can stream Muslim Central MP3s directly.
 * Web browsers send a third-party Referer and get blocked by Cloudflare,
 * so web playback goes through the API media proxy at EXPO_PUBLIC_API_URL.
 */
export function playbackUrlForNamesAudio(directUrl: string): string {
  if (Platform.OS !== 'web') return directUrl;
  const apiBase = appConfig.apiUrl.replace(/\/$/, '');
  return `${apiBase}${PROXY_PATH}?url=${encodeURIComponent(directUrl)}`;
}
