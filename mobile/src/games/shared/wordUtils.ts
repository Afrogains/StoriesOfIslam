export function normalizeWord(word: string): string {
  return word.toUpperCase().replace(/[^A-Z]/g, '');
}

export function letterCounts(word: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const letter of normalizeWord(word)) counts.set(letter, (counts.get(letter) ?? 0) + 1);
  return counts;
}

/** True when `word` can be spelled using each letter of `letters` at most once. */
export function canSpell(word: string, letters: readonly string[]): boolean {
  const pool = letterCounts(letters.join(''));
  for (const [letter, count] of letterCounts(word)) {
    if ((pool.get(letter) ?? 0) < count) return false;
  }
  return true;
}

/** Smallest letter multiset from which every word can be spelled (one word at a time). */
export function minimalLetterCover(words: readonly string[]): string[] {
  const need = new Map<string, number>();
  for (const word of words) {
    for (const [letter, count] of letterCounts(word)) need.set(letter, Math.max(need.get(letter) ?? 0, count));
  }
  return [...need.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([letter, count]) => Array.from({ length: count }, () => letter));
}

/** All letters of all words, kept as a multiset (used when every word consumes its own tiles). */
export function letterUnion(words: readonly string[]): string[] {
  return words.flatMap((word) => [...normalizeWord(word)]).sort();
}

/** Deterministic PRNG (mulberry32) so boards and shuffles are reproducible in tests. */
export function seededRandom(seed: number | string): () => number {
  let state =
    typeof seed === 'number'
      ? seed >>> 0
      : [...seed].reduce((hash, char) => Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0, 2166136261);
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffled<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}
