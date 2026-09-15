import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useCatalog } from '../data/CatalogProvider';
import type { StoryItem } from '../types/catalog';
import { apiRequest } from '../services/api';

type LibraryContextValue = {
  savedIds: string[];
  isSaved: (id: string) => boolean;
  toggleSaved: (id: string) => void;
  savedStories: StoryItem[];
  savedCount: number;
};

const LibraryContext = createContext<LibraryContextValue | null>(null);

const STORAGE_KEY = 'stories.library.ids.v1';

export function LibraryProvider({ children }: { children: ReactNode }) {
  const { stories } = useCatalog();
  const { authenticated, getAccessToken } = useAuth();
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) setSavedIds(JSON.parse(raw) as string[]);
    });
  }, []);

  useEffect(() => {
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(savedIds));
  }, [savedIds]);

  useEffect(() => {
    if (!authenticated) return;
    void getAccessToken().then(async (token) => {
      if (!token) return;
      const response = await apiRequest<{ data: string[] }>('/v1/me/favorites', {
        accessToken: token,
      });
      setSavedIds(response.data);
    }).catch(() => undefined);
  }, [authenticated, getAccessToken]);

  const toggleSaved = useCallback((id: string) => {
    setSavedIds((current) => {
      const removing = current.includes(id);
      const next = removing ? current.filter((saved) => saved !== id) : [id, ...current];
      if (authenticated) {
        void getAccessToken().then((token) =>
          token
            ? apiRequest<void>(`/v1/me/favorites/${id}`, {
                method: removing ? 'DELETE' : 'PUT',
                accessToken: token,
              })
            : undefined,
        ).catch(() => setSavedIds(current));
      }
      return next;
    });
  }, [authenticated, getAccessToken]);

  const value = useMemo<LibraryContextValue>(() => {
    const savedSet = new Set(savedIds);
    return {
      savedIds,
      isSaved: (id: string) => savedSet.has(id),
      toggleSaved,
      // Ordered by when each story was saved, most recent first.
      savedStories: savedIds
        .map((id) => stories.find((story) => story.id === id))
        .filter((story): story is StoryItem => Boolean(story)),
      savedCount: savedIds.length,
    };
  }, [savedIds, stories, toggleSaved]);

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used inside a LibraryProvider');
  }
  return context;
}
