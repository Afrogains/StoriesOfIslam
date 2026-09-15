import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { AppMode, ColorScheme } from '../theme/tokens';

type AppModeContextValue = {
  mode: AppMode;
  isKids: boolean;
  setMode: (mode: AppMode) => void;
  toggleMode: () => void;
  colorScheme: ColorScheme;
  isDark: boolean;
  setColorScheme: (scheme: ColorScheme) => void;
  toggleColorScheme: () => void;
};

const AppModeContext = createContext<AppModeContextValue | null>(null);

export function AppModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AppMode>('standard');
  const [colorScheme, setColorScheme] = useState<ColorScheme>('light');

  const value = useMemo<AppModeContextValue>(
    () => ({
      mode,
      isKids: mode === 'kids',
      setMode,
      toggleMode: () => setMode((current) => (current === 'kids' ? 'standard' : 'kids')),
      colorScheme,
      isDark: colorScheme === 'dark',
      setColorScheme,
      toggleColorScheme: () => setColorScheme((curr) => (curr === 'dark' ? 'light' : 'dark')),
    }),
    [mode, colorScheme],
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
