import pino from 'pino';
import { getEnv } from './env';

const env = getEnv();

export const logger = pino({
  level: env.LOG_LEVEL,
  base: {
    service: 'stories-api',
    release: env.RELEASE_SHA,
    environment: env.NODE_ENV,
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      '*.password',
      '*.token',
      '*.accessToken',
      '*.refreshToken',
      '*.secret',
    ],
    censor: '[REDACTED]',
  },
});
