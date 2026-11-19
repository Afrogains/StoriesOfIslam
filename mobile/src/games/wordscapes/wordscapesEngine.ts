import type { PlacedWord, WordscapesLevel } from '../shared/types';
import { canSpell, normalizeWord, seededRandom, shuffled } from '../shared/wordUtils';

export const MIN_WORD_LENGTH = 3;

export type GridCell = { x: number; y: number; letter: string; words: string[] };

export type SubmitResult = 'found' | 'repeat' | 'bonus' | 'bonusRepeat' | 'short' | 'invalid';

export type WordscapesState = {
  levelId: string;
  wheel: string[];
  found: string[];
  /** Cells uncovered by hints, as "x,y". */
  revealed: string[];
  bonusFound: string[];
  lastResult: { result: SubmitResult; word: string } | null;
  eventId: number;
};

export const cellKey = (x: number, y: number) => `${x},${y}`;

export function wordCells(placed: PlacedWord): { x: number; y: number; letter: string }[] {
  return [...normalizeWord(placed.word)].map((letter, index) => ({
    letter,
    x: placed.direction === 'across' ? placed.x + index : placed.x,
    y: placed.direction === 'down' ? placed.y + index : placed.y,
  }));
}

export function buildCells(level: WordscapesLevel): Map<string, GridCell> {
  const cells = new Map<string, GridCell>();
  for (const placed of level.targetWords) {
    const word = normalizeWord(placed.word);
    for (const cell of wordCells(placed)) {
      const existing = cells.get(cellKey(cell.x, cell.y));
      if (existing && existing.letter !== cell.letter) {
        throw new Error(`${level.levelId}: ${word} clashes with ${existing.words.join('/')} at ${cell.x},${cell.y}`);
      }
      cells.set(cellKey(cell.x, cell.y), {
        ...cell,
        words: existing ? [...existing.words, word] : [word],
      });
    }
  }
  return cells;
}

export function createWordscapesState(level: WordscapesLevel, seed: number | string = level.levelId): WordscapesState {
  return {
    levelId: level.levelId,
    wheel: shuffled(level.availableLetters, seededRandom(seed)),
    found: [],
    revealed: [],
    bonusFound: [],
    lastResult: null,
    eventId: 0,
  };
}

export function targetWords(level: WordscapesLevel): string[] {
  return level.targetWords.map((placed) => normalizeWord(placed.word));
}

export function isWordscapesComplete(state: WordscapesState, level: WordscapesLevel): boolean {
  return targetWords(level).every((word) => state.found.includes(word));
}

export function isCellVisible(state: WordscapesState, cell: GridCell): boolean {
  return state.revealed.includes(cellKey(cell.x, cell.y)) || cell.words.some((word) => state.found.includes(word));
}

/** Words whose every cell is visible count as solved, so hints can finish a word for the player. */
function absorbRevealedWords(state: WordscapesState, level: WordscapesLevel, cells: Map<string, GridCell>): string[] {
  const found = [...state.found];
  for (const placed of level.targetWords) {
    const word = normalizeWord(placed.word);
    if (found.includes(word)) continue;
    const complete = wordCells(placed).every((cell) => {
      const gridCell = cells.get(cellKey(cell.x, cell.y));
      return gridCell ? state.revealed.includes(cellKey(cell.x, cell.y)) || gridCell.words.some((other) => found.includes(other)) : false;
    });
    if (complete) found.push(word);
  }
  return found;
}

/**
 * Grid words are solved; other story words spellable from the wheel go to the bonus
 * chest. Anything outside the prophetic lexicon is rejected.
 */
export function submitWord(
  state: WordscapesState,
  level: WordscapesLevel,
  rawWord: string,
  lexicon: ReadonlySet<string>,
): WordscapesState {
  const word = normalizeWord(rawWord);
  const emit = (patch: Partial<WordscapesState>, result: SubmitResult): WordscapesState => ({
    ...state,
    ...patch,
    lastResult: { result, word },
    eventId: state.eventId + 1,
  });

  if (word.length < MIN_WORD_LENGTH) return emit({}, 'short');
  if (targetWords(level).includes(word)) {
    if (state.found.includes(word)) return emit({}, 'repeat');
    const cells = buildCells(level);
    const found = absorbRevealedWords({ ...state, found: [...state.found, word] }, level, cells);
    return emit({ found }, 'found');
  }
  const isBonus = (level.bonusWords.map(normalizeWord).includes(word) || lexicon.has(word)) && canSpell(word, level.availableLetters);
  if (isBonus) {
    if (state.bonusFound.includes(word)) return emit({}, 'bonusRepeat');
    return emit({ bonusFound: [...state.bonusFound, word] }, 'bonus');
  }
  return emit({}, 'invalid');
}

/** Reveals the first hidden letter of the shortest unsolved word. Returns null when nothing is left to reveal. */
export function revealHint(state: WordscapesState, level: WordscapesLevel): WordscapesState | null {
  const cells = buildCells(level);
  const unsolved = level.targetWords
    .filter((placed) => !state.found.includes(normalizeWord(placed.word)))
    .sort((a, b) => a.word.length - b.word.length);
  for (const placed of unsolved) {
    const hidden = wordCells(placed).find((cell) => {
      const gridCell = cells.get(cellKey(cell.x, cell.y));
      return gridCell && !isCellVisible(state, gridCell);
    });
    if (!hidden) continue;
    const revealed = [...state.revealed, cellKey(hidden.x, hidden.y)];
    const next = { ...state, revealed };
    return { ...next, found: absorbRevealedWords(next, level, cells), eventId: state.eventId + 1, lastResult: null };
  }
  return null;
}

export function shuffleWheel(state: WordscapesState, seed: number | string): WordscapesState {
  const random = seededRandom(seed);
  let wheel = shuffled(state.wheel, random);
  for (let attempt = 0; attempt < 4 && wheel.join('') === state.wheel.join(''); attempt += 1) wheel = shuffled(state.wheel, random);
  return { ...state, wheel };
}
