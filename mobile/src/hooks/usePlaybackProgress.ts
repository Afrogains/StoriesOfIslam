import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { apiRequest } from '../services/api';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function usePlaybackProgress(storyId: string) {
  const { authenticated, getAccessToken } = useAuth();
  const key = `stories.progress.${storyId}`;

  const load = useCallback(async (): Promise<number> => {
    const value = await AsyncStorage.getItem(key);
    return value ? Math.max(0, Number(value) || 0) : 0;
  }, [key]);

  const save = useCallback(
    async (positionMs: number, completed = false): Promise<void> => {
      const position = Math.max(0, Math.round(positionMs));
      await AsyncStorage.setItem(key, String(position));
      if (!authenticated || !uuidPattern.test(storyId)) return;
      const token = await getAccessToken();
      if (!token) return;
      await apiRequest<void>(`/v1/me/progress/${storyId}`, {
        method: 'PUT',
        accessToken: token,
        body: JSON.stringify({ positionMs: position, completed }),
      });
    },
    [key, authenticated, storyId, getAccessToken],
  );

  return { load, save };
}
