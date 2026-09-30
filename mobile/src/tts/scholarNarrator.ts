import type { SectionSlug } from '../types/catalog';

/**
 * Calm educational narrator presets for free client TTS.
 * Tuned for reflective Islamic teaching delivery (Omar Suleiman–like pacing),
 * without cloning any commercial voice.
 */
export type ScholarNarratorPreset = {
  id: 'scholar' | 'standard';
  /** Multiplier applied on top of the user’s playback-rate control. */
  rateScale: number;
  pitch: number;
  lang: string;
};

export const SCHOLAR_NARRATOR: ScholarNarratorPreset = {
  id: 'scholar',
  rateScale: 0.93,
  pitch: 0.95,
  lang: 'en-US',
};

export const STANDARD_NARRATOR: ScholarNarratorPreset = {
  id: 'standard',
  rateScale: 1,
  pitch: 1,
  lang: 'en-US',
};

/** Prefer the calm scholar preset for Prophets and Sahabah PDF listens. */
export function narratorPresetForSection(sectionSlug?: SectionSlug): ScholarNarratorPreset {
  if (sectionSlug === 'sahabah' || sectionSlug === 'qisas-al-anbiya') {
    return SCHOLAR_NARRATOR;
  }
  return STANDARD_NARRATOR;
}

export function effectiveSpeechRate(
  userRate: number,
  preset: ScholarNarratorPreset = SCHOLAR_NARRATOR,
): number {
  return Math.max(0.7, Math.min(userRate * preset.rateScale, 1.6));
}
