import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { AppMode } from '../theme/tokens';

type AppModeContextValue = {
  mode: AppMode;
  isKids: boolean;
  setMode: (mode: AppMode) => void;
  toggleMode: () => void;
};

const AppModeContext = createContext<AppModeContextValue | null>(null);

export function AppModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AppMode>('standard');

  const value = useMemo<AppModeContextValue>(
    () => ({
      mode,
      isKids: mode === 'kids',
      setMode,
      toggleMode: () => setMode((current) => (current === 'kids' ? 'standard' : 'kids')),
    }),
    [mode],
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
