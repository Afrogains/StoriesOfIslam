import { randomUUID } from 'node:crypto';
import compression from 'compression';
import cors from 'cors';
import express, { type Express } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { optionalAuth } from '../auth/keycloak';
import { getEnv } from '../config/env';
import { logger } from '../config/logger';
import { readinessChecks } from '../services/ReadinessService';
import { HttpError, errorHandler, notFound } from './errors';
import { metricsEndpoint, recordMetrics } from './metrics';
import { catalogRouter } from '../routes/catalog';
import { editorialRouter } from '../routes/editorial';
import { jobsRouter } from '../routes/jobs';
import { mediaRouter } from '../routes/media';
import { meRouter } from '../routes/me';

export interface AppDependencies {
  checks?: Record<string, () => Promise<void>>;
}

export function createApp(dependencies: AppDependencies = {}): Express {
  const env = getEnv();
  const allowedOrigins = new Set(
    env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean),
  );
  const app = express();
  if (env.TRUST_PROXY) app.set('trust proxy', 1);

  app.disable('x-powered-by');
  app.use(
    pinoHttp({
      logger,
      genReqId: (request, response) => {
        const id = request.headers['x-request-id']?.toString().slice(0, 128) || randomUUID();
        response.setHeader('x-request-id', id);
        return id;
      },
      customLogLevel: (_request, response, error) =>
        error || response.statusCode >= 500
          ? 'error'
          : response.statusCode >= 400
            ? 'warn'
            : 'info',
    }),
  );
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false,
    }),
  );
  app.use(
    cors({
      credentials: false,
      maxAge: 86_400,
      origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) callback(null, true);
        else callback(new HttpError(403, 'origin_forbidden', 'Origin is not allowed'));
      },
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: '256kb', strict: true }));
  app.use(recordMetrics);
  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: env.NODE_ENV === 'test' ? 10_000 : 120,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
    }),
  );

  app.get('/health/live', (_request, response) => {
    response.json({ status: 'ok', release: env.RELEASE_SHA });
  });
  app.get('/health/ready', async (_request, response) => {
    const checks = dependencies.checks ?? readinessChecks();
    const entries = await Promise.all(
      Object.entries(checks).map(async ([name, check]) => {
        try {
          await check();
          return [name, 'ok'] as const;
        } catch {
          return [name, 'error'] as const;
        }
      }),
    );
    const details = Object.fromEntries(entries);
    const ready = entries.every(([, status]) => status === 'ok');
    response.status(ready ? 200 : 503).json({ status: ready ? 'ready' : 'degraded', checks: details });
  });
  // Compatibility for existing platform health checks.
  app.get('/health', (_request, response) => response.redirect(307, '/health/live'));
  app.get('/metrics', metricsEndpoint);

  app.use(optionalAuth);
  app.use('/v1', catalogRouter);
  app.use('/v1/media', mediaRouter);
  app.use('/v1/me', meRouter);
  app.use('/v1/generation-jobs', jobsRouter);
  // Compatibility alias for older clients.
  app.use('/v1/podcast-jobs', jobsRouter);
  app.use('/v1/editor', editorialRouter);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
