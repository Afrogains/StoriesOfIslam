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
import { allStandardStories, type StoryItem } from './mockHome';

const CACHE_KEY = 'stories.catalog.v1';

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
      setStories(response.data);
      setError(null);
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(response.data));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load stories');
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
        if (cached) setStories(JSON.parse(cached) as StoryItem[]);
        else if (__DEV__) setStories(allStandardStories);
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
