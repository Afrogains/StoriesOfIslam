import type { AuthenticityGrade } from './catalog';

export type StoryCue = {
  text: string;
  textAr: string;
  startMs: number;
  endMs: number;
};

export type ReaderStory = {
  id: string;
  slug: string;
  title: string;
  titleAr: string;
  figureName: string;
  figureNameAr: string;
  honorific: string;
  honorificAr: string;
  sourceCitation: string;
  authenticityGrade: AuthenticityGrade;
  audioUrl: string;
  artworkUrl: string;
  durationMs: number;
  cues: StoryCue[];
};

export function cueIndexAt(positionMs: number, cues: StoryCue[]): number {
  const hit = cues.findIndex(
    (cue) => positionMs >= cue.startMs && positionMs < cue.endMs,
  );
  if (hit >= 0) return hit;
  if (positionMs >= (cues[cues.length - 1]?.endMs ?? 0)) {
    return Math.max(0, cues.length - 1);
  }
  return 0;
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
