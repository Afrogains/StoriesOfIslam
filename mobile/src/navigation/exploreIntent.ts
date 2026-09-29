import type { SectionSlug } from '../types/catalog';

export type ExploreIntent = {
  section?: SectionSlug | 'all';
  query?: string;
};

/** One-shot intent so Home can open Explore on a category and/or search query. */
let pending: ExploreIntent | null = null;

export function requestExplore(intent: ExploreIntent = {}) {
  pending = intent;
}

/** @deprecated Prefer requestExplore({ section }) */
export function requestExploreSection(section: SectionSlug | 'all') {
  requestExplore({ section });
}

export function takeExploreIntent(): ExploreIntent | null {
  const next = pending;
  pending = null;
  return next;
}

/** @deprecated Prefer takeExploreIntent() */
export function takeExploreSection(): SectionSlug | 'all' | null {
  return takeExploreIntent()?.section ?? null;
}
