import type { BubbleLevel } from '../shared/types';
import { canSpell, normalizeWord, seededRandom, shuffled } from '../shared/wordUtils';

export const BOARD_COLUMNS = 6;
/** Only the lowest REACH_DEPTH bubbles of each column can be tapped; popping lets the rest fall into reach. */
export const REACH_DEPTH = 3;

export type Bubble = { id: string; letter: string };

/** columns[c][0] is the bottom bubble of column c. */
export type Columns = Bubble[][];

export type BubbleEvent =
  | { type: 'pop'; word: string; points: number; relayered: boolean }
  | { type: 'hint'; word: string }
  | { type: 'noHint' }
  | { type: 'shuffle' }
  | { type: 'complete'; score: number };

export type BubbleState = {
  levelId: string;
  words: string[];
  clues: Record<string, string>;
  columns: Columns;
  selection: string[];
  found: string[];
  score: number;
  hintedWords: string[];
  hintBubbleId: string | null;
  lastEvent: BubbleEvent | null;
  eventId: number;
};

export const POINTS_PER_LETTER = 10;
export const NO_HINT_BONUS = 20;

export function scoreWord(word: string, hinted: boolean): number {
  return word.length * POINTS_PER_LETTER + (hinted ? 0 : NO_HINT_BONUS);
}

/**
 * Stacks the words in layers, each word spread over the columns with at most REACH_DEPTH
 * letters per column. Whatever words the player has already popped, the earliest
 * remaining word is then fully in reach, so the board can always be finished.
 */
export function layoutColumns(words: readonly string[], pool: Bubble[], random: () => number): Columns {
  const columns: Columns = Array.from({ length: BOARD_COLUMNS }, () => []);
  const byLetter = new Map<string, Bubble[]>();
  for (const bubble of pool) byLetter.set(bubble.letter, [...(byLetter.get(bubble.letter) ?? []), bubble]);

  for (const word of shuffled(words, random)) {
    const order = shuffled(
      Array.from({ length: BOARD_COLUMNS }, (_, index) => index),
      random,
    );
    const perColumn = new Array<number>(BOARD_COLUMNS).fill(0);
    let cursor = 0;
    for (const letter of shuffled([...word], random)) {
      while (perColumn[order[cursor % BOARD_COLUMNS]] >= REACH_DEPTH) cursor += 1;
      const column = order[cursor % BOARD_COLUMNS];
      const bubble = byLetter.get(letter)?.shift();
      if (!bubble) throw new Error(`Letter pool is missing "${letter}" for ${word}`);
      columns[column].push(bubble);
      perColumn[column] += 1;
      cursor += 1;
    }
  }
  return columns;
}

export function createBubbleState(level: BubbleLevel, seed: number | string = level.levelId): BubbleState {
  const words = level.targetWords.map((target) => normalizeWord(target.word));
  const pool = level.availableLetters.map((letter, index) => ({ id: `${level.levelId}-${index}`, letter }));
  return {
    levelId: level.levelId,
    words,
    clues: Object.fromEntries(level.targetWords.map((target) => [normalizeWord(target.word), target.clue])),
    columns: layoutColumns(words, pool, seededRandom(seed)),
    selection: [],
    found: [],
    score: 0,
    hintedWords: [],
    hintBubbleId: null,
    lastEvent: null,
    eventId: 0,
  };
}

export function findBubble(columns: Columns, id: string): { column: number; depth: number; bubble: Bubble } | null {
  for (let column = 0; column < columns.length; column += 1) {
    const depth = columns[column].findIndex((bubble) => bubble.id === id);
    if (depth >= 0) return { column, depth, bubble: columns[column][depth] };
  }
  return null;
}

export function isReachable(columns: Columns, id: string): boolean {
  const hit = findBubble(columns, id);
  return hit !== null && hit.depth < REACH_DEPTH;
}

export function reachableBubbles(columns: Columns): Bubble[] {
  return columns.flatMap((column) => column.slice(0, REACH_DEPTH));
}

export function stagedWord(state: BubbleState): string {
  return state.selection.map((id) => findBubble(state.columns, id)?.bubble.letter ?? '').join('');
}

export function remainingWords(state: BubbleState): string[] {
  return state.words.filter((word) => !state.found.includes(word));
}

export function isComplete(state: BubbleState): boolean {
  return state.found.length === state.words.length;
}

/** No remaining word can be spelled from the bubbles in reach — the player needs a shuffle. */
export function isStuck(state: BubbleState): boolean {
  if (isComplete(state)) return false;
  const letters = reachableBubbles(state.columns).map((bubble) => bubble.letter);
  return !remainingWords(state).some((word) => canSpell(word, letters));
}

function withEvent(state: BubbleState, event: BubbleEvent): BubbleState {
  return { ...state, lastEvent: event, eventId: state.eventId + 1 };
}

function pop(state: BubbleState, word: string): BubbleState {
  const popped = new Set(state.selection);
  const hinted = state.hintedWords.includes(word);
  const points = scoreWord(word, hinted);
  const next: BubbleState = {
    ...state,
    columns: state.columns.map((column) => column.filter((bubble) => !popped.has(bubble.id))),
    selection: [],
    found: [...state.found, word],
    score: state.score + points,
    hintBubbleId: null,
  };
  if (isComplete(next)) return withEvent(next, { type: 'complete', score: next.score });
  // Spelling a word with another word's bubbles can leave nothing in reach; re-layer
  // the remaining bubbles so the board is never a dead end.
  const settled = isStuck(next)
    ? { ...next, columns: layoutColumns(remainingWords(next), next.columns.flat(), seededRandom(`${next.levelId}:${next.eventId}`)) }
    : next;
  return withEvent(settled, { type: 'pop', word, points, relayered: settled !== next });
}

/**
 * Tapping a reachable bubble adds it to the staging bar; tapping the last staged bubble
 * removes it. A staged word that matches an unfound target pops immediately.
 */
export function tapBubble(state: BubbleState, id: string): BubbleState {
  if (isComplete(state)) return state;
  const last = state.selection[state.selection.length - 1];
  if (last === id) return { ...state, selection: state.selection.slice(0, -1) };
  if (state.selection.includes(id) || !isReachable(state.columns, id)) return state;

  const next = { ...state, selection: [...state.selection, id] };
  const word = stagedWord(next);
  if (remainingWords(next).includes(word)) return pop(next, word);
  return next;
}

export function clearSelection(state: BubbleState): BubbleState {
  return state.selection.length ? { ...state, selection: [] } : state;
}

export function shuffleBoard(state: BubbleState, seed: number | string): BubbleState {
  const pool = state.columns.flat();
  const columns = layoutColumns(remainingWords(state), pool, seededRandom(seed));
  return withEvent({ ...state, columns, selection: [], hintBubbleId: null }, { type: 'shuffle' });
}

/** Picks a remaining word that is spellable right now and highlights a bubble holding its first letter. */
export function hintFor(state: BubbleState): { word: string; bubbleId: string } | null {
  const reachable = reachableBubbles(state.columns);
  const letters = reachable.map((bubble) => bubble.letter);
  const candidates = remainingWords(state).filter((word) => canSpell(word, letters));
  const word = candidates.find((candidate) => !state.hintedWords.includes(candidate)) ?? candidates[0];
  if (!word) return null;
  const bubble = reachable.find((candidate) => candidate.letter === word[0]);
  return bubble ? { word, bubbleId: bubble.id } : null;
}

export function applyHint(state: BubbleState): BubbleState {
  const hint = hintFor(state);
  if (!hint) return withEvent(state, { type: 'noHint' });
  return withEvent(
    {
      ...state,
      selection: [],
      hintBubbleId: hint.bubbleId,
      hintedWords: state.hintedWords.includes(hint.word) ? state.hintedWords : [...state.hintedWords, hint.word],
    },
    { type: 'hint', word: hint.word },
  );
}
