import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { apiRequest } from '../services/api';
import type { StoryItem } from '../types/catalog';

const CACHE_KEY = 'stories.catalog.v1';
const usePreviewFixtures =
  __DEV__ ||
  process.env.EXPO_PUBLIC_ENVIRONMENT === 'preview' ||
  process.env.EXPO_PUBLIC_ENVIRONMENT === 'development';
const previewStories: StoryItem[] = usePreviewFixtures
  ? (() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- Metro tree-shakes this fixture branch in production exports.
      const base = require('./mockHome').allStandardStories as StoryItem[];
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { mergeSahabahChaptersIntoCatalog } = require('./sahabahChapters') as {
        mergeSahabahChaptersIntoCatalog: (stories: StoryItem[]) => StoryItem[];
      };
      const { mergeProphetChaptersIntoCatalog } = require('./prophetChapters') as {
        mergeProphetChaptersIntoCatalog: (stories: StoryItem[]) => StoryItem[];
      };
      const { mergeSeerahTimelineIntoCatalog } = require('./seerahTimeline') as {
        mergeSeerahTimelineIntoCatalog: (stories: StoryItem[]) => StoryItem[];
      };
      const { mergeQuranStoriesIntoCatalog } = require('./quranStories') as {
        mergeQuranStoriesIntoCatalog: (stories: StoryItem[]) => StoryItem[];
      };
      return mergeQuranStoriesIntoCatalog(
        mergeSeerahTimelineIntoCatalog(
          mergeProphetChaptersIntoCatalog(mergeSahabahChaptersIntoCatalog(base)),
        ),
      );
    })()
  : [];

interface CatalogContextValue {
  stories: StoryItem[];
  loading: boolean;
  refreshing: boolean;
  offline: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

interface StoryResponse {
  data: StoryItem[];
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await apiRequest<StoryResponse>('/v1/stories?pageSize=50');
      // Preview/dev APKs keep the richer local catalog when the API feed is sparse
      // (e.g. unpublished drafts), so Sahabah/Discover depth remains testable.
      const remote = response.data ?? [];
      const next =
        usePreviewFixtures && previewStories.length > remote.length ? previewStories : remote;
      setStories(next);
      setError(null);
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(next));
    } catch (requestError) {
      if (usePreviewFixtures && previewStories.length) {
        setStories(previewStories);
        setError(null);
      } else {
        setError(requestError instanceof Error ? requestError.message : 'Unable to load stories');
      }
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setOffline(state.isConnected === false);
    });
    void AsyncStorage.getItem(CACHE_KEY)
      .then((cached) => {
        if (usePreviewFixtures && previewStories.length) {
          setStories(previewStories);
          return;
        }
        if (cached) setStories(JSON.parse(cached) as StoryItem[]);
        else if (previewStories.length) setStories(previewStories);
      })
      .finally(() => void refresh());
    return unsubscribe;
  }, [refresh]);

  const value = useMemo(
    () => ({ stories, loading, refreshing, offline, error, refresh }),
    [stories, loading, refreshing, offline, error, refresh],
  );
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): CatalogContextValue {
  const context = useContext(CatalogContext);
  if (!context) throw new Error('useCatalog must be used within CatalogProvider');
  return context;
}
