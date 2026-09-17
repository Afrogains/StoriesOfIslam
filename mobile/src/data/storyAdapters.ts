import type { KidsStoryCard, StoryItem } from '../types/catalog';
import type { ReaderStory } from '../types/reader';

export function toReaderStory(story: StoryItem): ReaderStory {
  const cues = story.timedCues?.length
    ? story.timedCues.map((cue) => ({
        text: cue.textEn,
        textAr: cue.textAr,
        startMs: cue.startMs,
        endMs: cue.endMs,
      }))
    : [{
        text: story.content ?? story.summary,
        textAr: story.contentAr ?? story.titleAr,
        startMs: 0,
        endMs: Math.max(story.durationMs, 30_000),
      }];
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
    audioUrl: story.audioUrl ?? '',
    artworkUrl: story.artworkUrl ?? '',
    durationMs: story.durationMs,
    cues,
  };
}

export function kidsStoryToReaderStory(story: KidsStoryCard): ReaderStory {
  const durationMs = story.durationMs ?? 30_000;
  const cues = story.timedCues?.length
    ? story.timedCues.map((cue) => ({
        text: cue.textEn,
        textAr: cue.textAr,
        startMs: cue.startMs,
        endMs: cue.endMs,
      }))
    : [{
        text: story.summary,
        textAr: story.titleAr,
        startMs: 0,
        endMs: durationMs,
      }];
  return {
    id: story.id,
    slug: story.id,
    title: story.title,
    titleAr: story.titleAr,
    figureName: story.figureName,
    figureNameAr: story.titleAr,
    honorific: 'a loving story for children',
    honorificAr: 'قصة للأطفال',
    sourceCitation: 'Authentic Islamic Children’s Story Collection',
    authenticityGrade: 'sahih',
    audioUrl: story.audioUrl ?? '',
    artworkUrl: story.artworkUrl ?? '',
    durationMs,
    cues,
  };
}
