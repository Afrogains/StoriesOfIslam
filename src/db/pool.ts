import type { ExecuteValues } from 'mysql2';
import mysql, {
  type Pool,
  type PoolConnection,
  type ResultSetHeader,
  type RowDataPacket,
} from 'mysql2/promise';
import { getEnv } from '../config/env';
import { logger } from '../config/logger';
import { mysqlConnectionOptions } from './mysqlConfig';

export type DbClient = {
  query: <T extends RowDataPacket = RowDataPacket>(
    text: string,
    values?: readonly unknown[],
  ) => Promise<QueryResult<T>>;
};

export type QueryResult<T> = {
  rows: T[];
  rowCount: number;
  insertId?: number;
};

const env = getEnv();

export const pool: Pool = mysql.createPool(
  mysqlConnectionOptions({
    waitForConnections: true,
    connectionLimit: env.DB_POOL_MAX,
    maxIdle: env.DB_POOL_MAX,
    idleTimeout: 30_000,
    connectTimeout: 5_000,
    enableKeepAlive: true,
    timezone: 'Z',
    dateStrings: false,
    namedPlaceholders: false,
  }),
);

pool.on('connection', () => {
  logger.debug('MySQL pool connection established');
});

async function runOnConnection<T extends RowDataPacket>(
  connection: PoolConnection | Pool,
  text: string,
  values: readonly unknown[] = [],
): Promise<QueryResult<T>> {
  const [result] = await connection.execute(text, values as ExecuteValues[]);
  if (Array.isArray(result)) {
    return { rows: result as T[], rowCount: result.length };
  }
  const header = result as ResultSetHeader;
  return { rows: [] as T[], rowCount: header.affectedRows, insertId: header.insertId };
}

export async function query<T extends RowDataPacket = RowDataPacket>(
  text: string,
  values: readonly unknown[] = [],
): Promise<QueryResult<T>> {
  return runOnConnection<T>(pool, text, values);
}

export async function transaction<T>(callback: (client: DbClient) => Promise<T>): Promise<T> {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const client: DbClient = {
      query: (text, values = []) => runOnConnection(connection, text, values),
    };
    const result = await callback(client);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function checkDatabase(): Promise<void> {
  await query('SELECT 1 AS ok');
}

export async function closeDatabase(): Promise<void> {
  await pool.end();
}

/** Parse JSON columns that may arrive as strings depending on driver/server. */
export function asJson<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

export function asBool(value: unknown): boolean {
  return value === true || value === 1 || value === '1';
}
