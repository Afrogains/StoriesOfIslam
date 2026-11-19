import { useCallback, useEffect, useMemo, useState } from 'react';
import { propheticLexicon } from '../shared/levels';
import type { WordscapesLevel } from '../shared/types';
import type { useGameFeedback } from '../shared/useGameFeedback';
import type { useHintSystem } from '../shared/useHintSystem';
import {
  buildCells,
  createWordscapesState,
  isWordscapesComplete,
  revealHint,
  shuffleWheel,
  submitWord,
  type WordscapesState,
} from './wordscapesEngine';

export const POINTS_PER_LETTER = 10;
export const BONUS_POINTS = 15;

export function wordscapesScore(state: WordscapesState): number {
  return state.found.reduce((total, word) => total + word.length * POINTS_PER_LETTER, 0) + state.bonusFound.length * BONUS_POINTS;
}

export function useWordscapesGame(
  level: WordscapesLevel,
  deps: {
    hints: ReturnType<typeof useHintSystem>;
    feedback: ReturnType<typeof useGameFeedback>;
    onComplete: (score: number) => void;
    onBonusWord: (word: string) => void;
  },
) {
  const { hints, feedback, onComplete, onBonusWord } = deps;
  const [state, setState] = useState(() => createWordscapesState(level, `${level.levelId}-${Date.now()}`));

  useEffect(() => {
    if (state.levelId !== level.levelId) setState(createWordscapesState(level, `${level.levelId}-${Date.now()}`));
  }, [level, state.levelId]);

  const cells = useMemo(() => buildCells(level), [level]);
  const complete = state.levelId === level.levelId && isWordscapesComplete(state, level);
  const score = wordscapesScore(state);

  useEffect(() => {
    const result = state.lastResult?.result;
    if (result === 'found') feedback.success();
    if (result === 'bonus' && state.lastResult) {
      feedback.bonus();
      onBonusWord(state.lastResult.word);
    }
    if (result === 'invalid' || result === 'short') feedback.error();
    if (result === 'repeat' || result === 'bonusRepeat') feedback.tap();
    // One reaction per engine event.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.eventId]);

  useEffect(() => {
    if (!complete) return;
    feedback.levelComplete();
    onComplete(score);
    // Fires once when the last word lands.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complete]);

  const submit = useCallback((word: string) => setState((current) => submitWord(current, level, word, propheticLexicon)), [level]);

  const shuffle = useCallback(() => {
    feedback.select();
    setState((current) => shuffleWheel(current, `${Date.now()}`));
  }, [feedback]);

  const hint = useCallback(() => {
    const next = revealHint(state, level);
    if (!next) return false;
    if (!hints.spend()) {
      feedback.error();
      return false;
    }
    feedback.select();
    setState(next);
    return true;
  }, [state, level, hints, feedback]);

  const restart = useCallback(() => setState(createWordscapesState(level, `${level.levelId}-${Date.now()}`)), [level]);

  return { state, cells, complete, score, submit, shuffle, hint, restart };
}
