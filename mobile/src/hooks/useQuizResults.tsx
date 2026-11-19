import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { apiRequest } from '../services/api';

export type QuizResult = {
  score: number;
  total: number;
  best: number;
  attempts: number;
  completedAt: string;
  synced?: boolean;
};

type Results = Record<string, QuizResult>;

type QuizResultsContextValue = {
  results: Results;
  getResult: (storyId: string, chapterIndex: number) => QuizResult | undefined;
  recordResult: (storyId: string, chapterIndex: number, score: number, total: number) => void;
  summary: { chapters: number; perfect: number; accuracy: number };
};

const QuizResultsContext = createContext<QuizResultsContextValue | null>(null);

const GUEST = 'guest';
const storageKey = (account: string) => `stories.quiz.results.v1.${account}`;
const resultKey = (storyId: string, chapterIndex: number) => `${storyId}:${chapterIndex}`;

function parseKey(key: string): { storyId: string; chapterIndex: number } {
  const at = key.lastIndexOf(':');
  return { storyId: key.slice(0, at), chapterIndex: Number(key.slice(at + 1)) };
}

async function readResults(account: string): Promise<Results> {
  const raw = await AsyncStorage.getItem(storageKey(account));
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Results;
  } catch {
    return {};
  }
}

function mergeResult(a: QuizResult | undefined, b: QuizResult): QuizResult {
  if (!a) return b;
  const latest = a.completedAt >= b.completedAt ? a : b;
  return {
    ...latest,
    best: Math.max(a.best, b.best),
    attempts: Math.max(a.attempts, b.attempts),
    synced: a.synced && b.synced,
  };
}

export function QuizResultsProvider({ children }: { children: ReactNode }) {
  const { accountKey, mode, getAccessToken } = useAuth();
  const account = accountKey ?? GUEST;
  const [results, setResults] = useState<Results>({});
  const loadedFor = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadedFor.current = null;
    void (async () => {
      let next = await readResults(account);
      if (account !== GUEST) {
        const guest = await readResults(GUEST);
        for (const [key, value] of Object.entries(guest)) next[key] = mergeResult(next[key], { ...value, synced: false });
      }
      if (cancelled) return;
      loadedFor.current = account;
      setResults(next);

      if (mode !== 'server') return;
      const token = await getAccessToken();
      if (!token || cancelled) return;
      try {
        const remote = await apiRequest<{
          data: { storyId: string; chapterIndex: number; score: number; total: number; bestScore: number; attempts: number; completedAt: string }[];
        }>('/v1/me/quiz-results', { accessToken: token });
        next = { ...next };
        for (const row of remote.data) {
          const key = resultKey(row.storyId, row.chapterIndex);
          next[key] = mergeResult(next[key], {
            score: row.score,
            total: row.total,
            best: row.bestScore,
            attempts: row.attempts,
            completedAt: row.completedAt,
            synced: true,
          });
        }
        const pending = Object.entries(next).filter(([, value]) => !value.synced);
        if (pending.length) {
          await apiRequest<void>('/v1/me/quiz-results', {
            method: 'POST',
            accessToken: token,
            body: JSON.stringify({
              results: pending.slice(0, 500).map(([key, value]) => ({
                ...parseKey(key),
                score: value.score,
                total: value.total,
                completedAt: value.completedAt,
              })),
            }),
          });
          for (const [key] of pending.slice(0, 500)) next[key] = { ...next[key], synced: true };
        }
        if (!cancelled) setResults(next);
      } catch {
        // Offline or server error: results stay local and sync on the next sign-in.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [account, mode, getAccessToken]);

  useEffect(() => {
    if (loadedFor.current !== account) return;
    void AsyncStorage.setItem(storageKey(account), JSON.stringify(results));
  }, [account, results]);

  const recordResult = useCallback<QuizResultsContextValue['recordResult']>(
    (storyId, chapterIndex, score, total) => {
      const key = resultKey(storyId, chapterIndex);
      const completedAt = new Date().toISOString();
      setResults((current) => {
        const previous = current[key];
        return {
          ...current,
          [key]: {
            score,
            total,
            best: Math.max(previous?.best ?? 0, score),
            attempts: (previous?.attempts ?? 0) + 1,
            completedAt,
            synced: false,
          },
        };
      });
      if (mode !== 'server') return;
      void getAccessToken()
        .then((token) =>
          token
            ? apiRequest<void>('/v1/me/quiz-results', {
                method: 'POST',
                accessToken: token,
                body: JSON.stringify({ results: [{ storyId, chapterIndex, score, total, completedAt }] }),
              }).then(() =>
                setResults((current) =>
                  current[key]?.completedAt === completedAt
                    ? { ...current, [key]: { ...current[key], synced: true } }
                    : current,
                ),
              )
            : undefined,
        )
        .catch(() => undefined);
    },
    [mode, getAccessToken],
  );

  const value = useMemo<QuizResultsContextValue>(() => {
    const entries = Object.values(results);
    const correct = entries.reduce((sum, entry) => sum + entry.best, 0);
    const total = entries.reduce((sum, entry) => sum + entry.total, 0);
    return {
      results,
      getResult: (storyId, chapterIndex) => results[resultKey(storyId, chapterIndex)],
      recordResult,
      summary: {
        chapters: entries.length,
        perfect: entries.filter((entry) => entry.best === entry.total).length,
        accuracy: total ? correct / total : 0,
      },
    };
  }, [results, recordResult]);

  return <QuizResultsContext.Provider value={value}>{children}</QuizResultsContext.Provider>;
}

export function useQuizResults(): QuizResultsContextValue {
  const value = useContext(QuizResultsContext);
  if (!value) throw new Error('useQuizResults must be used within QuizResultsProvider');
  return value;
}
