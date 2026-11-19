import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../auth/AuthProvider';

const keyFor = (namespace: string, account: string) => `stories.wordgames.${namespace}.v1.${account}`;

/**
 * Persists one JSON document per signed-in account (or "guest"). `update` applies a pure
 * reducer and writes the result, so callers never touch AsyncStorage directly.
 */
export function useProgressStorage<T extends object>(namespace: string, initial: T) {
  const { accountKey } = useAuth();
  const account = accountKey ?? 'guest';
  const initialRef = useRef(initial);
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    void AsyncStorage.getItem(keyFor(namespace, account)).then((raw) => {
      if (cancelled) return;
      try {
        setValue(raw ? { ...initialRef.current, ...(JSON.parse(raw) as Partial<T>) } : initialRef.current);
      } catch {
        setValue(initialRef.current);
      }
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [namespace, account]);

  const update = useCallback(
    (reducer: (current: T) => T) => {
      setValue((current) => {
        const next = reducer(current);
        if (next !== current) void AsyncStorage.setItem(keyFor(namespace, account), JSON.stringify(next));
        return next;
      });
    },
    [namespace, account],
  );

  return { value, update, ready };
}
