/**
 * Build-time crossword layout for Prophetic Wordscapes.
 *
 *   npx tsx scripts/generate-crossword-grid.ts ARK FLOOD JUDI OVEN
 *   npx tsx scripts/generate-crossword-grid.ts --level ws-nuh-1 --write
 *
 * With --level the words come from that level in levelsData.json; --write stores the
 * computed grid size, (x, y) coordinates and wheel letters back into the file.
 * --all --write lays out every Wordscapes level and refreshes Word Bubbles letter pools.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { generateCrosswordGrid, renderGrid } from '../mobile/src/games/wordscapes/gridGenerator';
import { letterUnion, minimalLetterCover, normalizeWord } from '../mobile/src/games/shared/wordUtils';
import type { LevelsData, WordscapesLevel } from '../mobile/src/games/shared/types';

const DATA_PATH = resolve(__dirname, '../mobile/src/games/data/levelsData.json');

function fail(message: string): never {
  console.error(`error: ${message}`);
  process.exit(1);
}

const args = process.argv.slice(2);
const write = args.includes('--write');
const all = args.includes('--all');
const levelFlag = args.indexOf('--level');
const levelId = levelFlag >= 0 ? args[levelFlag + 1] : undefined;
const freeWords = args.filter((arg, index) => !arg.startsWith('--') && (levelFlag < 0 || index !== levelFlag + 1));

function layout(words: string[]) {
  if (words.length < 4 || words.length > 6) fail(`expected 4–6 words, got ${words.length}`);
  const grid = generateCrosswordGrid(words);
  if (!grid) fail(`no connected crossword exists for: ${words.join(', ')}`);
  return grid;
}

function report(label: string, words: string[]) {
  const grid = layout(words);
  console.log(`\n${label}  ${grid.width}×${grid.height}, ${grid.intersections} intersections`);
  console.log(`wheel: ${minimalLetterCover(words).join(' ')}`);
  for (const row of renderGrid(grid)) console.log(`  ${row}`);
  for (const p of grid.placements) console.log(`  ${p.word.padEnd(10)} (${p.x}, ${p.y}) ${p.direction}`);
  return grid;
}

function applyToLevel(level: WordscapesLevel) {
  const words = level.targetWords.map((target) => normalizeWord(target.word));
  const grid = report(level.levelId, words);
  const clues = new Map(level.targetWords.map((target) => [normalizeWord(target.word), target.clue]));
  level.grid = { width: grid.width, height: grid.height };
  level.availableLetters = minimalLetterCover(words);
  level.targetWords = grid.placements.map((placement) => ({
    word: placement.word,
    clue: clues.get(placement.word) ?? '',
    x: placement.x,
    y: placement.y,
    direction: placement.direction,
  }));
}

if (levelId || all) {
  const data = JSON.parse(readFileSync(DATA_PATH, 'utf8')) as LevelsData;
  const levels = data.wordscapes.chapters.flatMap((chapter) => chapter.levels);
  const targets = all ? levels : levels.filter((level) => level.levelId === levelId);
  if (!targets.length) fail(`unknown Wordscapes level "${levelId}"`);
  targets.forEach(applyToLevel);
  if (all) {
    for (const level of data.wordBubbles.levels) {
      level.availableLetters = letterUnion(level.targetWords.map((target) => target.word));
    }
  }
  if (write) {
    writeFileSync(DATA_PATH, `${JSON.stringify(data, null, 2)}\n`);
    console.log(`\nwrote ${targets.length} level(s) to ${DATA_PATH}`);
  }
} else {
  if (!freeWords.length) fail('pass 4–6 words, or --level <levelId> / --all');
  report('grid', freeWords.map(normalizeWord));
}
