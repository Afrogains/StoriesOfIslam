import { Platform } from 'react-native';

function publicValue(name: string, value: string | undefined, fallback: string): string {
  if (value) return value.replace(/\/$/, '');
  // Allow preview/static development builds to boot without blank-screening.
  const environment = process.env.EXPO_PUBLIC_ENVIRONMENT ?? (__DEV__ ? 'development' : 'production');
  if (__DEV__ || environment === 'development' || environment === 'preview') {
    return fallback;
  }
  throw new Error(`Missing required public configuration: ${name}`);
}

export const appConfig = {
  apiUrl: publicValue('EXPO_PUBLIC_API_URL', process.env.EXPO_PUBLIC_API_URL, 'http://localhost:3000'),
  keycloakIssuer: publicValue(
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
