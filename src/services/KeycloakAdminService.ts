import { getEnv } from '../config/env';

export class KeycloakAdminService {
  async deleteUser(subject: string): Promise<void> {
    const env = getEnv();
    if (!env.KEYCLOAK_ADMIN_CLIENT_ID || !env.KEYCLOAK_ADMIN_CLIENT_SECRET) {
      throw new Error('Keycloak admin client is not configured');
    }

    const issuer = new URL(env.KEYCLOAK_ISSUER);
    const realm = issuer.pathname.split('/').filter(Boolean).at(-1);
    if (!realm) throw new Error('Unable to resolve Keycloak realm');
    const origin = issuer.origin;
    const tokenResponse = await fetch(
      `${origin}/realms/${encodeURIComponent(realm)}/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: env.KEYCLOAK_ADMIN_CLIENT_ID,
          client_secret: env.KEYCLOAK_ADMIN_CLIENT_SECRET,
        }),
        signal: AbortSignal.timeout(8_000),
      },
    );
    if (!tokenResponse.ok) {
      throw new Error(`Keycloak admin token failed (${tokenResponse.status})`);
    }
    const token = (await tokenResponse.json()) as { access_token: string };
    const response = await fetch(
      `${origin}/admin/realms/${encodeURIComponent(realm)}/users/${encodeURIComponent(subject)}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token.access_token}` },
        signal: AbortSignal.timeout(8_000),
      },
    );
    if (!response.ok && response.status !== 404) {
      throw new Error(`Keycloak account deletion failed (${response.status})`);
    }
  }
}

export const keycloakAdminService = new KeycloakAdminService();
