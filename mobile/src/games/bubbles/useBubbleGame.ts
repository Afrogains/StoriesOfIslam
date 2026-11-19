import { useCallback, useEffect, useMemo, useReducer } from 'react';
import type { BubbleLevel } from '../shared/types';
import type { useGameFeedback } from '../shared/useGameFeedback';
import type { useHintSystem } from '../shared/useHintSystem';
import {
  applyHint,
  clearSelection,
  createBubbleState,
  hintFor,
  isComplete,
  isStuck,
  reachableBubbles,
  remainingWords,
  shuffleBoard,
  stagedWord,
  tapBubble,
  type BubbleState,
} from './bubbleEngine';

type Action =
  | { type: 'reset'; level: BubbleLevel; seed: string }
  | { type: 'tap'; id: string }
  | { type: 'clear' }
  | { type: 'shuffle'; seed: string }
  | { type: 'hint' };

function reducer(state: BubbleState, action: Action): BubbleState {
  switch (action.type) {
    case 'reset':
      return createBubbleState(action.level, action.seed);
    case 'tap':
      return tapBubble(state, action.id);
    case 'clear':
      return clearSelection(state);
    case 'shuffle':
      return shuffleBoard(state, action.seed);
    case 'hint':
      return applyHint(state);
  }
}

export function useBubbleGame(
  level: BubbleLevel,
  deps: {
    hints: ReturnType<typeof useHintSystem>;
    feedback: ReturnType<typeof useGameFeedback>;
    onComplete: (score: number) => void;
  },
) {
  const { hints, feedback, onComplete } = deps;
  const [state, dispatch] = useReducer(reducer, level, (initial) => createBubbleState(initial, `${initial.levelId}-${Date.now()}`));

  useEffect(() => {
    if (state.levelId !== level.levelId) dispatch({ type: 'reset', level, seed: `${level.levelId}-${Date.now()}` });
  }, [level, state.levelId]);

  useEffect(() => {
    const event = state.lastEvent;
    if (!event) return;
    if (event.type === 'pop') feedback.success();
    if (event.type === 'noHint') feedback.error();
    if (event.type === 'complete') {
      feedback.levelComplete();
      onComplete(event.score);
    }
    // Reacts once per engine event; eventId is the change signal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.eventId]);

  const tap = useCallback(
    (id: string) => {
      feedback.tap();
      dispatch({ type: 'tap', id });
    },
    [feedback],
  );

  const clear = useCallback(() => dispatch({ type: 'clear' }), []);
  const shuffle = useCallback(() => {
    feedback.select();
    dispatch({ type: 'shuffle', seed: `${Date.now()}` });
  }, [feedback]);

  const hint = useCallback(() => {
    if (!hintFor(state)) {
      dispatch({ type: 'hint' });
      return false;
    }
    if (!hints.spend()) {
      feedback.error();
      return false;
    }
    dispatch({ type: 'hint' });
    return true;
  }, [state, hints, feedback]);

  const restart = useCallback(() => dispatch({ type: 'reset', level, seed: `${level.levelId}-${Date.now()}` }), [level]);

  const derived = useMemo(
    () => ({
      staged: stagedWord(state),
      reachable: new Set(reachableBubbles(state.columns).map((bubble) => bubble.id)),
      remaining: remainingWords(state),
      complete: isComplete(state),
      stuck: isStuck(state),
      hintWord: state.lastEvent?.type === 'hint' && state.hintBubbleId ? state.lastEvent.word : null,
    }),
    [state],
  );

  return { state, ...derived, tap, clear, shuffle, hint, restart };
}
