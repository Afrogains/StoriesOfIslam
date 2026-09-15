import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { allStandardStories, type StoryItem } from '../data/mockHome';

type LibraryContextValue = {
  savedIds: string[];
  isSaved: (id: string) => boolean;
  toggleSaved: (id: string) => void;
  savedStories: StoryItem[];
  savedCount: number;
};

const LibraryContext = createContext<LibraryContextValue | null>(null);

/** Seeded from the mock data so the library isn't empty on first launch. */
const initialSaved = allStandardStories.filter((story) => story.isFavorite).map((story) => story.id);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [savedIds, setSavedIds] = useState<string[]>(initialSaved);

  const toggleSaved = useCallback((id: string) => {
    setSavedIds((current) =>
      current.includes(id) ? current.filter((saved) => saved !== id) : [id, ...current],
    );
  }, []);

  const value = useMemo<LibraryContextValue>(() => {
    const savedSet = new Set(savedIds);
    return {
      savedIds,
      isSaved: (id: string) => savedSet.has(id),
      toggleSaved,
      // Ordered by when each story was saved, most recent first.
      savedStories: savedIds
        .map((id) => allStandardStories.find((story) => story.id === id))
        .filter((story): story is StoryItem => Boolean(story)),
      savedCount: savedIds.length,
    };
  }, [savedIds, toggleSaved]);

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used inside a LibraryProvider');
  }
  return context;
}
