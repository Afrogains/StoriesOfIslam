import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import type {
  GeneratedPodcastScript,
  PodcastDialogueTurn,
  SpeakerRole,
} from '../types/podcast';

const execFileAsync = promisify(execFile);

/* ------------------------------------------------------------------ types */

export type VoiceProviderId = 'elevenlabs' | 'google' | 'edge-tts';
export type AudioContainer = 'mp3' | 'm4a';

export interface VoiceSettings {
  /** Lower = more expressive variance, higher = more monotone. */
  stability: number;
  /** ElevenLabs "clarity + similarity enhancement". */
  clarity: number;
  /** Style exaggeration; kept low for measured scholarly delivery. */
  style: number;
  useSpeakerBoost: boolean;
}

export interface ProsodyProfile {
  /** SSML prosody rate, e.g. `95%`. */
  rate: string;
  /** SSML prosody pitch, e.g. `-2st`. */
  pitch: string;
  /** Pause inserted at sentence boundaries, in milliseconds. */
  sentencePauseMs: number;
}

export interface VoiceProfile {
  role: SpeakerRole;
  displayName: string;
  /** Persona the delivery is modelled after — documentation only. */
  personaReference: string;
  characterBrief: string;
  elevenLabsVoiceId: string;
  googleVoiceName: string;
  googleLanguageCode: string;
  edgeVoiceName: string;
  settings: VoiceSettings;
  prosody: ProsodyProfile;
}

/** Normalised dialogue turn — both supported payload shapes collapse to this. */
export interface SynthesisTurn {
  id: string;
  speaker: SpeakerRole;
  text: string;
  arabicTerms: string[];
}

/** UI marker describing when each host speaks in the stitched track. */
export interface SpeakerMarker {
  turnId: string;
  speaker: SpeakerRole;
  displayName: string;
  startMs: number;
  endMs: number;
  durationMs: number;
  text: string;
  arabicTerms: string[];
}

/** Character-level alignment, when the provider returns it. */
export interface WordTiming {
  turnId: string;
  word: string;
  startMs: number;
  endMs: number;
}

export interface SynthesizedEpisodeAudio {
  storyId: string;
  provider: VoiceProviderId;
  format: AudioContainer;
  filePath: string;
  metadataPath: string;
  totalDurationMs: number;
  sampleRate: number;
  markers: SpeakerMarker[];
  wordTimings: WordTiming[];
  /** True when durations were estimated rather than measured from real audio. */
  estimated: boolean;
  /** True when ffmpeg stitched the track (gapless, with real silence padding). */
  usedFfmpeg: boolean;
  generatedAt: string;
}

export interface VoiceSynthesisOptions {
  provider?: VoiceProviderId;
  apiKey?: string;
  /** ElevenLabs model. `eleven_multilingual_v2` handles Arabic code-switching. */
  modelId?: string;
  outputDir?: string;
  format?: AudioContainer;
  sampleRate?: number;
  /** Breath-length gap inserted between host turns. */
  interTurnGapMs?: number;
  ffmpegPath?: string;
  /** Development-only escape hatch. Production must never publish placeholders. */
  allowEstimatedOutput?: boolean;
  voiceOverrides?: Partial<Record<SpeakerRole, Partial<VoiceProfile>>>;
}

/** Minimal shape of a dialogue episode payload for voice synthesis. */
export interface EpisodeLikePayload {
  storyId: string;
  title?: string;
  timestamps: Array<{
    id: string;
    speaker: 'Host A' | 'Host B';
    textEn: string;
    textAr?: string;
  }>;
}

export type SynthesisPayload = EpisodeLikePayload | GeneratedPodcastScript;

/* --------------------------------------------------------- voice profiles */

/**
 * Voice IDs are environment-overridable because provider libraries differ per
 * account. Production must use licensed generic voices or a voice whose owner
 * supplied explicit, recorded consent; scholar impersonation is prohibited.
 */
export const VOICE_PROFILES: Record<SpeakerRole, VoiceProfile> = {
  host_a: {
    role: 'host_a',
    displayName: 'Host A — Scholar & Anchor',
    personaReference: 'Generic licensed British male educational voice',
    characterBrief:
      'Deep, soothing, authoritative. Steady unhurried pacing, long settled pauses, minimal pitch variance. Carries citations and Arabic terminology.',
    elevenLabsVoiceId: process.env.ELEVENLABS_VOICE_HOST_A ?? 'onwK4e9ZLuTAKqWW03F9',
    googleVoiceName: process.env.GOOGLE_VOICE_HOST_A ?? 'en-GB-Neural2-D',
    googleLanguageCode: 'en-GB',
    edgeVoiceName: process.env.EDGE_VOICE_HOST_A ?? 'en-GB-RyanNeural',
    settings: { stability: 0.45, clarity: 0.8, style: 0.12, useSpeakerBoost: true },
    prosody: { rate: '95%', pitch: '-2st', sentencePauseMs: 420 },
  },
  host_b: {
    role: 'host_b',
    displayName: 'Host B — Inquirer & Co-Host',
    personaReference: 'Generic licensed American male conversational voice',
    characterBrief:
      'Warm, articulate, reflective. Conversational lift on questions, slightly brighter timbre, shorter pauses. Carries the listener’s perspective.',
    elevenLabsVoiceId: process.env.ELEVENLABS_VOICE_HOST_B ?? 'nPczCjzI2devNBz1zQrb',
    googleVoiceName: process.env.GOOGLE_VOICE_HOST_B ?? 'en-US-Neural2-J',
    googleLanguageCode: 'en-US',
    edgeVoiceName: process.env.EDGE_VOICE_HOST_B ?? 'en-US-ChristopherNeural',
    settings: { stability: 0.45, clarity: 0.8, style: 0.28, useSpeakerBoost: true },
    prosody: { rate: '98%', pitch: '0st', sentencePauseMs: 320 },
  },
};

/**
 * Respellings for Islamic terminology that English TTS models mispronounce.
 * Applied only to the synthesis text — never to the text shown in the UI.
 */
export const PRONUNCIATION_LEXICON: ReadonlyArray<[RegExp, string]> = [
  [/\bAssalamu\s+Alaikum\b/gi, 'as-sa-laa-mu a-lay-kum'],
  [/\bWa\s+Alaikum\s+Assalam\b/gi, 'wa a-lay-kum as-sa-laam'],
  [/\bSubhanAllah\b/gi, 'sub-haan al-laah'],
  [/\bInshaAllah\b/gi, 'in shaa al-laah'],
  [/\bAlhamdulillah\b/gi, 'al-ham-du-lil-laah'],
  [/\bAllah\b/g, 'al-laah'],
  [/\bMuhammad\b/g, 'mu-ham-mad'],
  [/\bHadith\b/gi, 'ha-deeth'],
  [/\bAhadith\b/gi, 'a-haa-deeth'],
  [/\bSahih\b/gi, 'sa-heeh'],
  [/\bHasan\b/g, 'ha-san'],
  [/\bAthar\b/gi, 'a-thar'],
  [/\bIsnad\b/gi, 'is-naad'],
  [/\bNiyyah\b/gi, 'nee-yah'],
  [/\bIkhlas\b/gi, 'ikh-laas'],
  [/\bIhsan\b/gi, 'ih-saan'],
  [/\bTaqwa\b/gi, 'taq-waa'],
  [/\bTawakkul\b/gi, 'ta-wak-kul'],
  [/\bTawhid\b/gi, 'taw-heed'],
  [/\bTazkiyah\b/gi, 'taz-kee-yah'],
  [/\bZuhd\b/gi, 'zuhd'],
  [/\bIlm\b/g, 'ilm'],
  [/\bAmal\b/g, 'a-mal'],
  [/\bSeerah\b/gi, 'see-rah'],
  [/\bShama[’']il\b/gi, 'sha-maa-il'],
  [/\bSahabah\b/gi, 'sa-haa-bah'],
  [/\bTabi[’']un\b/gi, 'taa-bi-oon'],
  [/\bQisas\s+al-Anbiya\b/gi, 'qi-sas al an-bi-yaa'],
  [/\bMihna\b/gi, 'mih-nah'],
  [/\brahimahullah\b/gi, 'ra-hi-ma-hul-laah'],
  [/\bradiyallahu\s+anhu\b/gi, 'ra-di-yal-laa-hu an-hu'],
  [/\bAbdullah\s+ibn\s+Mas[’']ud\b/gi, 'ab-dul-laah ibn mas-ood'],
  [/\bBaqiyy\s+ibn\s+Makhlad\b/gi, 'ba-qee ibn makh-lad'],
  [/\bImam\s+Ahmad\b/gi, 'i-maam ah-mad'],
  [/\bIbn\s+Kathir\b/gi, 'ibn ka-theer'],
  [/\bal-Dhahabi\b/gi, 'ad-dha-ha-bee'],
];

/** Average speaking rate used only when no provider measurement is available. */
const BASE_WORDS_PER_MINUTE = 150;

/* ---------------------------------------------------------------- service */

export class VoiceSynthesisService {
  private readonly provider: VoiceProviderId;
  private readonly apiKey: string | undefined;
  private readonly modelId: string;
  private readonly outputDir: string;
  private readonly format: AudioContainer;
  private readonly sampleRate: number;
  private readonly interTurnGapMs: number;
  private readonly ffmpegPath: string;
  private readonly allowEstimatedOutput: boolean;
  private readonly profiles: Record<SpeakerRole, VoiceProfile>;

  constructor(options: VoiceSynthesisOptions = {}) {
    this.provider = options.provider ?? 'elevenlabs';
    this.apiKey =
      options.apiKey ??
      (this.provider === 'google' ? process.env.GOOGLE_TTS_API_KEY : process.env.ELEVENLABS_API_KEY);
    this.modelId = options.modelId ?? 'eleven_multilingual_v2';
    this.outputDir = options.outputDir ?? join(process.cwd(), 'public', 'audio', 'generated');
    this.format = options.format ?? 'mp3';
    this.sampleRate = options.sampleRate ?? 44100;
    this.interTurnGapMs = options.interTurnGapMs ?? 380;
    this.ffmpegPath = options.ffmpegPath ?? process.env.FFMPEG_PATH ?? 'ffmpeg';
    this.allowEstimatedOutput =
      options.allowEstimatedOutput ?? process.env.NODE_ENV !== 'production';

    this.profiles = {
      host_a: { ...VOICE_PROFILES.host_a, ...options.voiceOverrides?.host_a },
      host_b: { ...VOICE_PROFILES.host_b, ...options.voiceOverrides?.host_b },
    };
  }

  /**
   * Renders a dialogue payload into one contiguous multi-speaker track.
   * Each turn is synthesised with its own host voice, then stitched in order.
   */
  async synthesizeEpisode(payload: SynthesisPayload): Promise<SynthesizedEpisodeAudio> {
    const turns = VoiceSynthesisService.normalizeTurns(payload);
    if (turns.length === 0) {
      throw new Error('VoiceSynthesisService: payload contains no dialogue turns');
    }

    const rendered: RenderedTurn[] = [];

    for (let index = 0; index < turns.length; index += 1) {
      rendered.push(
        await this.renderTurn(turns[index]!, {
          previousText: turns[index - 1]?.text,
          nextText: turns[index + 1]?.text,
          // ElevenLabs conditions on up to three prior request IDs to keep
          // timbre and room tone continuous across separate calls.
          previousRequestIds: rendered
            .slice(-3)
            .map((turn) => turn.requestId)
            .filter((id): id is string => Boolean(id)),
        }),
      );
    }

    const stitched = await this.stitch(rendered);
    const timeline = this.buildTimeline(turns, rendered, stitched.usedFfmpeg);

    await mkdir(this.outputDir, { recursive: true });

    const storyId = VoiceSynthesisService.resolveStoryId(payload);
    const baseName = `${storyId}-2host`;
    const filePath = join(this.outputDir, `${baseName}.${this.format}`);
    const metadataPath = join(this.outputDir, `${baseName}.timeline.json`);

    await writeFile(filePath, stitched.audio);

    const result: SynthesizedEpisodeAudio = {
      storyId,
      provider: this.provider,
      format: this.format,
      filePath,
      metadataPath,
      totalDurationMs: timeline.totalDurationMs,
      sampleRate: this.sampleRate,
      markers: timeline.markers,
      wordTimings: timeline.wordTimings,
      estimated: rendered.some((turn) => turn.estimated),
      usedFfmpeg: stitched.usedFfmpeg,
      generatedAt: new Date().toISOString(),
    };

    await writeFile(metadataPath, JSON.stringify(result, null, 2), 'utf8');

    return result;
  }

  /** In-memory variant for serverless callers that stream instead of writing. */
  async synthesizeToBuffer(
    payload: SynthesisPayload,
  ): Promise<{ audio: Buffer; markers: SpeakerMarker[]; totalDurationMs: number }> {
    const turns = VoiceSynthesisService.normalizeTurns(payload);
    const rendered: RenderedTurn[] = [];

    for (const turn of turns) {
      rendered.push(await this.renderTurn(turn, {}));
    }

    const stitched = await this.stitch(rendered);
    const timeline = this.buildTimeline(turns, rendered, stitched.usedFfmpeg);

    return {
      audio: stitched.audio,
      markers: timeline.markers,
      totalDurationMs: timeline.totalDurationMs,
    };
  }

  /* ------------------------------------------------------ payload mapping */

  /** Accepts either the `PodcastEpisode` or `GeneratedPodcastScript` shape. */
  static normalizeTurns(payload: SynthesisPayload): SynthesisTurn[] {
    if ('dialogueTurns' in payload && Array.isArray(payload.dialogueTurns)) {
      return payload.dialogueTurns.map((turn: PodcastDialogueTurn, index: number) => ({
        id: turn.id ?? `turn-${index + 1}`,
        speaker: turn.speaker,
        text: turn.text.trim(),
        arabicTerms: turn.arabicTerms ?? [],
      }));
    }

    if ('timestamps' in payload && Array.isArray(payload.timestamps)) {
      return payload.timestamps.map((segment, index) => ({
        id: segment.id ?? `turn-${index + 1}`,
        speaker: segment.speaker === 'Host A' ? 'host_a' : 'host_b',
        text: segment.textEn.trim(),
        // The Arabic original is spoken by the scholar in the source recording,
        // so it is carried as a UI marker rather than fed to the English voice.
        arabicTerms: segment.textAr ? [segment.textAr] : [],
      }));
    }

    return [];
  }

  private static resolveStoryId(payload: SynthesisPayload): string {
    return 'storyId' in payload && payload.storyId ? payload.storyId : `episode-${randomUUID()}`;
  }

  /* ---------------------------------------------------------- text shaping */

  /** Applies the pronunciation lexicon without touching display text. */
  static applyLexicon(text: string): string {
    return PRONUNCIATION_LEXICON.reduce(
      (current, [pattern, replacement]) => current.replace(pattern, replacement),
      text,
    );
  }

  /**
   * SSML for the providers that support it (Google, Edge). ElevenLabs ignores
   * full SSML, so it receives plain text with inline break tags instead.
   */
  static buildSsml(turn: SynthesisTurn, profile: VoiceProfile): string {
    const spoken = VoiceSynthesisService.applyLexicon(turn.text);
    const sentences = VoiceSynthesisService.splitSentences(spoken);
    const body = sentences
      .map((sentence) => `${escapeXml(sentence)}<break time="${profile.prosody.sentencePauseMs}ms"/>`)
      .join(' ');

    return [
      '<speak>',
      `<prosody rate="${profile.prosody.rate}" pitch="${profile.prosody.pitch}">`,
      body,
      '</prosody>',
      '</speak>',
    ].join('');
  }

  /** ElevenLabs accepts plain text plus `<break>`; everything else is literal. */
  static buildPlainNarration(turn: SynthesisTurn, profile: VoiceProfile): string {
    const spoken = VoiceSynthesisService.applyLexicon(turn.text);
    return VoiceSynthesisService.splitSentences(spoken)
      .map((sentence) => `${sentence} <break time="${profile.prosody.sentencePauseMs}ms" />`)
      .join(' ')
      .trim();
  }

  private static splitSentences(text: string): string[] {
    return text
      .split(/(?<=[.!?،؛])\s+/u)
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence.length > 0);
  }

  /* ------------------------------------------------------------ rendering */

  private async renderTurn(turn: SynthesisTurn, context: TurnContext): Promise<RenderedTurn> {
    const profile = this.profiles[turn.speaker];

    if (!this.apiKey && this.provider !== 'edge-tts') {
      if (!this.allowEstimatedOutput) {
        throw new Error(`${this.provider} credentials are required for production synthesis`);
      }
      return this.renderSilentPlaceholder(turn, profile);
    }

    try {
      switch (this.provider) {
        case 'elevenlabs':
          return await this.renderWithElevenLabs(turn, profile, context);
        case 'google':
          return await this.renderWithGoogle(turn, profile);
        case 'edge-tts':
          return await this.renderWithEdgeTts(turn, profile);
        default:
          return this.renderSilentPlaceholder(turn, profile);
      }
    } catch (error) {
      // A single failed turn must not lose the whole episode: fall back to an
      // estimated-duration placeholder so the timeline still lines up.
      console.warn(`Voice synthesis failed for ${turn.id} (${this.provider}):`, error);
      if (!this.allowEstimatedOutput) throw error;
      return this.renderSilentPlaceholder(turn, profile);
    }
  }

  /**
   * `/with-timestamps` returns character-level alignment alongside the audio,
   * which is what makes the speaker-transition markers exact instead of guessed.
   */
  private async renderWithElevenLabs(
    turn: SynthesisTurn,
    profile: VoiceProfile,
    context: TurnContext,
  ): Promise<RenderedTurn> {
    const outputFormat = this.format === 'mp3' ? `mp3_${this.sampleRate}_128` : 'pcm_44100';

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${profile.elevenLabsVoiceId}/with-timestamps?output_format=${outputFormat}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey as string,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: VoiceSynthesisService.buildPlainNarration(turn, profile),
          model_id: this.modelId,
          voice_settings: {
            stability: profile.settings.stability,
            similarity_boost: profile.settings.clarity,
            style: profile.settings.style,
            use_speaker_boost: profile.settings.useSpeakerBoost,
          },
          // Conditioning on neighbouring text keeps intonation coherent across
          // turn boundaries so the stitched result sounds like one recording.
          previous_text: context.previousText,
          next_text: context.nextText,
          previous_request_ids: context.previousRequestIds ?? [],
          apply_text_normalization: 'on',
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`ElevenLabs ${response.status}: ${await response.text()}`);
    }

    const payload = (await response.json()) as ElevenLabsTimestampResponse;
    const audio = Buffer.from(payload.audio_base64, 'base64');
    const alignment = payload.alignment ?? payload.normalized_alignment;

    const durationMs = alignment
      ? Math.round((alignment.character_end_times_seconds.at(-1) ?? 0) * 1000)
      : estimateDurationMs(turn.text, profile);

    return {
      turnId: turn.id,
      audio,
      durationMs,
      estimated: !alignment,
      requestId: response.headers.get('request-id') ?? undefined,
      words: alignment ? extractWordTimings(turn.id, alignment) : [],
    };
  }

  private async renderWithGoogle(turn: SynthesisTurn, profile: VoiceProfile): Promise<RenderedTurn> {
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { ssml: VoiceSynthesisService.buildSsml(turn, profile) },
          voice: {
            languageCode: profile.googleLanguageCode,
            name: profile.googleVoiceName,
          },
          audioConfig: {
            audioEncoding: 'MP3',
            sampleRateHertz: this.sampleRate,
            speakingRate: parsePercent(profile.prosody.rate),
            pitch: parseSemitones(profile.prosody.pitch),
            effectsProfileId: ['headphone-class-device'],
          },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Google TTS ${response.status}: ${await response.text()}`);
    }

    const payload = (await response.json()) as { audioContent: string };

    return {
      turnId: turn.id,
      audio: Buffer.from(payload.audioContent, 'base64'),
      durationMs: estimateDurationMs(turn.text, profile),
      estimated: true,
      words: [],
    };
  }

  /** Free local fallback: the `edge-tts` CLI, which needs no API key. */
  private async renderWithEdgeTts(turn: SynthesisTurn, profile: VoiceProfile): Promise<RenderedTurn> {
    const scratch = join(tmpdir(), `edge-tts-${randomUUID()}.mp3`);

    await execFileAsync('edge-tts', [
      '--voice',
      profile.edgeVoiceName,
      '--rate',
      toEdgeDelta(parsePercent(profile.prosody.rate)),
      '--pitch',
      `${parseSemitones(profile.prosody.pitch) * 20 >= 0 ? '+' : ''}${Math.round(
        parseSemitones(profile.prosody.pitch) * 20,
      )}Hz`,
      '--text',
      VoiceSynthesisService.applyLexicon(turn.text),
      '--write-media',
      scratch,
    ]);

    const { readFile } = await import('node:fs/promises');
    const audio = await readFile(scratch);
    await rm(scratch, { force: true });

    return {
      turnId: turn.id,
      audio,
      durationMs: estimateDurationMs(turn.text, profile),
      estimated: true,
      words: [],
    };
  }

  /**
   * No credentials or a failed call: emit no audio but keep an estimated
   * duration, so the UI timeline and speaker markers remain usable in dev.
   */
  private renderSilentPlaceholder(turn: SynthesisTurn, profile: VoiceProfile): RenderedTurn {
    return {
      turnId: turn.id,
      audio: Buffer.alloc(0),
      durationMs: estimateDurationMs(turn.text, profile),
      estimated: true,
      words: [],
    };
  }

  /* ------------------------------------------------------------ stitching */

  /**
   * ffmpeg is preferred: it inserts real silence between turns and re-encodes
   * to a single valid container. Raw buffer concatenation is the fallback and
   * only produces a playable file for MP3.
   */
  private async stitch(turns: RenderedTurn[]): Promise<{ audio: Buffer; usedFfmpeg: boolean }> {
    const withAudio = turns.filter((turn) => turn.audio.length > 0);

    if (withAudio.length === 0) {
      return { audio: Buffer.alloc(0), usedFfmpeg: false };
    }

    try {
      return { audio: await this.stitchWithFfmpeg(withAudio), usedFfmpeg: true };
    } catch (error) {
      console.warn('ffmpeg stitching unavailable, concatenating raw MP3 frames:', error);
      if (!this.allowEstimatedOutput) throw error;
      return { audio: Buffer.concat(withAudio.map((turn) => turn.audio)), usedFfmpeg: false };
    }
  }

  private async stitchWithFfmpeg(turns: RenderedTurn[]): Promise<Buffer> {
    const workDir = join(tmpdir(), `audio-stitch-${randomUUID()}`);
    await mkdir(workDir, { recursive: true });

    try {
      const silencePath = join(workDir, 'gap.mp3');
      await execFileAsync(this.ffmpegPath, [
        '-hide_banner',
        '-loglevel',
        'error',
        '-f',
        'lavfi',
        '-i',
        `anullsrc=r=${this.sampleRate}:cl=mono`,
        '-t',
        (this.interTurnGapMs / 1000).toFixed(3),
        '-b:a',
        '128k',
        silencePath,
      ]);

      const entries: string[] = [];
      for (let index = 0; index < turns.length; index += 1) {
        const partPath = join(workDir, `part-${index}.${this.format}`);
        await writeFile(partPath, turns[index]!.audio);
        entries.push(`file '${partPath.replace(/'/g, "'\\''")}'`);
        if (index < turns.length - 1) {
          entries.push(`file '${silencePath.replace(/'/g, "'\\''")}'`);
        }
      }

      const listPath = join(workDir, 'concat.txt');
      await writeFile(listPath, entries.join('\n'), 'utf8');

      const outputPath = join(workDir, `stitched.${this.format}`);
      const codec = this.format === 'm4a' ? ['-c:a', 'aac', '-b:a', '160k'] : ['-c:a', 'libmp3lame', '-b:a', '128k'];

      await execFileAsync(this.ffmpegPath, [
        '-hide_banner',
        '-loglevel',
        'error',
        '-f',
        'concat',
        '-safe',
        '0',
        '-i',
        listPath,
        '-ar',
        String(this.sampleRate),
        ...codec,
        outputPath,
      ]);

      const { readFile } = await import('node:fs/promises');
      return await readFile(outputPath);
    } finally {
      await rm(workDir, { recursive: true, force: true });
    }
  }

  /* ------------------------------------------------------------- timeline */

  /** Walks the rendered turns to produce absolute speaker-transition markers. */
  private buildTimeline(
    turns: SynthesisTurn[],
    rendered: RenderedTurn[],
    gapsIncluded: boolean,
  ): { markers: SpeakerMarker[]; wordTimings: WordTiming[]; totalDurationMs: number } {
    const gap = gapsIncluded ? this.interTurnGapMs : 0;
    const markers: SpeakerMarker[] = [];
    const wordTimings: WordTiming[] = [];
    let cursor = 0;

    turns.forEach((turn, index) => {
      const output = rendered[index];
      if (!output) return;

      const startMs = cursor;
      const endMs = startMs + output.durationMs;

      markers.push({
        turnId: turn.id,
        speaker: turn.speaker,
        displayName: this.profiles[turn.speaker].displayName,
        startMs,
        endMs,
        durationMs: output.durationMs,
        text: turn.text,
        arabicTerms: turn.arabicTerms,
      });

      for (const word of output.words) {
        wordTimings.push({
          turnId: turn.id,
          word: word.word,
          startMs: startMs + word.startMs,
          endMs: startMs + word.endMs,
        });
      }

      cursor = endMs + (index < turns.length - 1 ? gap : 0);
    });

    return { markers, wordTimings, totalDurationMs: cursor };
  }
}

/* -------------------------------------------------------------- internals */

interface TurnContext {
  previousText?: string;
  nextText?: string;
  previousRequestIds?: string[];
}

interface RenderedTurn {
  turnId: string;
  audio: Buffer;
  durationMs: number;
  estimated: boolean;
  requestId?: string;
  words: Array<{ word: string; startMs: number; endMs: number }>;
}

interface ElevenLabsAlignment {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

interface ElevenLabsTimestampResponse {
  audio_base64: string;
  alignment?: ElevenLabsAlignment;
  normalized_alignment?: ElevenLabsAlignment;
}

/** Collapses per-character alignment into per-word timings. */
function extractWordTimings(
  turnId: string,
  alignment: ElevenLabsAlignment,
): Array<{ word: string; startMs: number; endMs: number }> {
  const words: Array<{ word: string; startMs: number; endMs: number }> = [];
  let buffer = '';
  let wordStart = 0;

  alignment.characters.forEach((character, index) => {
    const isBoundary = /\s/.test(character);

    if (!isBoundary) {
      if (buffer.length === 0) {
        wordStart = alignment.character_start_times_seconds[index] ?? 0;
      }
      buffer += character;
      return;
    }

    if (buffer.length > 0) {
      words.push({
        word: buffer,
        startMs: Math.round(wordStart * 1000),
        endMs: Math.round((alignment.character_end_times_seconds[index - 1] ?? wordStart) * 1000),
      });
      buffer = '';
    }
  });

  if (buffer.length > 0) {
    words.push({
      word: buffer,
      startMs: Math.round(wordStart * 1000),
      endMs: Math.round((alignment.character_end_times_seconds.at(-1) ?? wordStart) * 1000),
    });
  }

  void turnId;
  return words;
}

function estimateDurationMs(text: string, profile: VoiceProfile): number {
  const words = text.trim().split(/\s+/u).filter(Boolean).length;
  const sentences = Math.max(1, (text.match(/[.!?]/g) ?? []).length);
  const effectiveWpm = BASE_WORDS_PER_MINUTE * parsePercent(profile.prosody.rate);
  const speechMs = (words / effectiveWpm) * 60_000;
  return Math.round(speechMs + sentences * profile.prosody.sentencePauseMs);
}

function parsePercent(rate: string): number {
  const parsed = Number.parseFloat(rate.replace('%', ''));
  return Number.isFinite(parsed) ? parsed / 100 : 1;
}

function parseSemitones(pitch: string): number {
  const parsed = Number.parseFloat(pitch.replace('st', ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

/** `edge-tts` expects rate as a signed percentage delta, e.g. `-5%`. */
function toEdgeDelta(multiplier: number): string {
  const delta = Math.round((multiplier - 1) * 100);
  return `${delta >= 0 ? '+' : ''}${delta}%`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export default new VoiceSynthesisService();
