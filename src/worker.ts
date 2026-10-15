import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { getEnv } from './config/env';
import { logger } from './config/logger';
import { closeDatabase, query } from './db/pool';
import { jobRepository, type GenerationJob } from './repositories/jobRepository';
import { PodcastScriptGenerator } from './services/PodcastScriptGenerator';
import { ObjectStorageService } from './services/ObjectStorageService';
import { VoiceSynthesisService } from './services/VoiceSynthesisService';
import {
  GeneratePodcastInputSchema,
  GeneratedPodcastScriptSchema,
  type GeneratedPodcastScript,
} from './types/podcast';

const env = getEnv();
const workerId = `${process.env.HOSTNAME ?? 'worker'}-${randomUUID()}`;
const scriptGenerator = new PodcastScriptGenerator({ allowFallback: false });
const storage = new ObjectStorageService();
let stopping = false;

async function processJob(job: GenerationJob): Promise<void> {
  logger.info({ jobId: job.id, jobType: job.jobType }, 'Processing generation job');
  if (job.jobType === 'podcast_script') {
    const input = GeneratePodcastInputSchema.parse(job.input);
    const script = await scriptGenerator.generateScript(input);
    await jobRepository.complete(job.id, { script }, true);
    return;
  }

  let script: GeneratedPodcastScript;
  if (job.jobType === 'full_episode') {
    script = await scriptGenerator.generateScript(GeneratePodcastInputSchema.parse(job.input));
  } else {
    script = GeneratedPodcastScriptSchema.parse(job.input.script ?? job.input);
  }

  const scratch = join('/tmp', `stories-voice-${job.id}`);
  const synthesizer = new VoiceSynthesisService({
    outputDir: scratch,
    allowEstimatedOutput: false,
    ffmpegPath: env.FFMPEG_PATH,
  });

  try {
    const audio = await synthesizer.synthesizeEpisode(script);
    if (audio.estimated || !audio.usedFfmpeg || audio.totalDurationMs <= 0) {
      throw new Error('Production audio failed verification');
    }
    const audioBody = await readFile(audio.filePath);
    const timelineBody = await readFile(audio.metadataPath);
    if (audioBody.length === 0 || timelineBody.length === 0) {
      throw new Error('Production synthesis produced an empty artifact');
    }

    const prefix = `drafts/${script.storyId}/${job.id}`;
    const audioObject = await storage.uploadBuffer({
      objectKey: `${prefix}.${audio.format}`,
      body: audioBody,
      mimeType: audio.format === 'm4a' ? 'audio/mp4' : 'audio/mpeg',
      public: false,
      metadata: { jobId: job.id, storyId: script.storyId },
    });
    const timelineObject = await storage.uploadBuffer({
      objectKey: `${prefix}.timeline.json`,
      body: timelineBody,
      mimeType: 'application/json',
      public: false,
      metadata: { jobId: job.id, storyId: script.storyId },
    });

    await query(
      `INSERT INTO media_assets(
        id,story_id,generation_job_id,bucket,object_key,mime_type,size_bytes,
        checksum_sha256,duration_ms,timeline_object_key,is_public
      ) VALUES(?,?,?,?,?,?,?,?,?,?,0)`,
      [
        randomUUID(),
        job.storyId,
        job.id,
        audioObject.bucket,
        audioObject.objectKey,
        audio.format === 'm4a' ? 'audio/mp4' : 'audio/mpeg',
        audioObject.sizeBytes,
        audioObject.checksumSha256,
        audio.totalDurationMs,
        timelineObject.objectKey,
      ],
    );

    await jobRepository.complete(
      job.id,
      {
        script,
        audio: {
          bucket: audioObject.bucket,
          objectKey: audioObject.objectKey,
          timelineObjectKey: timelineObject.objectKey,
          durationMs: audio.totalDurationMs,
          checksumSha256: audioObject.checksumSha256,
        },
      },
      true,
    );
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
}

async function loop(index: number): Promise<void> {
  while (!stopping) {
    const job = await jobRepository.claim(`${workerId}-${index}`);
    if (!job) {
      await new Promise((resolve) => setTimeout(resolve, env.WORKER_POLL_INTERVAL_MS));
      continue;
    }
    try {
      await processJob(job);
    } catch (error) {
      logger.error({ err: error, jobId: job.id }, 'Generation job failed');
      await jobRepository.fail(job.id, error);
    }
  }
}

async function main(): Promise<void> {
  await storage.check();
  logger.info({ workerId, concurrency: env.WORKER_CONCURRENCY }, 'Worker started');
  await Promise.all(
    Array.from({ length: env.WORKER_CONCURRENCY }, (_, index) => loop(index)),
  );
}

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'Worker shutting down');
  stopping = true;
  await closeDatabase();
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

void main().catch(async (error) => {
  logger.fatal({ err: error }, 'Worker failed to start');
  await closeDatabase();
  process.exitCode = 1;
});
