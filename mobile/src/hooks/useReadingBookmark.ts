import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback } from 'react';
import {
  EMPTY_READING_BOOKMARK,
  parseReadingBookmark,
  serializeReadingBookmark,
  type ReadingBookmark,
} from './readingBookmark';

const keyFor = (storyId: string) => `stories.readBookmark.${storyId}`;

/** Persist reading position, last section, last line, and percent so Home can resume accurately. */
export function useReadingBookmark(storyId: string) {
  const load = useCallback(async (): Promise<ReadingBookmark> => {
    const raw = await AsyncStorage.getItem(keyFor(storyId));
    return parseReadingBookmark(raw);
  }, [storyId]);

  const save = useCallback(
    async (bookmark: ReadingBookmark): Promise<void> => {
      await AsyncStorage.setItem(keyFor(storyId), serializeReadingBookmark(bookmark));
    },
    [storyId],
  );

  const clear = useCallback(async (): Promise<void> => {
    await AsyncStorage.removeItem(keyFor(storyId));
  }, [storyId]);

  return { load, save, clear };
}

export { EMPTY_READING_BOOKMARK };
export type { ReadingBookmark };
