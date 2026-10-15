import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useCatalog } from '../data/CatalogProvider';
import type { StoryItem } from '../types/catalog';
import { apiRequest } from '../services/api';

type LibraryContextValue = {
  savedIds: string[];
  isSaved: (id: string) => boolean;
  toggleSaved: (id: string, story?: StoryItem) => void;
  savedStories: StoryItem[];
  savedCount: number;
};

const LibraryContext = createContext<LibraryContextValue | null>(null);

const STORAGE_KEY = 'stories.library.ids.v1';
const RECORDS_KEY = 'stories.library.records.v1';

function snapshotStory(story: StoryItem): StoryItem {
  const { timedCues: _cues, ...rest } = story;
  return rest;
}

export function LibraryProvider({ children }: { children: ReactNode }) {
  const { stories } = useCatalog();
  const { authenticated, getAccessToken } = useAuth();
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [records, setRecords] = useState<Record<string, StoryItem>>({});

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) setSavedIds(JSON.parse(raw) as string[]);
    });
    void AsyncStorage.getItem(RECORDS_KEY).then((raw) => {
      if (raw) setRecords(JSON.parse(raw) as Record<string, StoryItem>);
    });
  }, []);

  useEffect(() => {
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(savedIds));
  }, [savedIds]);

  useEffect(() => {
    void AsyncStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  }, [records]);

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

  const toggleSaved = useCallback((id: string, story?: StoryItem) => {
    setSavedIds((current) => {
      const removing = current.includes(id);
      const next = removing ? current.filter((saved) => saved !== id) : [id, ...current];
      setRecords((prev) => {
        if (removing) {
          if (!(id in prev)) return prev;
          const { [id]: _dropped, ...rest } = prev;
          return rest;
        }
        if (!story) return prev;
        return { ...prev, [id]: snapshotStory(story) };
      });
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
    const catalogById = new Map(stories.map((story) => [story.id, story]));
    return {
      savedIds,
      isSaved: (id: string) => savedSet.has(id),
      toggleSaved,
      savedStories: savedIds
        .map((id) => catalogById.get(id) ?? records[id])
        .filter((story): story is StoryItem => Boolean(story)),
      savedCount: savedIds.length,
    };
  }, [savedIds, stories, records, toggleSaved]);

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used inside a LibraryProvider');
  }
  return context;
}
