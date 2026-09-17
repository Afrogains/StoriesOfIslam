import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';
import { appConfig } from '../config';

WebBrowser.maybeCompleteAuthSession();

const TOKEN_KEY = 'stories.keycloak.tokens.v1';

interface StoredTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

interface AuthContextValue {
  accessToken: string | null;
  authenticated: boolean;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const discovery = useMemo<AuthSession.DiscoveryDocument>(() => {
    const issuer = appConfig.keycloakIssuer;
    const protocol = `${issuer}/protocol/openid-connect`;
    return {
      authorizationEndpoint: `${protocol}/auth`,
      tokenEndpoint: `${protocol}/token`,
      revocationEndpoint: `${protocol}/revoke`,
      endSessionEndpoint: `${protocol}/logout`,
      userInfoEndpoint: `${protocol}/userinfo`,
    };
  }, []);
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'storiesofislam',
    path: 'oauth/callback',
  });
  const [tokens, setTokens] = useState<StoredTokens | null>(null);
  const [loading, setLoading] = useState(true);
  const [request, result, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: appConfig.keycloakClientId,
      redirectUri,
      scopes: ['openid', 'profile', 'email', 'offline_access'],
      usePKCE: true,
    },
    discovery,
  );

  const persist = useCallback(async (value: StoredTokens | null) => {
    setTokens(value);
    // Browser sessions intentionally remain memory-only to avoid exposing a
    // refresh token to localStorage. Native tokens use encrypted keychain storage.
    if (Platform.OS === 'web') return;
    if (value) {
      await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(value), {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') {
      setLoading(false);
      return;
    }
    void SecureStore.getItemAsync(TOKEN_KEY)
      .then((raw) => {
        if (!raw) return;
        const restored = JSON.parse(raw) as StoredTokens;
        setTokens(restored);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (result?.type !== 'success' || !discovery || !request?.codeVerifier) return;
    void AuthSession.exchangeCodeAsync(
      {
        clientId: appConfig.keycloakClientId,
        code: result.params.code,
        redirectUri,
        extraParams: { code_verifier: request.codeVerifier },
      },
      discovery,
    ).then((response) =>
      persist({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        expiresAt: Date.now() + (response.expiresIn ?? 600) * 1000,
      }),
    );
  }, [result, discovery, request?.codeVerifier, redirectUri, persist]);

  const refresh = useCallback(async (): Promise<string | null> => {
    if (!tokens?.refreshToken || !discovery) return null;
    try {
      const response = await AuthSession.refreshAsync(
        {
          clientId: appConfig.keycloakClientId,
          refreshToken: tokens.refreshToken,
        },
        discovery,
      );
      const next = {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken ?? tokens.refreshToken,
        expiresAt: Date.now() + (response.expiresIn ?? 600) * 1000,
      };
      await persist(next);
      return next.accessToken;
    } catch {
      await persist(null);
      return null;
    }
  }, [tokens, discovery, persist]);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (!tokens) return null;
    if (tokens.expiresAt - Date.now() > 60_000) return tokens.accessToken;
    return refresh();
  }, [tokens, refresh]);

  const signIn = useCallback(async () => {
    if (!request) throw new Error('Authentication discovery is not ready');
    await promptAsync();
  }, [request, promptAsync]);

  const signOut = useCallback(async () => {
    const token = tokens?.accessToken;
    await persist(null);
    if (token && discovery) {
      await AuthSession.revokeAsync(
        { token, clientId: appConfig.keycloakClientId },
        discovery,
      ).catch(() => undefined);
    }
  }, [tokens?.accessToken, discovery, persist]);

  const value = useMemo<AuthContextValue>(
    () => ({
      accessToken: tokens?.accessToken ?? null,
      authenticated: Boolean(tokens?.accessToken),
      loading,
      signIn,
      signOut,
      getAccessToken,
    }),
    [tokens?.accessToken, loading, signIn, signOut, getAccessToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
}
