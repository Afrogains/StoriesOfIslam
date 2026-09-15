import { mockStory, type MockStory } from './mockStory';
import type { KidsStoryCard, StoryItem } from './mockHome';

export function toReaderStory(story: StoryItem): MockStory {
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

export function kidsStoryToReaderStory(story: KidsStoryCard): MockStory {
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
    audioUrl: mockStory.audioUrl,
    artworkUrl: mockStory.artworkUrl,
    durationMs: mockStory.durationMs,
    cues: mockStory.cues,
  };
}
