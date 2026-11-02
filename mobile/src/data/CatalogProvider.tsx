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
import { loadBundledCatalog, publishedCatalogStories } from './bundledCatalog';
import type { StoryItem } from '../types/catalog';

const CACHE_KEY = 'stories.catalog.v1';

const bundledStories = loadBundledCatalog();

function preferRicherCatalog(remote: StoryItem[]): StoryItem[] {
  const published = publishedCatalogStories(remote);
  if (published.length > bundledStories.length) return published;
  return bundledStories.length ? bundledStories : published;
}

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
  const [stories, setStories] = useState<StoryItem[]>(bundledStories);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await apiRequest<StoryResponse>('/v1/stories?pageSize=50');
      const next = preferRicherCatalog(response.data ?? []);
      setStories(next);
      setError(null);
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(next));
    } catch {
      setStories(bundledStories);
      setError(null);
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
        if (bundledStories.length) {
          setStories(bundledStories);
          return;
        }
        if (cached) setStories(JSON.parse(cached) as StoryItem[]);
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
