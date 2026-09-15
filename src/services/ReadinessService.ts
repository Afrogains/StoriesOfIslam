import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { getEnv } from '../config/env';
import { checkDatabase, query } from '../db/pool';
import { objectStorageService } from './ObjectStorageService';

const execFileAsync = promisify(execFile);

export function readinessChecks(): Record<string, () => Promise<void>> {
  const env = getEnv();
  return {
    database: checkDatabase,
    queue: async () => {
      await query('SELECT 1 FROM generation_jobs LIMIT 1');
    },
    storage: () => objectStorageService.check(),
    keycloak: async () => {
      const response = await fetch(`${env.KEYCLOAK_ISSUER}/.well-known/openid-configuration`, {
        signal: AbortSignal.timeout(5_000),
      });
      if (!response.ok) throw new Error(`Keycloak discovery failed (${response.status})`);
      const discovery = (await response.json()) as { issuer?: string; jwks_uri?: string };
      if (discovery.issuer !== env.KEYCLOAK_ISSUER || !discovery.jwks_uri) {
        throw new Error('Keycloak discovery document does not match configured issuer');
      }
    },
    ffmpeg: async () => {
      await execFileAsync(env.FFMPEG_PATH, ['-version'], { timeout: 5_000 });
    },
    providers: async () => {
      if (!env.OPENAI_API_KEY || !env.ELEVENLABS_API_KEY) {
        throw new Error('Required AI/TTS provider credentials are not configured');
      }
    },
  };
}
