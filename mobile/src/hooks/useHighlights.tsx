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
import { Text, StyleSheet, View } from 'react-native';
import { BODY_FONT_FAMILY, radius, shadow } from '../theme/tokens';
import type { Highlight } from '../types/highlight';

export type { Highlight, HighlightKind } from '../types/highlight';

type HighlightsContextValue = {
  highlights: Highlight[];
  highlightCount: number;
  addHighlight: (input: Omit<Highlight, 'id' | 'createdAt'> & { id?: string }) => Highlight | null;
  removeHighlight: (id: string) => void;
  isTextHighlighted: (text: string, storyId?: string) => boolean;
  highlightsForStory: (storyId: string) => Highlight[];
};

const HighlightsContext = createContext<HighlightsContextValue | null>(null);
const STORAGE_KEY = 'stories.library.highlights.v1';
const MAX_HIGHLIGHTS = 200;

function makeId(): string {
  return `hl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalize(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

export function HighlightsProvider({ children }: { children: ReactNode }) {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw) as Highlight[];
        if (Array.isArray(parsed)) setHighlights(parsed);
      } catch {
        /* ignore corrupt cache */
      }
    });
  }, []);

  useEffect(() => {
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(highlights));
  }, [highlights]);

  const notify = useCallback((message: string) => {
    setToast(message);
    const timer = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(timer);
  }, []);

  const addHighlight = useCallback(
    (input: Omit<Highlight, 'id' | 'createdAt'> & { id?: string }): Highlight | null => {
      const text = normalize(input.text);
      if (text.length < 8) return null;
      let saved: Highlight | null = null;
      let duplicated = false;
      setHighlights((current) => {
        const duplicate = current.find(
          (item) =>
            normalize(item.text) === text &&
            (item.storyId ?? '') === (input.storyId ?? '') &&
            item.kind === input.kind,
        );
        if (duplicate) {
          duplicated = true;
          saved = duplicate;
          return current;
        }
        const next: Highlight = {
          id: input.id ?? makeId(),
          text,
          kind: input.kind,
          sourceLabel: input.sourceLabel,
          storyId: input.storyId,
          storyTitle: input.storyTitle,
          createdAt: Date.now(),
        };
        saved = next;
        return [next, ...current].slice(0, MAX_HIGHLIGHTS);
      });
      notify(duplicated ? 'Already in Highlights' : 'Saved to Highlights');
      return saved;
    },
    [notify],
  );

  const removeHighlight = useCallback((id: string) => {
    setHighlights((current) => current.filter((item) => item.id !== id));
  }, []);

  const value = useMemo<HighlightsContextValue>(() => {
    return {
      highlights,
      highlightCount: highlights.length,
      addHighlight,
      removeHighlight,
      isTextHighlighted: (text, storyId) => {
        const needle = normalize(text);
        return highlights.some(
          (item) =>
            (storyId ? item.storyId === storyId : true) &&
            (normalize(item.text) === needle || needle.includes(normalize(item.text))),
        );
      },
      highlightsForStory: (storyId) => highlights.filter((item) => item.storyId === storyId),
    };
  }, [addHighlight, highlights, removeHighlight]);

  return (
    <HighlightsContext.Provider value={value}>
      {children}
      {toast ? (
        <View pointerEvents="none" style={styles.toastWrap}>
          <View style={[styles.toast, shadow('md', true)]}>
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        </View>
      ) : null}
    </HighlightsContext.Provider>
  );
}

export function useHighlights() {
  const context = useContext(HighlightsContext);
  if (!context) {
    throw new Error('useHighlights must be used inside a HighlightsProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  toastWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 92,
    alignItems: 'center',
    zIndex: 80,
  },
  toast: {
    backgroundColor: '#064E3B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
    maxWidth: '86%',
  },
  toastText: {
    fontFamily: BODY_FONT_FAMILY,
    color: '#ECFDF5',
    fontSize: 13,
    fontWeight: '700',
  },
});
