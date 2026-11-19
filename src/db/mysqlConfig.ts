import type { ConnectionOptions } from 'mysql2';
import { getEnv } from '../config/env';

/** Shared mysql2 options for HostAfrica (TCP or UNIX socket) and local Compose. */
export function mysqlConnectionOptions(
  extras: ConnectionOptions = {},
): ConnectionOptions {
  const env = getEnv();
  if (env.DATABASE_URL) {
    return {
      uri: env.DATABASE_URL,
      ssl: env.DATABASE_SSL ? { rejectUnauthorized: true } : undefined,
      ...extras,
    };
  }

  const base: ConnectionOptions = {
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    ssl: env.DATABASE_SSL ? { rejectUnauthorized: true } : undefined,
    ...extras,
  };

  if (env.DB_SOCKET) {
    return {
      ...base,
      socketPath: env.DB_SOCKET,
    };
  }

  return {
    ...base,
    host: env.DB_HOST,
    port: env.DB_PORT,
  };
}
