import 'dotenv/config';
import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import mysql from 'mysql2/promise';
import { getEnv } from '../config/env';

function createMigrationConnection() {
  const env = getEnv();
  if (env.DATABASE_URL) {
    return mysql.createConnection({
      uri: env.DATABASE_URL,
      multipleStatements: true,
      ssl: env.DATABASE_SSL ? { rejectUnauthorized: true } : undefined,
    });
  }
  return mysql.createConnection({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    multipleStatements: true,
    ssl: env.DATABASE_SSL ? { rejectUnauthorized: true } : undefined,
  });
}

export async function runMigrations(): Promise<void> {
  const connection = await createMigrationConnection();
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename VARCHAR(255) PRIMARY KEY,
        checksum_sha256 CHAR(64) NOT NULL,
        applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    const directory = resolve(process.cwd(), 'migrations');
    const files = (await readdir(directory)).filter((name) => name.endsWith('.sql')).sort();
    for (const filename of files) {
      const sql = await readFile(resolve(directory, filename), 'utf8');
      const checksum = createHash('sha256').update(sql).digest('hex');
      const [existingRows] = await connection.execute<mysql.RowDataPacket[]>(
        'SELECT checksum_sha256 FROM schema_migrations WHERE filename = ?',
        [filename],
      );
      const existing = existingRows[0] as { checksum_sha256?: string } | undefined;
      if (existing) {
        if (existing.checksum_sha256 !== checksum) {
          throw new Error(`Applied migration ${filename} was modified`);
        }
        continue;
      }
      await connection.beginTransaction();
      try {
        await connection.query(sql);
        await connection.execute(
          'INSERT INTO schema_migrations(filename, checksum_sha256) VALUES (?, ?)',
          [filename, checksum],
        );
        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      }
    }
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  runMigrations().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
    process.exitCode = 1;
  });
}
