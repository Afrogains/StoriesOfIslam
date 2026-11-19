import type { Direction } from '../shared/types';
import { normalizeWord } from '../shared/wordUtils';

export type GridPlacement = { word: string; x: number; y: number; direction: Direction };

export type GeneratedGrid = {
  width: number;
  height: number;
  placements: GridPlacement[];
  intersections: number;
};

type Cell = { letter: string; across: boolean; down: boolean };

const key = (x: number, y: number) => `${x},${y}`;

function cellsOf(placement: GridPlacement): { x: number; y: number; letter: string }[] {
  return [...placement.word].map((letter, index) => ({
    letter,
    x: placement.direction === 'across' ? placement.x + index : placement.x,
    y: placement.direction === 'down' ? placement.y + index : placement.y,
  }));
}

/**
 * A placement is legal when every crossing letter matches, it never runs alongside
 * another word (no accidental two-letter words), and its ends are not glued to other letters.
 */
function canPlace(board: Map<string, Cell>, placement: GridPlacement): number | null {
  const across = placement.direction === 'across';
  const [dx, dy] = across ? [1, 0] : [0, 1];
  const before = key(placement.x - dx, placement.y - dy);
  const after = key(placement.x + dx * placement.word.length, placement.y + dy * placement.word.length);
  if (board.has(before) || board.has(after)) return null;

  let crossings = 0;
  for (const { x, y, letter } of cellsOf(placement)) {
    const existing = board.get(key(x, y));
    if (existing) {
      if (existing.letter !== letter) return null;
      if (across ? existing.across : existing.down) return null;
      crossings += 1;
      continue;
    }
    const sideA = across ? key(x, y - 1) : key(x - 1, y);
    const sideB = across ? key(x, y + 1) : key(x + 1, y);
    if (board.has(sideA) || board.has(sideB)) return null;
  }
  return crossings;
}

function place(board: Map<string, Cell>, placement: GridPlacement): Map<string, Cell> {
  const next = new Map(board);
  for (const { x, y, letter } of cellsOf(placement)) {
    const existing = next.get(key(x, y));
    next.set(key(x, y), {
      letter,
      across: (existing?.across ?? false) || placement.direction === 'across',
      down: (existing?.down ?? false) || placement.direction === 'down',
    });
  }
  return next;
}

function normalize(placements: GridPlacement[], intersections: number): GeneratedGrid {
  const cells = placements.flatMap(cellsOf);
  const minX = Math.min(...cells.map((cell) => cell.x));
  const minY = Math.min(...cells.map((cell) => cell.y));
  const maxX = Math.max(...cells.map((cell) => cell.x));
  const maxY = Math.max(...cells.map((cell) => cell.y));
  return {
    width: maxX - minX + 1,
    height: maxY - minY + 1,
    intersections,
    placements: placements.map((placement) => ({ ...placement, x: placement.x - minX, y: placement.y - minY })),
  };
}

function score(grid: GeneratedGrid): number {
  const squareness = Math.abs(grid.width - grid.height);
  return grid.intersections * 100 - grid.width * grid.height * 2 - squareness * 3;
}

/**
 * Lays out 4–6 words as a single connected crossword. Every word after the first must
 * cross an already placed word; the search backtracks and keeps the most compact,
 * most interlocked layout. Returns null when no connected layout exists.
 */
export function generateCrosswordGrid(
  rawWords: readonly string[],
  options: { maxResults?: number; maxWidth?: number; maxHeight?: number } = {},
): GeneratedGrid | null {
  const words = rawWords.map(normalizeWord).filter(Boolean);
  if (words.length < 2) throw new Error('Provide at least two words.');
  if (new Set(words).size !== words.length) throw new Error('Words must be unique.');

  const maxResults = options.maxResults ?? 400;
  const maxWidth = options.maxWidth ?? 12;
  const maxHeight = options.maxHeight ?? 12;
  const order = [...words].sort((a, b) => b.length - a.length || a.localeCompare(b));

  let best: GeneratedGrid | null = null;
  let explored = 0;

  const search = (
    board: Map<string, Cell>,
    placements: GridPlacement[],
    remaining: string[],
    intersections: number,
  ) => {
    if (explored >= maxResults) return;
    if (!remaining.length) {
      explored += 1;
      const grid = normalize(placements, intersections);
      if (grid.width > maxWidth || grid.height > maxHeight) return;
      if (!best || score(grid) > score(best)) best = grid;
      return;
    }
    // Try the remaining words in order, but let any of them go next so a word that
    // only fits once a later word is down can still be placed.
    for (const word of remaining) {
      const rest = remaining.filter((other) => other !== word);
      const candidates: { placement: GridPlacement; crossings: number }[] = [];
      for (const anchor of placements) {
        const direction: Direction = anchor.direction === 'across' ? 'down' : 'across';
        cellsOf(anchor).forEach((cell) => {
          [...word].forEach((letter, index) => {
            if (letter !== cell.letter) return;
            const placement: GridPlacement = {
              word,
              direction,
              x: direction === 'across' ? cell.x - index : cell.x,
              y: direction === 'down' ? cell.y - index : cell.y,
            };
            const crossings = canPlace(board, placement);
            if (crossings) candidates.push({ placement, crossings });
          });
        });
      }
      candidates.sort((a, b) => b.crossings - a.crossings);
      for (const { placement, crossings } of candidates) {
        search(place(board, placement), [...placements, placement], rest, intersections + crossings);
        if (explored >= maxResults) return;
      }
    }
  };

  const [first, ...rest] = order;
  const seed: GridPlacement = { word: first, x: 0, y: 0, direction: 'across' };
  search(place(new Map(), seed), [seed], rest, 0);
  return best;
}

/** Renders a grid as text rows ('.' for empty cells) — handy for build logs and tests. */
export function renderGrid(grid: GeneratedGrid): string[] {
  const rows = Array.from({ length: grid.height }, () => Array.from({ length: grid.width }, () => '.'));
  for (const placement of grid.placements) {
    for (const { x, y, letter } of cellsOf(placement)) rows[y][x] = letter;
  }
  return rows.map((row) => row.join(''));
}
