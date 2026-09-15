import { Platform } from 'react-native';

function required(name: string, value: string | undefined, fallback: string): string {
  if (value) return value.replace(/\/$/, '');
  if (__DEV__) return fallback;
  throw new Error(`Missing required public configuration: ${name}`);
}

export const appConfig = {
  apiUrl: required('EXPO_PUBLIC_API_URL', process.env.EXPO_PUBLIC_API_URL, 'http://localhost:3000'),
  keycloakIssuer: required(
    'EXPO_PUBLIC_KEYCLOAK_ISSUER',
    process.env.EXPO_PUBLIC_KEYCLOAK_ISSUER,
    'http://localhost:8080/realms/stories-of-islam',
  ),
  keycloakClientId:
    Platform.OS === 'web'
      ? process.env.EXPO_PUBLIC_KEYCLOAK_WEB_CLIENT_ID ?? 'stories-web'
      : process.env.EXPO_PUBLIC_KEYCLOAK_MOBILE_CLIENT_ID ?? 'stories-mobile',
  environment: process.env.EXPO_PUBLIC_ENVIRONMENT ?? (__DEV__ ? 'development' : 'production'),
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
} as const;
