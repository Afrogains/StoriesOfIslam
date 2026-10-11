import { useEffect, useState } from 'react';
import { THE_NAMES_SERIES } from '../data/theNames';
import type { NameAudioEpisode } from '../data/theNamesAudio';
import { apiRequest } from './api';

/** Reviewer-approved lesson notes/audio served by GET /v1/names/media. */
export interface ApprovedNameMedia {
  nameNumber: number;
  description: string;
  audioUrl: string | null;
  podcastAudioUrl: string | null;
  durationSeconds: number | null;
  videoId: string;
  videoTitle: string;
  watchUrl: string;
  embedUrl: string;
  classNumber: number | null;
  approvedAt: string;
}

export type NamesMediaStatus = 'loading' | 'ready' | 'unavailable';

type State = { status: NamesMediaStatus; byNumber: Record<number, ApprovedNameMedia> };

let cache: State | null = null;
let inflight: Promise<State> | null = null;

function load(): Promise<State> {
  if (cache?.status === 'ready') return Promise.resolve(cache);
  inflight ??= apiRequest<{ data: ApprovedNameMedia[] }>('/v1/names/media')
    .then((payload): State => {
      const byNumber: Record<number, ApprovedNameMedia> = {};
      for (const item of payload.data ?? []) {
        if (item.description?.trim()) byNumber[item.nameNumber] = item;
      }
      cache = { status: 'ready', byNumber };
      return cache;
    })
    // Offline or API not deployed: the screen keeps its bundled content.
    .catch((): State => ({ status: 'unavailable', byNumber: {} }))
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function useApprovedNamesMedia(): State {
  const [state, setState] = useState<State>(cache ?? { status: 'loading', byNumber: {} });
  useEffect(() => {
    let alive = true;
    void load().then((next) => {
      if (alive) setState(next);
    });
    return () => {
      alive = false;
    };
  }, []);
  return state;
}

function durationLabel(seconds: number | null): string {
  if (!seconds) return '';
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

/** Prefer reviewed audio; fall back to the bundled Muslim Central episode. */
export function episodeForName(
  approved: ApprovedNameMedia | undefined,
  bundled: NameAudioEpisode | null,
): NameAudioEpisode | null {
  const audioUrl = approved?.audioUrl ?? approved?.podcastAudioUrl;
  if (!approved || !audioUrl) return bundled;
  return {
    nameNumber: approved.nameNumber,
    episodeNumber: approved.classNumber,
    episodeTitle: approved.videoTitle.split('|')[0]?.trim() || approved.videoTitle,
    audioUrl,
    durationLabel: durationLabel(approved.durationSeconds),
    source: `Reviewed · ${THE_NAMES_SERIES.credit}`,
  };
}
