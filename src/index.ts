import 'dotenv/config';
import { getEnv } from './config/env';
import { logger } from './config/logger';
import { closeDatabase } from './db/pool';
import { createApp } from './http/app';

const env = getEnv();
const server = createApp().listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'Stories API listening');
});

let closing = false;
async function shutdown(signal: string): Promise<void> {
  if (closing) return;
  closing = true;
  logger.info({ signal }, 'Shutting down API');
  server.close(async (error) => {
    await closeDatabase();
    if (error) {
      logger.error({ err: error }, 'HTTP server shutdown failed');
      process.exitCode = 1;
    }
  });
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
