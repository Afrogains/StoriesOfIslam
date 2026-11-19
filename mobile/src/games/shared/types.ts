export type GameId = 'wordBubbles' | 'wordscapes';

export type Direction = 'across' | 'down';

export type TargetWord = {
  word: string;
  clue: string;
};

export type PlacedWord = TargetWord & {
  x: number;
  y: number;
  direction: Direction;
};

export type BubbleLevel = {
  levelId: string;
  prophetTheme: string;
  storyClue: string;
  /** Every bubble on the board; the multiset of all target-word letters, so the board clears when the level is solved. */
  availableLetters: string[];
  targetWords: TargetWord[];
  postLevelTakeaway: string;
  source: string;
};

export type WordscapesLevel = {
  levelId: string;
  prophetTheme: string;
  storyClue: string;
  /** Letters on the wheel: the smallest multiset that can spell every target word. */
  availableLetters: string[];
  grid: { width: number; height: number };
  targetWords: PlacedWord[];
  /** Story-rooted words spellable from the wheel that are not on the grid. */
  bonusWords: string[];
  postLevelTakeaway: string;
  source: string;
};

export type WordscapesChapter = {
  chapterId: string;
  chapterNumber: number;
  prophet: string;
  title: string;
  summary: string;
  levels: WordscapesLevel[];
};

export type LevelsData = {
  schemaVersion: number;
  wordBubbles: { levels: BubbleLevel[] };
  wordscapes: { chapters: WordscapesChapter[] };
};
