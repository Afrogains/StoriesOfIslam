import raw from '../data/levelsData.json';
import type { BubbleLevel, LevelsData, WordscapesChapter, WordscapesLevel } from './types';
import { normalizeWord } from './wordUtils';

export const levelsData = raw as LevelsData;

export const bubbleLevels: BubbleLevel[] = levelsData.wordBubbles.levels;

export const wordscapesChapters: WordscapesChapter[] = [...levelsData.wordscapes.chapters].sort(
  (a, b) => a.chapterNumber - b.chapterNumber,
);

export type WordscapesLevelRef = WordscapesLevel & { chapterId: string };

export const wordscapesLevels: WordscapesLevelRef[] = wordscapesChapters.flatMap((chapter) =>
  chapter.levels.map((level) => ({ ...level, chapterId: chapter.chapterId })),
);

/**
 * Every story-rooted word in either game. A swiped word only counts as a bonus when it
 * is in here, so the bonus chest can never fill up with generic dictionary words.
 */
export const propheticLexicon: ReadonlySet<string> = new Set(
  [
    ...bubbleLevels.flatMap((level) => level.targetWords.map((target) => target.word)),
    ...wordscapesLevels.flatMap((level) => [...level.targetWords.map((target) => target.word), ...level.bonusWords]),
  ].map(normalizeWord),
);
