import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';
import { ApiError, apiRequest } from '../services/api';
import {
  createDeviceAccount,
  findDeviceAccount,
  removeDeviceAccount,
  verifyDeviceAccount,
} from './deviceAccounts';
import { normalizeEmail, validateRegistration, validateSignIn } from './validation';

const SESSION_KEY = 'stories.auth.session.v2';

export type AuthMode = 'server' | 'device';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

type Session = {
  user: AuthUser;
  mode: AuthMode;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
};

type ServerSession = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export type AuthResult = { mode: AuthMode };

interface AuthContextValue {
  user: AuthUser | null;
  mode: AuthMode | null;
  /** Stable key for per-account local data (quiz results, game scores). */
  accountKey: string | null;
  accessToken: string | null;
  authenticated: boolean;
  loading: boolean;
  register: (input: { name: string; email: string; password: string }) => Promise<AuthResult>;
  signIn: (input: { email: string; password: string }) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** The server is "unavailable" when the request never got a usable answer. */
function serverUnavailable(error: unknown): boolean {
  if (!(error instanceof ApiError)) return true;
  return error.status === 404 || error.status === 408 || error.status >= 500;
}

function friendlyServerError(error: unknown): Error {
  if (error instanceof ApiError) {
    if (error.code === 'validation_error') return new Error('Please check your details and try again.');
    return new Error(error.message);
  }
  return new Error('Something went wrong. Please try again.');
}

// Web keeps server tokens in memory only so refresh tokens never land in localStorage.
async function readStoredSession(): Promise<Session | null> {
  const raw =
    Platform.OS === 'web' ? await AsyncStorage.getItem(SESSION_KEY) : await SecureStore.getItemAsync(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

async function writeStoredSession(session: Session | null): Promise<void> {
  if (Platform.OS === 'web') {
    if (session?.mode === 'device') await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else await AsyncStorage.removeItem(SESSION_KEY);
    return;
  }
  if (session) {
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session), {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } else {
    await SecureStore.deleteItemAsync(SESSION_KEY);
  }
}

function fromServer(data: ServerSession): Session {
  return {
    user: data.user,
    mode: 'server',
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    expiresAt: Date.now() + data.expiresIn * 1000,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionRef = useRef<Session | null>(null);
  const refreshing = useRef<Promise<string | null> | null>(null);

  const persist = useCallback(async (next: Session | null) => {
    sessionRef.current = next;
    setSession(next);
    await writeStoredSession(next).catch(() => undefined);
  }, []);

  useEffect(() => {
    void readStoredSession()
      .then((stored) => {
        sessionRef.current = stored;
        setSession(stored);
      })
      .finally(() => setLoading(false));
  }, []);

  const register = useCallback<AuthContextValue['register']>(
    async (input) => {
      const details = validateRegistration(input);
      try {
        const response = await apiRequest<{ data: ServerSession }>('/v1/auth/register', {
          method: 'POST',
          body: JSON.stringify(details),
        });
        await persist(fromServer(response.data));
        return { mode: 'server' };
      } catch (error) {
        if (!serverUnavailable(error)) throw friendlyServerError(error);
      }
      const account = await createDeviceAccount(details);
      await persist({ user: { id: account.id, name: account.name, email: account.email }, mode: 'device' });
      return { mode: 'device' };
    },
    [persist],
  );

  const signIn = useCallback<AuthContextValue['signIn']>(
    async (input) => {
      const { email, password } = validateSignIn(input);
      let serverError: unknown;
      try {
        const response = await apiRequest<{ data: ServerSession }>('/v1/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        await persist(fromServer(response.data));
        await removeDeviceAccount(email).catch(() => undefined);
        return { mode: 'server' };
      } catch (error) {
        serverError = error;
      }

      const local = await verifyDeviceAccount(email, password);
      if (local && !serverUnavailable(serverError)) {
        // Created offline earlier and the server is now reachable: move it to the server.
        try {
          const response = await apiRequest<{ data: ServerSession }>('/v1/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name: local.name, email, password }),
          });
          await persist(fromServer(response.data));
          await removeDeviceAccount(email).catch(() => undefined);
          return { mode: 'server' };
        } catch {
          // Fall through to a device session; the user still gets in.
        }
      }
      if (local) {
        await persist({ user: { id: local.id, name: local.name, email: local.email }, mode: 'device' });
        return { mode: 'device' };
      }
      if (!serverUnavailable(serverError)) throw friendlyServerError(serverError);
      const known = await findDeviceAccount(email);
      throw new Error(
        known
          ? 'Email or password is incorrect.'
          : 'Can’t reach the server right now, and this email has no account on this device yet. Create an account to continue offline.',
      );
    },
    [persist],
  );

  const refreshAccess = useCallback(async (): Promise<string | null> => {
    const current = sessionRef.current;
    if (!current?.refreshToken) return null;
    try {
      const response = await apiRequest<{ data: ServerSession }>('/v1/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: current.refreshToken }),
      });
      const next = fromServer(response.data);
      await persist(next);
      return next.accessToken ?? null;
    } catch (error) {
      if (!serverUnavailable(error)) await persist(null);
      return null;
    }
  }, [persist]);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    const current = sessionRef.current;
    if (current?.mode !== 'server' || !current.accessToken) return null;
    if ((current.expiresAt ?? 0) - Date.now() > 60_000) return current.accessToken;
    refreshing.current ??= refreshAccess().finally(() => {
      refreshing.current = null;
    });
    return refreshing.current;
  }, [refreshAccess]);

  const signOut = useCallback(async () => {
    const current = sessionRef.current;
    await persist(null);
    if (current?.mode === 'server' && current.refreshToken) {
      await apiRequest<void>('/v1/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: current.refreshToken }),
      }).catch(() => undefined);
    }
  }, [persist]);

  const deleteAccount = useCallback(async () => {
    const current = sessionRef.current;
    if (!current) return;
    if (current.mode === 'server') {
      const token = await getAccessToken();
      if (!token) throw new Error('Sign in again to delete your account.');
      await apiRequest<void>('/v1/me', { method: 'DELETE', accessToken: token });
    } else {
      await removeDeviceAccount(current.user.email);
    }
    await persist(null);
  }, [getAccessToken, persist]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      mode: session?.mode ?? null,
      accountKey: session ? normalizeEmail(session.user.email) : null,
      accessToken: session?.mode === 'server' ? session.accessToken ?? null : null,
      authenticated: Boolean(session),
      loading,
      register,
      signIn,
      signOut,
      deleteAccount,
      getAccessToken,
    }),
    [session, loading, register, signIn, signOut, deleteAccount, getAccessToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
}
