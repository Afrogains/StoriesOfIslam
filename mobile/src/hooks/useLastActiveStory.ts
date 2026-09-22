import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const LAST_STORY_KEY = 'stories.lastActiveStoryId';
const LAST_AT_KEY = 'stories.lastActiveAt';

/** Persist which catalog story the user last opened (read or listen). */
export async function markLastActiveStory(storyId: string): Promise<void> {
  await AsyncStorage.multiSet([
    [LAST_STORY_KEY, storyId],
    [LAST_AT_KEY, String(Date.now())],
  ]);
}

export function useLastActiveStoryId(): {
  lastStoryId: string | null;
  refresh: () => Promise<void>;
  markActive: (storyId: string) => Promise<void>;
} {
  const [lastStoryId, setLastStoryId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const value = await AsyncStorage.getItem(LAST_STORY_KEY);
    setLastStoryId(value);
  }, []);

  const markActive = useCallback(async (storyId: string) => {
    await markLastActiveStory(storyId);
    setLastStoryId(storyId);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { lastStoryId, refresh, markActive };
}
