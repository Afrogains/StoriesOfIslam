import { z } from 'zod';

const booleanFromString = (defaultValue: 'true' | 'false' = 'false') =>
  z
    .enum(['true', 'false'])
    .default(defaultValue)
    .transform((value) => value === 'true');

const optionalUrl = z.string().url().optional().or(z.literal(''));

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  APP_ORIGIN: z.string().url().default('http://localhost:8081'),
  CORS_ORIGINS: z.string().default('http://localhost:8081'),
  TRUST_PROXY: booleanFromString(),

  DATABASE_URL: z.string().min(1).default('postgresql://stories_app:change-me@localhost:5432/stories_of_islam'),
  DATABASE_SSL: booleanFromString(),
  DB_POOL_MAX: z.coerce.number().int().min(1).max(50).default(10),

  KEYCLOAK_ISSUER: z.string().url().default('http://localhost:8080/realms/stories-of-islam'),
  KEYCLOAK_AUDIENCE: z.string().min(1).default('stories-api'),
  KEYCLOAK_ADMIN_CLIENT_ID: z.string().optional(),
  KEYCLOAK_ADMIN_CLIENT_SECRET: z.string().optional(),

  S3_ENDPOINT: z.string().url().default('http://localhost:9000'),
  S3_REGION: z.string().default('us-east-1'),
  S3_ACCESS_KEY: z.string().min(1).default('stories-api'),
  S3_SECRET_KEY: z.string().min(1).default('change-me'),
  S3_PUBLIC_BUCKET: z.string().min(3).default('stories-public'),
  S3_PRIVATE_BUCKET: z.string().min(3).default('stories-private'),
  S3_PUBLIC_BASE_URL: z.string().url().default('http://localhost:9000/stories-public'),
  S3_FORCE_PATH_STYLE: booleanFromString('true'),

  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4.1-mini'),
  ELEVENLABS_API_KEY: z.string().optional(),
  ELEVENLABS_VOICE_HOST_A: z.string().optional(),
  ELEVENLABS_VOICE_HOST_B: z.string().optional(),
  GOOGLE_TTS_API_KEY: z.string().optional(),
  FFMPEG_PATH: z.string().default('ffmpeg'),

  WORKER_POLL_INTERVAL_MS: z.coerce.number().int().min(250).default(2000),
  WORKER_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(10).default(3),
  WORKER_CONCURRENCY: z.coerce.number().int().min(1).max(10).default(1),
  MAX_GENERATION_JOBS_PER_USER_PER_DAY: z.coerce.number().int().min(1).max(100).default(10),

  SENTRY_DSN: optionalUrl,
  RELEASE_SHA: z.string().default('local'),
  METRICS_TOKEN: z.string().min(16).optional(),
});

export type AppEnv = z.infer<typeof EnvSchema>;

let cached: AppEnv | undefined;

export function getEnv(): AppEnv {
  if (cached) return cached;

  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment configuration: ${details}`);
  }

  if (parsed.data.NODE_ENV === 'production') {
    const insecure = [
      parsed.data.DATABASE_URL.includes('change-me'),
      parsed.data.S3_SECRET_KEY === 'change-me',
      !parsed.data.KEYCLOAK_ISSUER.startsWith('https://'),
      !parsed.data.S3_ENDPOINT.startsWith('https://'),
      !parsed.data.METRICS_TOKEN,
    ];
    if (insecure.some(Boolean)) {
      throw new Error('Production environment contains placeholder credentials or non-TLS service URLs');
    }
  }

  cached = parsed.data;
  return cached;
}

export function resetEnvForTests(): void {
  cached = undefined;
}
