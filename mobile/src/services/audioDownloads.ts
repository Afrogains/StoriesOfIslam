import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

const INDEX_KEY = 'stories.audioDownloads.v1';

interface DownloadIndex {
  [storyId: string]: { uri: string; sourceUrl: string; downloadedAt: string };
}

async function readIndex(): Promise<DownloadIndex> {
  const raw = await AsyncStorage.getItem(INDEX_KEY);
  return raw ? (JSON.parse(raw) as DownloadIndex) : {};
}

export const audioDownloads = {
  async localUri(storyId: string, sourceUrl: string): Promise<string | null> {
    if (Platform.OS === 'web') return null;
    const item = (await readIndex())[storyId];
    if (!item || item.sourceUrl !== sourceUrl) return null;
    const info = await FileSystem.getInfoAsync(item.uri);
    return info.exists ? item.uri : null;
  },

  async download(storyId: string, sourceUrl: string): Promise<string> {
    if (Platform.OS === 'web' || !FileSystem.documentDirectory) {
      throw new Error('Offline audio downloads are available in the iOS and Android apps');
    }
    const directory = `${FileSystem.documentDirectory}stories-audio/`;
    await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
    const extension = sourceUrl.toLowerCase().includes('.m4a') ? 'm4a' : 'mp3';
    const destination = `${directory}${encodeURIComponent(storyId)}.${extension}`;
    const result = await FileSystem.downloadAsync(sourceUrl, destination);
    if (result.status < 200 || result.status >= 300) {
      await FileSystem.deleteAsync(destination, { idempotent: true });
      throw new Error(`Audio download failed (${result.status})`);
    }
    const index = await readIndex();
    index[storyId] = { uri: result.uri, sourceUrl, downloadedAt: new Date().toISOString() };
    await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(index));
    return result.uri;
  },

  async remove(storyId: string): Promise<void> {
    const index = await readIndex();
    const item = index[storyId];
    if (item) await FileSystem.deleteAsync(item.uri, { idempotent: true });
    delete index[storyId];
    await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(index));
  },
};
