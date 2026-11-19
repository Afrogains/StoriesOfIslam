import { describe, expect, it } from 'vitest';
import {
  BOARD_COLUMNS,
  REACH_DEPTH,
  applyHint,
  createBubbleState,
  findBubble,
  isComplete,
  isStuck,
  reachableBubbles,
  remainingWords,
  shuffleBoard,
  stagedWord,
  tapBubble,
  type BubbleState,
} from '../../mobile/src/games/bubbles/bubbleEngine';
import { bubbleLevels, propheticLexicon, wordscapesChapters, wordscapesLevels } from '../../mobile/src/games/shared/levels';
import {
  EMPTY_PROGRESS,
  addBonusWord,
  firstOpenLevelIndex,
  isLevelUnlocked,
  recordLevelComplete,
} from '../../mobile/src/games/shared/progress';
import { canSpell, letterUnion, minimalLetterCover, normalizeWord, seededRandom } from '../../mobile/src/games/shared/wordUtils';
import { generateCrosswordGrid, renderGrid } from '../../mobile/src/games/wordscapes/gridGenerator';
import { extendPath, hitNode, wheelNodes } from '../../mobile/src/games/wordscapes/wheelGeometry';
import {
  buildCells,
  cellKey,
  createWordscapesState,
  isWordscapesComplete,
  revealHint,
  submitWord,
  targetWords,
  wordCells,
} from '../../mobile/src/games/wordscapes/wordscapesEngine';

/** Taps reachable bubbles to spell `word`, or returns null when its letters are not all in reach. */
function spell(state: BubbleState, word: string): BubbleState | null {
  let next = state;
  for (const letter of word) {
    const bubble = reachableBubbles(next.columns).find(
      (candidate) => candidate.letter === letter && !next.selection.includes(candidate.id),
    );
    if (!bubble) return null;
    next = tapBubble(next, bubble.id);
  }
  return next;
}

describe('levelsData.json', () => {
  it('has at least five levels per game with the shared schema fields', () => {
    expect(bubbleLevels.length).toBeGreaterThanOrEqual(5);
    expect(wordscapesLevels.length).toBeGreaterThanOrEqual(5);
    for (const level of [...bubbleLevels, ...wordscapesLevels]) {
      expect(level.levelId).toBeTruthy();
      expect(level.prophetTheme).toMatch(/^Prophet /);
      expect(level.storyClue.length).toBeGreaterThan(20);
      expect(level.postLevelTakeaway.length).toBeGreaterThan(20);
      expect(level.source).toBeTruthy();
      expect(level.availableLetters.length).toBeGreaterThan(0);
      expect(level.targetWords.length).toBeGreaterThanOrEqual(4);
      for (const target of level.targetWords) {
        expect(target.word).toBe(normalizeWord(target.word));
        expect(target.clue.length).toBeGreaterThan(5);
      }
    }
    const ids = [...bubbleLevels, ...wordscapesLevels].map((level) => level.levelId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every Word Bubbles board exactly the letters of its target words, prefix-free', () => {
    for (const level of bubbleLevels) {
      const words = level.targetWords.map((target) => target.word);
      expect([...level.availableLetters].sort()).toEqual(letterUnion(words));
      for (const word of words) {
        expect(words.filter((other) => other !== word && other.startsWith(word))).toEqual([]);
      }
    }
  });

  it('stores Wordscapes coordinates that form one valid connected crossword', () => {
    for (const level of wordscapesLevels) {
      const cells = buildCells(level);
      for (const placed of level.targetWords) {
        for (const cell of wordCells(placed)) {
          expect(cell.x).toBeGreaterThanOrEqual(0);
          expect(cell.y).toBeGreaterThanOrEqual(0);
          expect(cell.x).toBeLessThan(level.grid.width);
          expect(cell.y).toBeLessThan(level.grid.height);
        }
        const crossings = wordCells(placed).filter((cell) => (cells.get(cellKey(cell.x, cell.y))?.words.length ?? 0) > 1);
        expect(crossings.length, `${level.levelId}:${placed.word} must cross another word`).toBeGreaterThan(0);
      }
      // Every horizontal or vertical run of letters must be one of the target words.
      const grid = Array.from({ length: level.grid.height }, (_, y) =>
        Array.from({ length: level.grid.width }, (_, x) => cells.get(cellKey(x, y))?.letter ?? '.').join(''),
      );
      const columns = Array.from({ length: level.grid.width }, (_, x) => grid.map((row) => row[x]).join(''));
      const runs = [...grid, ...columns].flatMap((line) => line.split('.').filter((run) => run.length > 1));
      expect(runs.sort()).toEqual(targetWords(level).sort());
    }
  });

  it('puts the smallest covering letter set on each wheel and only story words in bonus lists', () => {
    for (const level of wordscapesLevels) {
      expect(level.availableLetters).toEqual(minimalLetterCover(targetWords(level)));
      expect(level.availableLetters.length).toBeLessThanOrEqual(8);
      for (const word of level.bonusWords) {
        expect(canSpell(word, level.availableLetters)).toBe(true);
        expect(targetWords(level)).not.toContain(word);
        expect(propheticLexicon.has(word)).toBe(true);
      }
    }
  });

  it('groups Wordscapes levels into numbered prophet chapters with summaries', () => {
    expect(wordscapesChapters.map((chapter) => chapter.chapterNumber)).toEqual(
      wordscapesChapters.map((_, index) => index + 1),
    );
    for (const chapter of wordscapesChapters) {
      expect(chapter.prophet).toMatch(/^Prophet /);
      expect(chapter.summary.length).toBeGreaterThan(40);
      expect(chapter.levels.length).toBeGreaterThan(0);
    }
  });
});

describe('generateCrosswordGrid', () => {
  it('lays out 4–6 prophetic words with real intersections', () => {
    const grid = generateCrosswordGrid(['ARK', 'RAIN', 'NAILS', 'SAIL']);
    expect(grid).not.toBeNull();
    expect(grid!.placements).toHaveLength(4);
    expect(grid!.intersections).toBeGreaterThanOrEqual(3);
    const rows = renderGrid(grid!);
    expect(rows).toHaveLength(grid!.height);
    expect(rows.every((row) => row.length === grid!.width)).toBe(true);
  });

  it('returns null when the words share no letters', () => {
    expect(generateCrosswordGrid(['JUDI', 'ARK', 'COW', 'SEW'])).toBeNull();
  });

  it('rejects duplicate words', () => {
    expect(() => generateCrosswordGrid(['ARK', 'ark', 'RAIN', 'SAIL'])).toThrow(/unique/);
  });
});

describe('Word Bubbles engine', () => {
  it('only lets the bottom REACH_DEPTH bubbles of each column be tapped', () => {
    const state = createBubbleState(bubbleLevels[0], 'reach');
    expect(state.columns).toHaveLength(BOARD_COLUMNS);
    const deep = state.columns.find((column) => column.length > REACH_DEPTH)?.[REACH_DEPTH];
    if (deep) expect(tapBubble(state, deep.id)).toBe(state);
  });

  it('stages taps, backtracks on the last bubble and clears', () => {
    const state = createBubbleState(bubbleLevels[1], 'stage');
    const [first, second] = reachableBubbles(state.columns);
    let next = tapBubble(tapBubble(state, first.id), second.id);
    expect(next.selection).toEqual([first.id, second.id]);
    next = tapBubble(next, second.id);
    expect(next.selection).toEqual([first.id]);
    expect(tapBubble(next, first.id).selection).toEqual([]);
  });

  it('pops a found word, scores it and drops the bubbles above', () => {
    const state = createBubbleState(bubbleLevels[1], 'pop');
    const word = remainingWords(state).find((candidate) => spell(state, candidate));
    expect(word).toBeTruthy();
    const before = state.columns.flat().length;
    const after = spell(state, word!)!;
    expect(after.found).toEqual([word]);
    expect(after.score).toBeGreaterThan(0);
    expect(after.selection).toEqual([]);
    expect(after.columns.flat().length).toBe(before - word!.length);
    expect(stagedWord(after)).toBe('');
  });

  it('never dead-ends, even when words are spelled with any matching bubble', () => {
    for (const level of bubbleLevels) {
      for (let seed = 0; seed < 25; seed += 1) {
        let state = createBubbleState(level, seed);
        let guard = 0;
        while (!isComplete(state) && guard < 20) {
          const word = remainingWords(state).find((candidate) => spell(state, candidate));
          expect(word, `${level.levelId} seed ${seed} stuck`).toBeTruthy();
          state = spell(state, word!)!;
          expect(isStuck(state)).toBe(false);
          guard += 1;
        }
        expect(isComplete(state)).toBe(true);
        expect(state.columns.flat()).toHaveLength(0);
        expect(state.lastEvent?.type).toBe('complete');
      }
    }
  });

  it('recovers from any dead end with a shuffle', () => {
    const random = seededRandom('chaos');
    for (const level of bubbleLevels) {
      let state = createBubbleState(level, 'chaos');
      let guard = 0;
      while (!isComplete(state) && guard < 60) {
        guard += 1;
        if (isStuck(state)) {
          state = shuffleBoard(state, guard);
          continue;
        }
        const spellable = remainingWords(state).filter((candidate) => spell(state, candidate));
        state = spell(state, spellable[Math.floor(random() * spellable.length)])!;
      }
      expect(isComplete(state)).toBe(true);
    }
  });

  it('hints at a reachable bubble holding the first letter of an unfound word', () => {
    const state = applyHint(createBubbleState(bubbleLevels[2], 'hint'));
    expect(state.lastEvent?.type).toBe('hint');
    const word = state.lastEvent?.type === 'hint' ? state.lastEvent.word : '';
    const hit = findBubble(state.columns, state.hintBubbleId!);
    expect(hit?.bubble.letter).toBe(word[0]);
    expect(hit!.depth).toBeLessThan(REACH_DEPTH);
    const solved = spell(state, word)!;
    expect(solved.score).toBe(word.length * 10);
  });
});

describe('Wordscapes engine', () => {
  const level = wordscapesLevels[0];

  it('reveals grid words, rejects non-story words and repeats', () => {
    let state = createWordscapesState(level, 'ws');
    const [first] = targetWords(level);
    state = submitWord(state, level, first.toLowerCase(), propheticLexicon);
    expect(state.found).toEqual([first]);
    expect(state.lastResult?.result).toBe('found');
    expect(submitWord(state, level, first, propheticLexicon).lastResult?.result).toBe('repeat');
    expect(submitWord(state, level, 'LIARS', propheticLexicon).lastResult?.result).toBe('invalid');
    expect(submitWord(state, level, 'AR', propheticLexicon).lastResult?.result).toBe('short');
  });

  it('sends spellable story words that are not on the grid to the bonus chest', () => {
    const [bonus] = level.bonusWords;
    let state = submitWord(createWordscapesState(level), level, bonus, propheticLexicon);
    expect(state.lastResult?.result).toBe('bonus');
    expect(state.bonusFound).toEqual([bonus]);
    state = submitWord(state, level, bonus, propheticLexicon);
    expect(state.lastResult?.result).toBe('bonusRepeat');
    const unspellable = [...propheticLexicon].find((word) => !canSpell(word, level.availableLetters))!;
    expect(submitWord(state, level, unspellable, propheticLexicon).lastResult?.result).toBe('invalid');
  });

  it('completes every level by solving all its words', () => {
    for (const candidate of wordscapesLevels) {
      let state = createWordscapesState(candidate);
      for (const word of targetWords(candidate)) state = submitWord(state, candidate, word, propheticLexicon);
      expect(isWordscapesComplete(state, candidate)).toBe(true);
    }
  });

  it('reveals one letter per hint and counts a fully revealed word as solved', () => {
    let state = createWordscapesState(level);
    const shortest = [...level.targetWords].sort((a, b) => a.word.length - b.word.length)[0];
    for (let index = 0; index < shortest.word.length; index += 1) {
      const next = revealHint(state, level);
      expect(next).not.toBeNull();
      state = next!;
      if (state.found.includes(shortest.word)) break;
    }
    expect(state.found).toContain(shortest.word);
    let guard = 0;
    while (!isWordscapesComplete(state, level) && guard < 40) {
      state = revealHint(state, level)!;
      guard += 1;
    }
    expect(isWordscapesComplete(state, level)).toBe(true);
    expect(revealHint(state, level)).toBeNull();
  });
});

describe('letter wheel geometry', () => {
  it('hits the nearest node and extends or rewinds the swipe path', () => {
    const nodes = wheelNodes(6, 300, 30);
    expect(hitNode(nodes[2], nodes, 30)).toBe(2);
    expect(hitNode({ x: 150, y: 150 }, nodes, 30)).toBe(-1);
    let path = extendPath([], 0);
    path = extendPath(path, 3);
    path = extendPath(path, 3);
    expect(path).toEqual([0, 3]);
    expect(extendPath(path, 0)).toEqual([0]);
    expect(extendPath([0, 3, 4], 0)).toEqual([0, 3, 4]);
  });
});

describe('shared progress', () => {
  it('unlocks levels in order and keeps the best score', () => {
    const ids = bubbleLevels.map((level) => level.levelId);
    let progress = EMPTY_PROGRESS;
    expect(isLevelUnlocked(ids, 0, progress)).toBe(true);
    expect(isLevelUnlocked(ids, 1, progress)).toBe(false);
    progress = recordLevelComplete(progress, ids[0], 120);
    progress = recordLevelComplete(progress, ids[0], 80);
    expect(isLevelUnlocked(ids, 1, progress)).toBe(true);
    expect(progress.bestScores[ids[0]]).toBe(120);
    expect(progress.totalScore).toBe(120);
    expect(firstOpenLevelIndex(ids, progress)).toBe(1);
    expect(addBonusWord(addBonusWord(progress, 'SIN'), 'SIN').bonusWords).toEqual(['SIN']);
  });
});
