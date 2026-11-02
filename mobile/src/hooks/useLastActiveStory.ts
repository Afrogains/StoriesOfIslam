import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const STORY_KEY = 'stories.lastActiveStoryId';
const MODE_KEY = 'stories.lastActiveMode';
const AT_KEY = 'stories.lastActiveAt';

export type LastActiveMode = 'read' | 'listen';

export type LastActiveState = {
  storyId: string | null;
  mode: LastActiveMode | null;
  at: number | null;
};

/** Persist which catalog story the user last opened, and whether they were reading or listening. */
export async function markLastActiveStory(
  storyId: string,
  mode: LastActiveMode,
): Promise<void> {
  await AsyncStorage.multiSet([
    [STORY_KEY, storyId],
    [MODE_KEY, mode],
    [AT_KEY, String(Date.now())],
  ]);
}

export function useLastActiveStory(): {
  lastActive: LastActiveState;
  refresh: () => Promise<void>;
  markActive: (storyId: string, mode: LastActiveMode) => Promise<void>;
} {
  const [lastActive, setLastActive] = useState<LastActiveState>({
    storyId: null,
    mode: null,
    at: null,
  });

  const refresh = useCallback(async () => {
    const pairs = await AsyncStorage.multiGet([STORY_KEY, MODE_KEY, AT_KEY]);
    const map = Object.fromEntries(pairs);
    const modeRaw = map[MODE_KEY];
    const mode: LastActiveMode | null =
      modeRaw === 'read' || modeRaw === 'listen' ? modeRaw : null;
    const atRaw = map[AT_KEY];
    setLastActive({
      storyId: map[STORY_KEY] ?? null,
      mode,
      at: atRaw ? Number(atRaw) || null : null,
    });
  }, []);

  const markActive = useCallback(async (storyId: string, mode: LastActiveMode) => {
    await markLastActiveStory(storyId, mode);
    setLastActive({ storyId, mode, at: Date.now() });
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { lastActive, refresh, markActive };
}
