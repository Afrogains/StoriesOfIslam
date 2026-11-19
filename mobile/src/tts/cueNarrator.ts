import type { StoryCue } from '../types/reader';
import { cancelAllSpeech, isClientTtsAvailable, speakText } from './webSpeechEngine';

export type CueNarratorListener = {
  onCueIndex?: (index: number) => void;
  onPositionMs?: (ms: number) => void;
  onPlayingChange?: (playing: boolean) => void;
  onEnded?: () => void;
  onError?: (message: string) => void;
};

/**
 * Sequentially narrates story cues via client TTS when no MP3 track exists.
 * Position is driven by cue boundaries so the synchronized reader stays aligned.
 */
export class CueNarrator {
  private cues: StoryCue[] = [];
  private index = 0;
  private rate = 1;
  private pitch = 1;
  private lang = 'en-US';
  private playing = false;
  private cancelled = false;
  private activeCancel: (() => void) | null = null;
  private listeners: CueNarratorListener = {};

  setCues(cues: StoryCue[]): void {
    this.stop();
    this.cues = cues;
    this.index = 0;
  }

  setListeners(listeners: CueNarratorListener): void {
    this.listeners = listeners;
  }

  setRate(rate: number): void {
    this.rate = rate;
  }

  setVoice(options: { pitch?: number; lang?: string }): void {
    if (options.pitch != null) this.pitch = options.pitch;
    if (options.lang) this.lang = options.lang;
  }

  get isAvailable(): boolean {
    return isClientTtsAvailable() && this.cues.length > 0;
  }

  get currentIndex(): number {
    return this.index;
  }

  async playFrom(ms = 0): Promise<void> {
    if (!this.isAvailable) {
      this.listeners.onError?.(
        'Spoken narration needs a browser with text-to-speech support.',
      );
      return;
    }
    const startIndex = Math.max(
      0,
      this.cues.findIndex((cue) => ms < cue.endMs),
    );
    this.index = startIndex === -1 ? 0 : startIndex;
    this.cancelled = false;
    this.playing = true;
    this.listeners.onPlayingChange?.(true);
    await this.runLoop();
  }

  pause(): void {
    this.cancelled = true;
    this.playing = false;
    this.activeCancel?.();
    this.activeCancel = null;
    cancelAllSpeech();
    this.listeners.onPlayingChange?.(false);
  }

  stop(): void {
    this.pause();
    this.index = 0;
  }

  async seekTo(ms: number): Promise<void> {
    const wasPlaying = this.playing;
    this.pause();
    const next = this.cues.findIndex((cue) => ms < cue.endMs);
    this.index = next === -1 ? Math.max(0, this.cues.length - 1) : next;
    const cue = this.cues[this.index];
    this.listeners.onCueIndex?.(this.index);
    this.listeners.onPositionMs?.(cue?.startMs ?? 0);
    if (wasPlaying) {
      await this.playFrom(cue?.startMs ?? 0);
    }
  }

  private async runLoop(): Promise<void> {
    while (this.playing && !this.cancelled && this.index < this.cues.length) {
      const cue = this.cues[this.index]!;
      this.listeners.onCueIndex?.(this.index);
      this.listeners.onPositionMs?.(cue.startMs);

      const { handle, done } = speakText(cue.text, {
        rate: this.rate,
        pitch: this.pitch,
        lang: this.lang,
      });
      this.activeCancel = handle.cancel;
      const result = await done;
      this.activeCancel = null;

      if (this.cancelled || result === 'cancelled') break;
      if (result === 'unavailable') {
        this.playing = false;
        this.listeners.onPlayingChange?.(false);
        this.listeners.onError?.(
          'Spoken narration is unavailable in this browser. You can still read the full story.',
        );
        return;
      }

      this.listeners.onPositionMs?.(cue.endMs);
      this.index += 1;
    }

    if (!this.cancelled && this.index >= this.cues.length) {
      this.playing = false;
      this.listeners.onPlayingChange?.(false);
      this.listeners.onEnded?.();
      this.index = 0;
      this.listeners.onCueIndex?.(0);
      this.listeners.onPositionMs?.(0);
      return;
    }

    this.playing = false;
    this.listeners.onPlayingChange?.(false);
  }
}
