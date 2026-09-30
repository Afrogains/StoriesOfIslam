import type { StoryItem } from '../types/catalog';
import type { ReaderStory, StoryCue } from '../types/reader';

function isPlaceholderAudio(url?: string | null): boolean {
  if (!url) return true;
  return url.includes('.example') || url.includes('placeholder');
}

function cuesFromFullText(
  contentEn: string,
  contentAr: string,
  durationMs: number,
): StoryCue[] {
  const enParts = contentEn
    .split(/(?<=[.!?۔])\s+|\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const arParts = contentAr
    .split(/(?<=[.!?۔])\s+|\n+/)
    .map((part) => part.trim())
    .filter(Boolean);

  const parts = enParts.length ? enParts : [contentEn];
  const slice = Math.max(Math.floor(durationMs / parts.length), 8_000);

  return parts.map((text, index) => ({
    text,
    textAr: arParts[index] ?? (index === 0 ? contentAr : ''),
    startMs: index * slice,
    endMs: (index + 1) * slice,
  }));
}

export function toReaderStory(story: StoryItem): ReaderStory {
  const playableUrl = isPlaceholderAudio(story.audioUrl) ? '' : (story.audioUrl ?? '');
  const fullEn = (story.content ?? story.summary ?? '').trim();
  const fullAr = (story.contentAr ?? story.titleAr ?? '').trim();

  let cues: StoryCue[];
  const cueText = (story.timedCues ?? []).map((c) => c.textEn).join(' ').trim();
  const cuesCoverFullStory =
    Boolean(story.timedCues?.length) &&
    cueText.length >= Math.min(fullEn.length * 0.85, fullEn.length - 40);

  // Prefer regenerating from full content when cues are only a short excerpt.
  if (fullEn && (!story.timedCues?.length || !cuesCoverFullStory || !playableUrl)) {
    cues = cuesFromFullText(fullEn, fullAr, Math.max(story.durationMs, 30_000));
  } else if (story.timedCues?.length) {
    cues = story.timedCues.map((cue) => ({
      text: cue.textEn,
      textAr: cue.textAr,
      startMs: cue.startMs,
      endMs: cue.endMs,
    }));
  } else {
    cues = [{
      text: story.summary,
      textAr: story.titleAr,
      startMs: 0,
      endMs: Math.max(story.durationMs, 30_000),
    }];
  }

  return {
    id: story.id,
    slug: story.id,
    title: story.title,
    titleAr: story.titleAr,
    figureName: story.figureName,
    figureNameAr: story.figureNameAr ?? story.figureName,
    honorific: story.honorific,
    honorificAr: story.honorificAr ?? 'عليه السلام',
    sourceCitation: story.sourceCitation,
    authenticityGrade: story.authenticityGrade,
    audioUrl: playableUrl,
    artworkUrl: story.artworkUrl ?? '',
    durationMs: story.durationMs,
    cues,
  };
}


/** Match a prophet roster entry to catalog stories for that figure. */
export function storiesForProphetSlug(
  stories: StoryItem[],
  slug: string,
  nameEn: string,
): StoryItem[] {
  const normalized = nameEn.toLowerCase();
  return stories.filter((story) => {
    if (story.sectionSlug !== 'qisas-al-anbiya') return false;
    const figure = story.figureName.toLowerCase();
    return (
      figure === normalized ||
      figure.includes(normalized) ||
      story.id.includes(slug) ||
      story.title.toLowerCase().includes(normalized)
    );
  });
}

/** Match a Sahabah roster entry to catalog stories for that companion. */
export function storiesForSahabahSlug(
  stories: StoryItem[],
  slug: string,
  nameEn: string,
): StoryItem[] {
  const normalized = nameEn.toLowerCase();
  return stories.filter((story) => {
    if (story.sectionSlug !== 'sahabah') return false;
    const figure = story.figureName.toLowerCase();
    return (
      figure === normalized ||
      figure.includes(normalized) ||
      story.id.includes(slug) ||
      story.title.toLowerCase().includes(normalized)
    );
  });
}
