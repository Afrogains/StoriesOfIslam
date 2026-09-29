import type { SectionSlug } from '../types/catalog';

/** One-shot intent so Home can open Explore on a specific category. */
let pendingSection: SectionSlug | 'all' | null = null;

export function requestExploreSection(section: SectionSlug | 'all') {
  pendingSection = section;
}

export function takeExploreSection(): SectionSlug | 'all' | null {
  const next = pendingSection;
  pendingSection = null;
  return next;
}
