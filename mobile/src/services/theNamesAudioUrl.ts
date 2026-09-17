import { Platform } from 'react-native';

const PROXY_PATH = '/v1/media/the-names-audio';

/**
 * Native apps can stream Muslim Central MP3s directly.
 * Web browsers send a third-party Referer and get blocked by Cloudflare,
 * so web playback uses a same-origin media proxy (`/v1/media/the-names-audio`).
 */
export function playbackUrlForNamesAudio(directUrl: string): string {
  if (Platform.OS !== 'web') return directUrl;
  return `${PROXY_PATH}?url=${encodeURIComponent(directUrl)}`;
}
