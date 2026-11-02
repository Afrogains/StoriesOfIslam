import { execFile } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { mkdtemp, readdir, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { ReadableStream as WebReadableStream } from 'node:stream/web';
import { promisify } from 'node:util';
import { getEnv } from '../config/env';
import { parsePodcastFeed, vttToText, type PlaylistVideo, type PodcastEpisode } from './matching';

const run = promisify(execFile);
const USER_AGENT = 'StoriesOfIslam/1.0 (+https://storiesofislam.app; editorial import)';

/** Strip anything that could carry a credential before it reaches logs or reports. */
export function safeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message
    .replace(/([?&](?:key|api_key|token|access_token)=)[^&\s"]+/gi, '$1[REDACTED]')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/g, 'Bearer [REDACTED]')
    .replace(/\bsk-[A-Za-z0-9_-]{8,}/g, '[REDACTED]')
    .slice(0, 1000);
}

export async function withRetry<T>(
  label: string,
  attempts: number,
  task: (attempt: number) => Promise<T>,
  onRetry?: (attempt: number, error: string) => void,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await task(attempt);
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        onRetry?.(attempt, safeError(error));
        await new Promise((resolve) => setTimeout(resolve, Math.min(30_000, 1000 * 2 ** (attempt - 1))));
      }
    }
  }
  throw new Error(`${label} failed after ${attempts} attempt(s): ${safeError(lastError)}`);
}

async function ytDlp(args: string[], timeoutMs = 120_000): Promise<string> {
  const env = getEnv();
  const cookieArgs = env.YTDLP_COOKIES_FILE ? ['--cookies', env.YTDLP_COOKIES_FILE] : [];
  try {
    const { stdout } = await run(env.YTDLP_PATH, [...cookieArgs, ...args], {
      timeout: timeoutMs,
      maxBuffer: 32 * 1024 * 1024,
    });
    return stdout;
  } catch (error) {
    const stderr = String((error as { stderr?: string }).stderr ?? '');
    const reason = stderr.split('\n').find((line) => line.startsWith('ERROR:'));
    throw new Error(`yt-dlp ${reason ?? safeError(error).split('\n')[0]}`, { cause: error });
  }
}

export async function fetchPlaylistVideos(playlistId: string): Promise<PlaylistVideo[]> {
  const env = getEnv();
  if (env.YOUTUBE_API_KEY) return fetchPlaylistViaDataApi(playlistId, env.YOUTUBE_API_KEY);
  const stdout = await ytDlp([
    '--flat-playlist',
    '-J',
    `https://www.youtube.com/playlist?list=${encodeURIComponent(playlistId)}`,
  ]);
  const payload = JSON.parse(stdout) as {
    entries?: Array<{ id?: string; title?: string | null; duration?: number | null }>;
  };
  return (payload.entries ?? [])
    .filter((entry): entry is { id: string; title: string; duration?: number | null } =>
      Boolean(entry.id && entry.title))
    .map((entry, position) => ({
      videoId: entry.id,
      title: entry.title,
      position,
      durationSeconds: entry.duration ?? null,
    }));
}

async function fetchPlaylistViaDataApi(playlistId: string, apiKey: string): Promise<PlaylistVideo[]> {
  const videos: PlaylistVideo[] = [];
  let pageToken = '';
  do {
    const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
    url.searchParams.set('part', 'snippet,status');
    url.searchParams.set('maxResults', '50');
    url.searchParams.set('playlistId', playlistId);
    url.searchParams.set('key', apiKey);
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`YouTube Data API responded ${response.status}`);
    const page = (await response.json()) as {
      nextPageToken?: string;
      items?: Array<{
        snippet?: { title?: string; position?: number; resourceId?: { videoId?: string } };
        status?: { privacyStatus?: string };
      }>;
    };
    for (const item of page.items ?? []) {
      const videoId = item.snippet?.resourceId?.videoId;
      const title = item.snippet?.title;
      if (!videoId || !title || item.status?.privacyStatus === 'private') continue;
      videos.push({ videoId, title, position: item.snippet?.position ?? videos.length, durationSeconds: null });
    }
    pageToken = page.nextPageToken ?? '';
  } while (pageToken);
  return videos;
}

export async function fetchPodcastEpisodes(feedUrl: string): Promise<PodcastEpisode[]> {
  const response = await fetch(feedUrl, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/rss+xml' } });
  if (!response.ok) throw new Error(`Podcast feed responded ${response.status}`);
  return parsePodcastFeed(await response.text());
}

export async function createWorkDir(): Promise<{ dir: string; cleanup: () => Promise<void> }> {
  const dir = await mkdtemp(join(tmpdir(), 'names-import-'));
  return { dir, cleanup: () => rm(dir, { recursive: true, force: true }) };
}

export async function downloadAudio(url: string, destination: string): Promise<number> {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:') throw new Error('Only https audio sources are allowed');
  const response = await fetch(parsed, { headers: { 'User-Agent': USER_AGENT, Accept: 'audio/mpeg' } });
  if (!response.ok || !response.body) throw new Error(`Audio download responded ${response.status}`);
  await pipeline(Readable.fromWeb(response.body as WebReadableStream), createWriteStream(destination));
  const { size } = await stat(destination);
  if (size < 10_000) throw new Error('Downloaded audio is unexpectedly small');
  return size;
}

/** Published captions (manual or auto) via yt-dlp. Returns null when none are available. */
export async function fetchYoutubeCaptions(videoId: string, workDir: string): Promise<string | null> {
  await ytDlp([
    '--skip-download',
    '--write-subs',
    '--write-auto-subs',
    '--sub-langs',
    'en.*,en',
    '--sub-format',
    'vtt',
    '-o',
    join(workDir, '%(id)s.%(ext)s'),
    `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`,
  ]);
  const files = (await readdir(workDir)).filter((file) => file.startsWith(videoId) && file.endsWith('.vtt'));
  if (!files.length) return null;
  const manual = files.find((file) => !file.includes('-orig')) ?? files[0];
  const text = vttToText(await readFile(join(workDir, manual), 'utf8'));
  return text.length > 200 ? text : null;
}

export interface SegmentResult {
  index: number;
  startSeconds: number;
  endSeconds: number;
  status: 'complete' | 'failed';
  attempts: number;
  error?: string;
  text?: string;
}

/**
 * Speech-to-text over fixed-length ffmpeg segments so one failed chunk can be
 * retried or reported without losing the rest of the lesson.
 */
export async function transcribeAudioInSegments(input: {
  audioPath: string;
  durationSeconds: number;
  workDir: string;
  segmentSeconds: number;
  retries: number;
  onProgress?: (message: string) => void;
}): Promise<SegmentResult[]> {
  const env = getEnv();
  if (!env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not configured for speech-to-text');
  const results: SegmentResult[] = [];
  const count = Math.max(1, Math.ceil(input.durationSeconds / input.segmentSeconds));
  for (let index = 0; index < count; index += 1) {
    const startSeconds = index * input.segmentSeconds;
    const endSeconds = Math.min(input.durationSeconds, startSeconds + input.segmentSeconds);
    const segmentPath = join(input.workDir, `segment-${index}.mp3`);
    let attempts = 0;
    try {
      const text = await withRetry(`segment ${index}`, input.retries, async (attempt) => {
        attempts = attempt;
        await run(env.FFMPEG_PATH, [
          '-y', '-loglevel', 'error', '-ss', String(startSeconds), '-t', String(input.segmentSeconds),
          '-i', input.audioPath, '-ac', '1', '-ar', '16000', '-b:a', '48k', segmentPath,
        ], { timeout: 120_000 });
        const form = new FormData();
        form.append('model', env.OPENAI_TRANSCRIBE_MODEL);
        form.append('response_format', 'text');
        form.append('file', new Blob([await readFile(segmentPath)], { type: 'audio/mpeg' }), `segment-${index}.mp3`);
        const response = await fetch(`${env.OPENAI_BASE_URL.replace(/\/$/, '')}/audio/transcriptions`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` },
          body: form,
        });
        if (!response.ok) throw new Error(`Speech-to-text responded ${response.status}`);
        return (await response.text()).trim();
      });
      results.push({ index, startSeconds, endSeconds, status: 'complete', attempts, text });
    } catch (error) {
      results.push({ index, startSeconds, endSeconds, status: 'failed', attempts, error: safeError(error) });
    }
    input.onProgress?.(`segment ${index + 1}/${count} ${results[results.length - 1].status}`);
  }
  return results;
}

/** Draft notes for a reviewer to edit; never shown to users until approved. */
export async function draftDescription(input: {
  transliteration: string;
  meaning: string;
  transcript: string;
}): Promise<string | null> {
  const env = getEnv();
  if (!env.OPENAI_API_KEY) return null;
  const response = await fetch(`${env.OPENAI_BASE_URL.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content:
            'You summarise an Islamic lecture transcript for a reviewed study app. Use only what the speaker says. ' +
            'Do not invent hadith, verses or citations. Write 3 short paragraphs (max 220 words) in plain English.',
        },
        {
          role: 'user',
          content: `Name: ${input.transliteration} (${input.meaning})\n\nTranscript:\n${input.transcript.slice(0, 60_000)}`,
        },
      ],
    }),
  });
  if (!response.ok) throw new Error(`Description draft responded ${response.status}`);
  const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return payload.choices?.[0]?.message?.content?.trim() || null;
}
