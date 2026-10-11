import 'dotenv/config';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { getEnv } from '../config/env';
import { logger } from '../config/logger';
import {
  matchPlaylist,
  type DivineNameRecord,
  type VideoNameMatch,
} from '../names/matching';
import {
  createWorkDir,
  downloadAudio,
  draftDescription,
  fetchPlaylistVideos,
  fetchPodcastEpisodes,
  fetchYoutubeCaptions,
  safeError,
  transcribeAudioInSegments,
  withRetry,
  type SegmentResult,
} from '../names/sources';
import type { TranscriptSource, TranscriptStatus } from '../repositories/namesMediaRepository';

const HELP = `Import "The Names" playlist into divine_name_media drafts.

  npm run names:import -- --dry-run
  npm run names:import -- --names=5,9,16
  npm run names:import -- --classes=12,14 --batch-size=2 --retries=3

Options:
  --dry-run                    Match and report only; no DB, storage or AI calls
  --names=1,5                  Only these Name numbers
  --classes=12,14              Only these class numbers
  --limit=N                    At most N matched videos
  --batch-size=N               Videos per batch (default 3)
  --retries=N                  Attempts per network step (default 3)
  --segment-seconds=N          Speech-to-text chunk length (default 600)
  --map=VIDEO_ID:1,2           Manually map a video to Name numbers (repeatable)
  --skip-audio                 Do not download/store podcast audio
  --skip-transcript            Do not fetch captions or run speech-to-text
  --only-incomplete            Skip videos whose transcripts are already complete
  --confirm-overwrite-approved Refresh drafts on approved records (approved text stays live until re-approved)
  --report=path.json           Report path (default tmp/names-import-<timestamp>.json)`;

interface Options {
  dryRun: boolean;
  names: Set<number> | null;
  classes: Set<number> | null;
  limit: number | null;
  batchSize: number;
  retries: number;
  segmentSeconds: number;
  overrides: Record<string, number[]>;
  skipAudio: boolean;
  skipTranscript: boolean;
  onlyIncomplete: boolean;
  confirmOverwriteApproved: boolean;
  reportPath: string;
}

interface ItemReport {
  videoId: string;
  classNumber: number | null;
  videoTitle: string;
  nameNumbers: number[];
  podcastTitle: string | null;
  rows: Array<{ nameNumber: number; action: 'created' | 'updated' | 'would_create_or_update' }>;
  audio: 'stored' | 'reused' | 'skipped' | 'no_source' | 'failed' | 'planned';
  transcript: TranscriptStatus | 'skipped' | 'skipped_approved' | 'planned';
  transcriptSource: TranscriptSource | null;
}

function numberSet(raw: string | undefined): Set<number> | null {
  if (!raw) return null;
  const values = raw.split(',').map((value) => Number(value.trim())).filter(Number.isInteger);
  return values.length ? new Set(values) : null;
}

function positiveInt(raw: string | undefined, fallback: number, max: number): number {
  const value = raw ? Number(raw) : fallback;
  if (!Number.isInteger(value) || value < 1 || value > max) throw new Error(`Invalid numeric option: ${raw}`);
  return value;
}

export function parseOptions(argv: string[]): Options | null {
  const { values } = parseArgs({
    args: argv,
    options: {
      'dry-run': { type: 'boolean', default: false },
      names: { type: 'string' },
      classes: { type: 'string' },
      limit: { type: 'string' },
      'batch-size': { type: 'string' },
      retries: { type: 'string' },
      'segment-seconds': { type: 'string' },
      map: { type: 'string', multiple: true },
      'skip-audio': { type: 'boolean', default: false },
      'skip-transcript': { type: 'boolean', default: false },
      'only-incomplete': { type: 'boolean', default: false },
      'confirm-overwrite-approved': { type: 'boolean', default: false },
      report: { type: 'string' },
      help: { type: 'boolean', default: false },
    },
  });
  if (values.help) return null;
  const overrides: Record<string, number[]> = {};
  for (const entry of values.map ?? []) {
    const [videoId, numbers] = entry.split(':');
    const parsed = [...(numberSet(numbers) ?? [])].filter((value) => value >= 1 && value <= 99);
    if (!videoId || !parsed.length) throw new Error(`Invalid --map value: ${entry}`);
    overrides[videoId] = parsed;
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return {
    dryRun: values['dry-run'] ?? false,
    names: numberSet(values.names),
    classes: numberSet(values.classes),
    limit: values.limit ? positiveInt(values.limit, 1, 500) : null,
    batchSize: positiveInt(values['batch-size'], 3, 20),
    retries: positiveInt(values.retries, 3, 10),
    segmentSeconds: positiveInt(values['segment-seconds'], 600, 1400),
    overrides,
    skipAudio: values['skip-audio'] ?? false,
    skipTranscript: values['skip-transcript'] ?? false,
    onlyIncomplete: values['only-incomplete'] ?? false,
    confirmOverwriteApproved: values['confirm-overwrite-approved'] ?? false,
    reportPath: resolve(values.report ?? join('tmp', `names-import-${stamp}.json`)),
  };
}

export function selectMatches(matches: VideoNameMatch[], options: Pick<Options, 'names' | 'classes' | 'limit'>) {
  const selected = matches
    .filter((match) => match.nameNumbers.length > 0)
    .map((match) => ({
      ...match,
      nameNumbers: options.names
        ? match.nameNumbers.filter((number) => options.names!.has(number))
        : match.nameNumbers,
    }))
    .filter((match) => match.nameNumbers.length > 0)
    .filter((match) => !options.classes || (match.classNumber != null && options.classes.has(match.classNumber)))
    .sort((a, b) => (a.classNumber ?? 0) - (b.classNumber ?? 0));
  return options.limit ? selected.slice(0, options.limit) : selected;
}

export function buildCoverageReport(matches: VideoNameMatch[], names: DivineNameRecord[]) {
  const covered = new Set(matches.flatMap((match) => match.nameNumbers));
  return {
    unmatchedVideos: matches
      .filter((match) => match.nameNumbers.length === 0)
      .map((match) => ({
        videoId: match.video.videoId,
        title: match.video.title,
        classNumber: match.classNumber,
        reason: match.unmatchedTokens.length
          ? `Name(s) not in the app's 99 list: ${match.unmatchedTokens.join(', ')}`
          : match.ambiguousTokens.length
            ? `Ambiguous name token(s): ${match.ambiguousTokens.join(', ')}`
            : 'Title does not name a Name; map manually with --map',
      })),
    partiallyMatchedVideos: matches
      .filter((match) => match.nameNumbers.length > 0 && (match.unmatchedTokens.length || match.ambiguousTokens.length))
      .map((match) => ({
        videoId: match.video.videoId,
        classNumber: match.classNumber,
        matched: match.nameNumbers,
        unmatchedTokens: [...match.unmatchedTokens, ...match.ambiguousTokens],
      })),
    videosWithoutPodcastAudio: matches
      .filter((match) => match.nameNumbers.length > 0 && !match.podcast)
      .map((match) => ({ videoId: match.video.videoId, classNumber: match.classNumber, title: match.video.title })),
    namesWithoutVideo: names
      .filter((name) => !covered.has(name.number))
      .map((name) => ({ number: name.number, transliteration: name.transliteration })),
  };
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  if (!options) {
    process.stdout.write(`${HELP}\n`);
    return;
  }
  const env = getEnv();
  const startedAt = new Date().toISOString();
  const names = JSON.parse(
    await readFile(resolve(process.cwd(), 'db/divine-names.json'), 'utf8'),
  ) as DivineNameRecord[];
  const nameByNumber = new Map(names.map((name) => [name.number, name]));

  const videos = await withRetry('playlist fetch', options.retries, () => fetchPlaylistVideos(env.NAMES_PLAYLIST_ID));
  const episodes = await withRetry('podcast feed fetch', options.retries, () =>
    fetchPodcastEpisodes(env.NAMES_PODCAST_FEED_URL));
  const matches = matchPlaylist(videos, episodes, names, options.overrides);
  const selected = selectMatches(matches, options);
  logger.info(
    { videos: videos.length, episodes: episodes.length, selected: selected.length, dryRun: options.dryRun },
    'names import: playlist matched',
  );

  const items: ItemReport[] = [];
  const failures: Array<{ videoId: string; classNumber: number | null; step: string; error: string }> = [];
  const failedSegments: Array<{ videoId: string; classNumber: number | null; segment: number; startSeconds: number; error: string }> = [];

  if (options.dryRun) {
    for (const match of selected) {
      items.push({
        videoId: match.video.videoId,
        classNumber: match.classNumber,
        videoTitle: match.video.title,
        nameNumbers: match.nameNumbers,
        podcastTitle: match.podcast?.title ?? null,
        rows: match.nameNumbers.map((nameNumber) => ({ nameNumber, action: 'would_create_or_update' })),
        audio: options.skipAudio ? 'skipped' : match.podcast ? 'planned' : 'no_source',
        transcript: options.skipTranscript ? 'skipped' : 'planned',
        transcriptSource: null,
      });
    }
  } else {
    const { namesMediaRepository } = await import('../repositories/namesMediaRepository');
    const { objectStorageService } = await import('../services/ObjectStorageService');
    const { closeDatabase } = await import('../db/pool');
    try {
      await namesMediaRepository.upsertNames(names);
      const batches = Math.ceil(selected.length / options.batchSize);
      for (let batch = 0; batch < batches; batch += 1) {
        const slice = selected.slice(batch * options.batchSize, (batch + 1) * options.batchSize);
        logger.info({ batch: batch + 1, batches, videos: slice.length }, 'names import: batch started');
        for (const match of slice) {
          const { videoId } = match.video;
          const label = `class ${match.classNumber ?? '?'} ${match.nameNumbers
            .map((number) => nameByNumber.get(number)?.transliteration)
            .join(' & ')}`;
          const item: ItemReport = {
            videoId,
            classNumber: match.classNumber,
            videoTitle: match.video.title,
            nameNumbers: match.nameNumbers,
            podcastTitle: match.podcast?.title ?? null,
            rows: [],
            audio: 'skipped',
            transcript: 'skipped',
            transcriptSource: null,
          };
          items.push(item);
          const fail = async (step: string, error: unknown) => {
            const message = safeError(error);
            failures.push({ videoId, classNumber: match.classNumber, step, error: message });
            logger.warn({ videoId, step, error: message }, `names import: ${label} ${step} failed`);
            await namesMediaRepository.recordError(videoId, `${step}: ${message}`).catch(() => undefined);
          };

          try {
            for (const nameNumber of match.nameNumbers) {
              const row = await namesMediaRepository.upsertSource({
                nameNumber,
                videoId,
                playlistId: env.NAMES_PLAYLIST_ID,
                classNumber: match.classNumber,
                videoTitle: match.video.title,
                durationSeconds: match.video.durationSeconds ?? match.podcast?.durationSeconds ?? null,
                podcastTitle: match.podcast?.title ?? null,
                podcastAudioUrl: match.podcast?.audioUrl ?? null,
              });
              item.rows.push({ nameNumber, action: row.created ? 'created' : 'updated' });
            }
          } catch (error) {
            await fail('record', error);
            continue;
          }

          const rows = (await namesMediaRepository.findByVideo(videoId)).filter((row) =>
            match.nameNumbers.includes(row.name_number));
          const work = await createWorkDir();
          const audioPath = join(work.dir, `${videoId}.mp3`);
          let audioDownloaded = false;
          const ensureLocalAudio = async () => {
            if (audioDownloaded || !match.podcast) return audioDownloaded;
            await withRetry('audio download', options.retries, () => downloadAudio(match.podcast!.audioUrl, audioPath));
            audioDownloaded = true;
            return true;
          };

          try {
            if (!options.skipAudio) {
              if (!match.podcast) item.audio = 'no_source';
              else if (rows.every((row) => row.audio_asset_id)) item.audio = 'reused';
              else {
                try {
                  const objectKey = `names/drafts/${videoId}.mp3`;
                  let assetId = await namesMediaRepository.findDraftAssetByKey(env.S3_PRIVATE_BUCKET, objectKey);
                  if (assetId) item.audio = 'reused';
                  else {
                    await ensureLocalAudio();
                    const stored = await withRetry('audio upload', options.retries, () =>
                      objectStorageService.uploadFile({
                        filePath: audioPath,
                        objectKey,
                        mimeType: 'audio/mpeg',
                        public: false,
                        metadata: { source: 'muslimcentral', videoId },
                      }));
                    assetId = await namesMediaRepository.insertDraftAsset({
                      bucket: stored.bucket,
                      objectKey: stored.objectKey,
                      mimeType: 'audio/mpeg',
                      sizeBytes: stored.sizeBytes,
                      checksumSha256: stored.checksumSha256,
                      durationMs: match.podcast.durationSeconds ? match.podcast.durationSeconds * 1000 : null,
                    });
                    item.audio = 'stored';
                  }
                  await namesMediaRepository.attachAudio(videoId, assetId);
                } catch (error) {
                  item.audio = 'failed';
                  await fail('audio', error);
                }
              }
            }

            if (!options.skipTranscript) {
              const editable = rows.filter((row) => row.review_status !== 'approved' || options.confirmOverwriteApproved);
              const needsTranscript = editable.filter((row) =>
                !options.onlyIncomplete || !['complete', 'manual'].includes(row.transcript_status));
              if (!editable.length) item.transcript = 'skipped_approved';
              else if (!needsTranscript.length) item.transcript = 'skipped';
              else {
                let text: string | null = null;
                let source: TranscriptSource | null = null;
                let status: TranscriptStatus = 'pending';
                let segments: SegmentResult[] | null = null;
                try {
                  text = await withRetry('captions', options.retries, () => fetchYoutubeCaptions(videoId, work.dir));
                  if (text) {
                    source = 'youtube_captions';
                    status = 'complete';
                  }
                } catch (error) {
                  await fail('captions', error);
                }
                if (!text && env.OPENAI_API_KEY && match.podcast) {
                  try {
                    await ensureLocalAudio();
                    segments = await transcribeAudioInSegments({
                      audioPath,
                      durationSeconds: match.podcast.durationSeconds ?? match.video.durationSeconds ?? 3600,
                      workDir: work.dir,
                      segmentSeconds: options.segmentSeconds,
                      retries: options.retries,
                      onProgress: (message) => logger.info({ videoId }, `names import: ${label} ${message}`),
                    });
                    const done = segments.filter((segment) => segment.status === 'complete');
                    for (const segment of segments.filter((entry) => entry.status === 'failed')) {
                      failedSegments.push({
                        videoId,
                        classNumber: match.classNumber,
                        segment: segment.index,
                        startSeconds: segment.startSeconds,
                        error: segment.error ?? 'unknown',
                      });
                    }
                    text = done.map((segment) => segment.text).join('\n\n') || null;
                    source = 'speech_to_text';
                    status = done.length === segments.length ? 'complete' : done.length ? 'partial' : 'failed';
                  } catch (error) {
                    status = 'failed';
                    await fail('speech_to_text', error);
                  }
                }
                item.transcript = status;
                item.transcriptSource = source;
                for (const row of needsTranscript) {
                  let descriptionDraft: string | null = null;
                  if (text && status === 'complete') {
                    const name = nameByNumber.get(row.name_number)!;
                    descriptionDraft = await withRetry('description draft', options.retries, () =>
                      draftDescription({ transliteration: name.transliteration, meaning: name.meaning, transcript: text! }))
                      .catch(async (error) => {
                        await fail('description_draft', error);
                        return null;
                      });
                  }
                  await namesMediaRepository.saveTranscript({
                    id: row.id,
                    status,
                    source,
                    text,
                    segments: segments?.map((segment) => ({ ...segment, text: undefined })) ?? null,
                    descriptionDraft,
                    allowApproved: options.confirmOverwriteApproved,
                  });
                }
              }
            }
          } finally {
            await work.cleanup();
          }
          logger.info(
            { videoId, rows: item.rows, audio: item.audio, transcript: item.transcript },
            `names import: ${label} done`,
          );
        }
      }
    } finally {
      await closeDatabase();
    }
  }

  const report = {
    startedAt,
    finishedAt: new Date().toISOString(),
    dryRun: options.dryRun,
    playlistId: env.NAMES_PLAYLIST_ID,
    podcastFeed: env.NAMES_PODCAST_FEED_URL,
    filters: {
      names: options.names ? [...options.names] : null,
      classes: options.classes ? [...options.classes] : null,
      limit: options.limit,
    },
    totals: {
      playlistVideos: videos.length,
      podcastEpisodes: episodes.length,
      matchedVideos: matches.filter((match) => match.nameNumbers.length).length,
      namesCovered: new Set(matches.flatMap((match) => match.nameNumbers)).size,
      processedVideos: items.length,
      rowsCreated: items.flatMap((item) => item.rows).filter((row) => row.action === 'created').length,
      rowsUpdated: items.flatMap((item) => item.rows).filter((row) => row.action === 'updated').length,
      failures: failures.length,
      failedSegments: failedSegments.length,
    },
    ...buildCoverageReport(matches, names),
    failures,
    failedSegments,
    items,
  };
  await mkdir(dirname(options.reportPath), { recursive: true });
  await writeFile(options.reportPath, `${JSON.stringify(report, null, 2)}\n`);
  logger.info({ report: options.reportPath, totals: report.totals }, 'names import: report written');
}

if (require.main === module) {
  main().catch((error: unknown) => {
    logger.error({ error: safeError(error) }, 'names import failed');
    process.exitCode = 1;
  });
}
