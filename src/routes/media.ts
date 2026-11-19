import { Router, type Request, type Response } from 'express';
import { getEnv } from '../config/env';
import { HttpError, asyncHandler } from '../http/errors';

export const mediaRouter = Router();

/**
 * Cloud TTS readiness — mirrors worker VoiceSynthesisService providers so
 * operators can confirm the TTS package is wired after merging with mobile.
 */
mediaRouter.get(
  '/tts-status',
  asyncHandler(async (_request: Request, response: Response) => {
    const env = getEnv();
    const providers = {
      elevenlabs: Boolean(env.ELEVENLABS_API_KEY && !env.ELEVENLABS_API_KEY.includes('placeholder')),
      google: Boolean(env.GOOGLE_TTS_API_KEY),
      edgeTts: true,
    };
    response.setHeader('Cache-Control', 'no-store');
    response.json({
      data: {
        package: 'src/tts',
        clientPackage: 'mobile/src/tts',
        workerUses: 'VoiceSynthesisService',
        providers,
        readyForBatchSynthesis: providers.elevenlabs || providers.google || providers.edgeTts,
      },
    });
  }),
);

const ALLOWED_HOSTS = new Set([
  'podcasts.muslimcentral.com',
  'rss.muslimcentral.com',
]);

function assertAllowedAudioUrl(raw: unknown): URL {
  if (typeof raw !== 'string' || !raw.trim()) {
    throw new HttpError(400, 'invalid_url', 'A media url query parameter is required');
  }
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new HttpError(400, 'invalid_url', 'Media url must be an absolute http(s) URL');
  }
  if (parsed.protocol !== 'https:') {
    throw new HttpError(400, 'invalid_url', 'Only https media urls are allowed');
  }
  if (!ALLOWED_HOSTS.has(parsed.hostname)) {
    throw new HttpError(403, 'host_not_allowed', 'Media host is not on the allowlist');
  }
  if (!parsed.pathname.toLowerCase().endsWith('.mp3')) {
    throw new HttpError(400, 'invalid_url', 'Only .mp3 media urls are allowed');
  }
  return parsed;
}

/**
 * Same-origin audio proxy for web clients.
 * Muslim Central blocks browser requests that send a third-party Referer,
 * so web playback must stream through our API. Native apps use direct URLs.
 */
mediaRouter.get(
  '/the-names-audio',
  asyncHandler(async (request: Request, response: Response) => {
    const target = assertAllowedAudioUrl(request.query.url);
    const headers: Record<string, string> = {
      'User-Agent':
        'StoriesOfIslam/1.0 (+https://storiesofislam.app; educational podcast playback)',
      Accept: 'audio/mpeg,audio/*;q=0.9,*/*;q=0.8',
    };
    const range = request.headers.range;
    if (typeof range === 'string' && range) headers.Range = range;

    const upstream = await fetch(target.toString(), { headers, redirect: 'follow' });
    if (!(upstream.ok || upstream.status === 206)) {
      throw new HttpError(
        upstream.status === 404 ? 404 : 502,
        'upstream_unavailable',
        'Podcast audio could not be fetched from the source',
      );
    }

    response.status(upstream.status);
    response.setHeader('Cache-Control', 'public,max-age=3600,stale-while-revalidate=86400');
    response.setHeader('Accept-Ranges', upstream.headers.get('accept-ranges') ?? 'bytes');
    const contentType = upstream.headers.get('content-type') ?? 'audio/mpeg';
    response.setHeader('Content-Type', contentType);
    const contentLength = upstream.headers.get('content-length');
    if (contentLength) response.setHeader('Content-Length', contentLength);
    const contentRange = upstream.headers.get('content-range');
    if (contentRange) response.setHeader('Content-Range', contentRange);

    if (!upstream.body) {
      response.end();
      return;
    }

    const reader = upstream.body.getReader();
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (!response.write(Buffer.from(value))) {
          await new Promise<void>((resolve) => response.once('drain', resolve));
        }
      }
      response.end();
    } catch (error) {
      reader.cancel().catch(() => undefined);
      if (!response.headersSent) {
        throw error;
      }
      response.destroy();
    }
  }),
);
