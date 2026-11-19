export type WordGameProgress = {
  completedLevels: string[];
  bestScores: Record<string, number>;
  totalScore: number;
  /** Bonus words collected across all levels (Wordscapes chest). */
  bonusWords: string[];
};

export const EMPTY_PROGRESS: WordGameProgress = { completedLevels: [], bestScores: {}, totalScore: 0, bonusWords: [] };

export type Wallet = { coins: number };

export const ECONOMY = {
  startingCoins: 6,
  hintCost: 2,
  bonusWordReward: 1,
  levelCompleteReward: 2,
} as const;

export function recordLevelComplete(progress: WordGameProgress, levelId: string, score: number): WordGameProgress {
  const previous = progress.bestScores[levelId] ?? 0;
  return {
    ...progress,
    completedLevels: progress.completedLevels.includes(levelId)
      ? progress.completedLevels
      : [...progress.completedLevels, levelId],
    bestScores: { ...progress.bestScores, [levelId]: Math.max(previous, score) },
    totalScore: progress.totalScore + Math.max(0, score - previous),
  };
}

export function addBonusWord(progress: WordGameProgress, word: string): WordGameProgress {
  if (progress.bonusWords.includes(word)) return progress;
  return { ...progress, bonusWords: [...progress.bonusWords, word] };
}

/** Levels unlock in order: the first is always open, each next one opens when the previous is solved. */
export function isLevelUnlocked(levelIds: readonly string[], index: number, progress: WordGameProgress): boolean {
  if (index <= 0) return true;
  return progress.completedLevels.includes(levelIds[index - 1]) || progress.completedLevels.includes(levelIds[index]);
}

export function firstOpenLevelIndex(levelIds: readonly string[], progress: WordGameProgress): number {
  const index = levelIds.findIndex((id) => !progress.completedLevels.includes(id));
  return index < 0 ? levelIds.length - 1 : index;
}
