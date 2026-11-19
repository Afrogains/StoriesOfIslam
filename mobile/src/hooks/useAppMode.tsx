import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ColorScheme } from '../theme/tokens';

type AppModeContextValue = {
  colorScheme: ColorScheme;
  isDark: boolean;
  setColorScheme: (scheme: ColorScheme) => void;
  toggleColorScheme: () => void;
};

const AppModeContext = createContext<AppModeContextValue | null>(null);

const STORAGE_KEY = 'stories.colorScheme';

export function AppModeProvider({ children }: { children: ReactNode }) {
  // Default: Dark Mode (Deep Emerald / Midnight)
  const [colorScheme, setColorScheme] = useState<ColorScheme>('dark');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark') setColorScheme(stored);
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void AsyncStorage.setItem(STORAGE_KEY, colorScheme);
  }, [colorScheme, hydrated]);

  const value = useMemo<AppModeContextValue>(
    () => ({
      colorScheme,
      isDark: colorScheme === 'dark',
      setColorScheme,
      toggleColorScheme: () => setColorScheme((curr) => (curr === 'dark' ? 'light' : 'dark')),
    }),
    [colorScheme],
  );

  return <AppModeContext.Provider value={value}>{children}</AppModeContext.Provider>;
}

export function useAppMode() {
  const ctx = useContext(AppModeContext);
  if (!ctx) {
    throw new Error('useAppMode must be used within AppModeProvider');
  }
  return ctx;
}
