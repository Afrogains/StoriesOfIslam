import { mockStory, type MockStory } from './mockStory';
import type { KidsStoryCard, StoryItem } from './mockHome';

/**
 * The reader expects a fully-cued `MockStory`. Catalog entries only carry
 * metadata, so we borrow the demo cue track until real audio lands.
 */
export function toReaderStory(story: StoryItem): MockStory {
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
    audioUrl: mockStory.audioUrl,
    artworkUrl: mockStory.artworkUrl,
    durationMs: story.durationMs,
    cues: mockStory.cues,
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
