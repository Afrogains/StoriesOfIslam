import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback } from 'react';

const keyFor = (storyId: string) => `stories.readBookmark.${storyId}`;

/** Persist reading scroll offset so the user can resume the text where they left off. */
export function useReadingBookmark(storyId: string) {
  const load = useCallback(async (): Promise<number> => {
    const raw = await AsyncStorage.getItem(keyFor(storyId));
    return raw ? Math.max(0, Number(raw) || 0) : 0;
  }, [storyId]);

  const save = useCallback(
    async (offsetY: number): Promise<void> => {
      await AsyncStorage.setItem(keyFor(storyId), String(Math.max(0, Math.round(offsetY))));
    },
    [storyId],
  );

  const clear = useCallback(async (): Promise<void> => {
    await AsyncStorage.removeItem(keyFor(storyId));
  }, [storyId]);

  return { load, save, clear };
}
