import { chapterPlainText, getStoryChapters, type StoryChapter } from './chapters';
import { sectionsMeta } from './catalogMeta';
import type { SectionSlug, StoryItem } from '../types/catalog';

export const QUESTIONS_PER_CHAPTER = 5;

export type QuizQuestionKind = 'name' | 'number' | 'line' | 'figure';

export type QuizQuestion = {
  id: string;
  kind: QuizQuestionKind;
  prompt: string;
  /** Sentence with the answer blanked, for cloze questions. */
  quote?: string;
  options: string[];
  answerIndex: number;
  /** The original line from the chapter, shown after answering. */
  explanation: string;
  storyId: string;
  chapterIndex: number;
};

export type ChapterQuiz = {
  storyId: string;
  chapterIndex: number;
  questions: QuizQuestion[];
};

const NOT_NAMES = new Set(
  `a an and as at after again all also although among am are because before besides but by
  can could did do does during each even every for from had has have he her here hers him his how
  i if in indeed into is it its just let may me meanwhile more moreover most my no nor not now o of oh
  on once one only or our out over perhaps she should since so some such than that the their them then
  there therefore these they this those though thus till to too truly under until upon us very was we were
  what whatever when whenever where whereas whether which while who whoever whom whose why will with
  within without would ye yes yet you your
  allah god lord almighty exalted glorified glory praise praised merciful most-merciful
  prophet prophets messenger messengers apostle peace pbuh saw saws blessings mercy
  quran qur'an koran surah surat ayah ayat verse verses chapter ch
  muslim muslims believers believer disbelievers islam hadith sunnah day hereafter paradise hell fire
  narrated reported said says say asked replied answered behold verily
  january february march april may june july august september october november december
  monday tuesday wednesday thursday friday saturday sunday
  first second third fourth fifth part story stories book
  english arabic salat salah zakat zakah hajj umrah jihad hijrah hijra ramadan iman kufr shirk tawhid
  jannah jahannam dua du'a adhan iqamah wudu sadaqah ummah deen din kafir kafirs mushrik mushrikin
  mr mrs sir banu bani allahu akbar ansar muhajirin muhajireen sahabah companions jews jewish
  christian christians arab arabs muslimin mumineen israelites allahumma quranic islamic khalifah caliph
  amir ameer imam sheikh shaykh`
    .split(/\s+/)
    .filter(Boolean),
);

const CONNECTORS = new Set(['ibn', 'bin', 'bint', 'ibnat', 'al', 'al-', 'abu', 'umm', 'ul', 'ud', 'ad', 'as', 'az']);

const NUMBER_WORDS = [
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'fifteen',
  'twenty',
  'thirty',
  'forty',
  'fifty',
  'sixty',
  'seventy',
  'eighty',
  'hundred',
  'thousand',
];

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function seededRandom(seed: string): () => number {
  let state = hashString(seed) || 1;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

function pick<T>(items: T[], random: () => number): T | undefined {
  return items.length ? items[Math.floor(random() * items.length)] : undefined;
}

const SENTENCE_SPLIT = /(?<=[.!?])["”’']?\s+(?=["“‘']?[A-Z])/;

export function chapterSentences(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .split(SENTENCE_SPLIT)
    .map((sentence) => sentence.trim())
    .filter((sentence) => {
      if (sentence.length < 45 || sentence.length > 240) return false;
      if (/\d+\s*:\s*\d+|\bCh\.?\s*\d|https?:|www\.|\.{3}|…|[{}]/i.test(sentence)) return false;
      if ((sentence.match(/["“”]/g) ?? []).length > 2) return false;
      if (/[([][^)\]]*$/.test(sentence)) return false;
      return /^[“"‘']?[A-Z]/.test(sentence);
    });
}

function cleanToken(token: string): string {
  return token.replace(/^[^A-Za-z]+|[^A-Za-z'’-]+$/g, '');
}

function isCapitalized(word: string): boolean {
  if (/n['’]t$|['’]$/.test(word)) return false;
  return /^[A-Z][a-zA-Z'’-]*$/.test(word) && !NOT_NAMES.has(word.toLowerCase().replace(/[’']s$/, ''));
}

/** Capitalized name spans such as "Abu Bakr" or "Khalid ibn al-Walid". */
export function nameSpans(sentence: string): string[] {
  const tokens = sentence.split(/\s+/);
  const spans: string[] = [];
  let current: string[] = [];
  const flush = () => {
    while (current.length && CONNECTORS.has(current[current.length - 1].toLowerCase())) current.pop();
    if (current.length) spans.push(current.join(' '));
    current = [];
  };
  tokens.forEach((raw, position) => {
    const word = cleanToken(raw);
    const endsClause = /[,.;:!?”"]$/.test(raw);
    const connector = current.length > 0 && CONNECTORS.has(word.toLowerCase().replace(/-$/, ''));
    const hyphenated = /^al-[A-Z]/i.test(word) && current.length > 0;
    if (word && (isCapitalized(word) || hyphenated) && !(position === 0 && word.length < 3)) {
      current.push(word.replace(/[’']s$/, ''));
    } else if (connector) {
      current.push(word);
    } else {
      flush();
    }
    if (endsClause) flush();
  });
  flush();
  return spans.filter((span) => span.length >= 3 && span.length <= 40);
}

function blankOut(sentence: string, answer: string): string | null {
  const pattern = new RegExp(`\\b${answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
  if (!pattern.test(sentence)) return null;
  return sentence.replace(pattern, '_____');
}

function distinctFrom(answer: string, candidate: string): boolean {
  const a = answer.toLowerCase();
  const b = candidate.toLowerCase();
  return a !== b && !a.includes(b) && !b.includes(a);
}

/** Distractors come from the first pool before falling back to later ones. */
function buildOptions(
  answer: string,
  pool: string[] | string[][],
  random: () => number,
): { options: string[]; answerIndex: number } | null {
  const pools = (Array.isArray(pool[0]) ? pool : [pool]) as string[][];
  const seen = new Set<string>();
  const distractors = pools.flatMap((list) => shuffle(list, random)).filter((candidate) => {
    const key = candidate.toLowerCase();
    if (seen.has(key) || !distinctFrom(answer, candidate)) return false;
    seen.add(key);
    return true;
  });
  if (distractors.length < 3) return null;
  const options = shuffle([answer, ...distractors.slice(0, 3)], random);
  return { options, answerIndex: options.indexOf(answer) };
}

function truncate(text: string, max = 150): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

type StoryIndex = {
  names: Map<string, number>;
  sentencesByChapter: string[][];
};

const storyIndexCache = new Map<string, StoryIndex>();

function indexStory(story: StoryItem, chapters: StoryChapter[]): StoryIndex {
  const cached = storyIndexCache.get(story.id);
  if (cached) return cached;
  const names = new Map<string, number>();
  const sentencesByChapter = chapters.map((chapter) => {
    const sentences = chapterSentences(chapterPlainText(chapter));
    for (const sentence of sentences) {
      for (const span of nameSpans(sentence)) names.set(span, (names.get(span) ?? 0) + 1);
    }
    return sentences;
  });
  const index = { names, sentencesByChapter };
  storyIndexCache.set(story.id, index);
  return index;
}

type NameClass = 'person' | 'place' | 'group';

type NameStats = { count: number; placeHits: number; sections: Set<SectionSlug> };

type Lexicon = {
  lowercase: Map<string, number>;
  names: Map<string, NameStats>;
};

const PLACE_CUES = new Set(['in', 'to', 'from', 'at', 'towards', 'toward', 'near', 'reached', 'entered', 'left', 'into']);

const PLACE_OF_CUES = new Set(['battle', 'city', 'land', 'town', 'people', 'outskirts', 'region', 'valley', 'mount', 'road']);

const lexiconCache = new WeakMap<StoryItem[], Lexicon>();

/**
 * Corpus-wide word statistics. A capitalized word that also appears in lower
 * case across the catalog ("Prayer", "House", "Get") is not treated as a name.
 */
function buildLexicon(catalog: StoryItem[]): Lexicon {
  const cached = lexiconCache.get(catalog);
  if (cached) return cached;
  const lowercase = new Map<string, number>();
  const names = new Map<string, NameStats>();
  for (const story of catalog) {
    for (const chapter of getStoryChapters(story)) {
      const text = chapterPlainText(chapter);
      for (const raw of text.split(/\s+/)) {
        const word = cleanToken(raw);
        if (/^[a-z][a-z'’-]*$/.test(word)) lowercase.set(word, (lowercase.get(word) ?? 0) + 1);
      }
      for (const sentence of chapterSentences(text)) {
        for (const span of nameSpans(sentence)) {
          const stats = names.get(span) ?? { count: 0, placeHits: 0, sections: new Set<SectionSlug>() };
          stats.count += 1;
          stats.sections.add(story.sectionSlug);
          const at = sentence.indexOf(span);
          const preceding = at > 0 ? sentence.slice(0, at).trim().toLowerCase().split(/\s+/) : [];
          const before = preceding[preceding.length - 1];
          const placeOf = before === 'of' && PLACE_OF_CUES.has(preceding[preceding.length - 2] ?? '');
          if ((before && PLACE_CUES.has(before)) || placeOf) stats.placeHits += 1;
          names.set(span, stats);
        }
      }
    }
  }
  const lexicon = { lowercase, names };
  lexiconCache.set(catalog, lexicon);
  return lexicon;
}

function isRealName(span: string, lexicon: Lexicon): boolean {
  const stats = lexicon.names.get(span);
  if (!stats || stats.count < 2) return false;
  if (/^All-/i.test(span)) return false;
  return span.split(' ').every((word) => {
    const lower = word.toLowerCase();
    if (CONNECTORS.has(lower) || /^al-/i.test(word)) return true;
    const lowerCount = lexicon.lowercase.get(lower) ?? 0;
    return lowerCount < Math.max(2, stats.count * 0.25);
  });
}

function nameClass(span: string, lexicon: Lexicon): NameClass {
  if (!span.includes(' ') && /(?:ians?|ish|ites|ines|ese|ans|een|ins)$/.test(span)) return 'group';
  const stats = lexicon.names.get(span);
  return stats && stats.placeHits / stats.count >= 0.3 ? 'place' : 'person';
}

function sectionPeers(story: StoryItem, catalog: StoryItem[]): StoryItem[] {
  return catalog.filter((other) => other.sectionSlug === story.sectionSlug && other.id !== story.id);
}

function nameQuestion(
  sentence: string,
  answer: string,
  pool: string[][],
  random: () => number,
): Omit<QuizQuestion, 'id' | 'storyId' | 'chapterIndex'> | null {
  const quote = blankOut(sentence, answer);
  if (!quote) return null;
  const built = buildOptions(answer, pool, random);
  if (!built) return null;
  return {
    kind: 'name',
    prompt: 'Which name completes this line from the chapter?',
    quote,
    ...built,
    explanation: sentence,
  };
}

function numberQuestion(
  sentence: string,
  random: () => number,
): Omit<QuizQuestion, 'id' | 'storyId' | 'chapterIndex'> | null {
  const digit = sentence.match(/\b([1-9]\d{0,3})\b(?!\s*:)/);
  if (digit) {
    const value = Number(digit[1]);
    if (value >= 1000 && value <= 2100) return null;
    const variants = [value + 1, value - 1, value * 2, Math.round(value / 2), value + 10, value + 3]
      .filter((n) => n > 0 && n !== value)
      .map(String);
    const built = buildOptions(String(value), variants, random);
    const quote = sentence.replace(digit[0], '_____');
    return built
      ? { kind: 'number', prompt: 'Which number completes this line?', quote, ...built, explanation: sentence }
      : null;
  }
  const word = NUMBER_WORDS.find((candidate) => new RegExp(`\\b${candidate}\\b`, 'i').test(sentence));
  if (!word) return null;
  const match = sentence.match(new RegExp(`\\b${word}\\b`, 'i'))!;
  const original = match[0];
  const pool = NUMBER_WORDS.filter((candidate) => candidate !== word).map((candidate) =>
    original[0] === original[0].toUpperCase()
      ? candidate[0].toUpperCase() + candidate.slice(1)
      : candidate,
  );
  const built = buildOptions(original, pool, random);
  const quote = sentence.replace(original, '_____');
  return built
    ? { kind: 'number', prompt: 'Which number completes this line?', quote, ...built, explanation: sentence }
    : null;
}

function lineQuestion(
  sentence: string,
  peerSentences: string[],
  random: () => number,
): Omit<QuizQuestion, 'id' | 'storyId' | 'chapterIndex'> | null {
  const answer = truncate(sentence);
  const built = buildOptions(answer, peerSentences.map((line) => truncate(line)), random);
  if (!built) return null;
  return {
    kind: 'line',
    prompt: 'Which of these lines is from this chapter?',
    ...built,
    explanation: sentence,
  };
}

function peerLines(story: StoryItem, catalog: StoryItem[], random: () => number): string[] {
  const peers = shuffle(sectionPeers(story, catalog), random).slice(0, 6);
  const lines: string[] = [];
  for (const peer of peers) {
    const chapters = getStoryChapters(peer);
    const index = indexStory(peer, chapters);
    const chapterLines = pick(index.sentencesByChapter.filter((list) => list.length), random) ?? [];
    lines.push(...shuffle(chapterLines, random).slice(0, 2));
    if (lines.length >= 8) break;
  }
  return lines;
}

function figureQuestion(
  story: StoryItem,
  catalog: StoryItem[],
  random: () => number,
): Omit<QuizQuestion, 'id' | 'storyId' | 'chapterIndex'> | null {
  const answer = story.figureName;
  const pool = sectionPeers(story, catalog).map((peer) => peer.figureName);
  const built = buildOptions(answer, pool, random);
  if (!built) return null;
  return {
    kind: 'figure',
    prompt: `This chapter belongs to the story of which figure in ${sectionsMeta[story.sectionSlug].title}?`,
    ...built,
    explanation: `${story.title} · ${story.figureName}`,
  };
}

const sectionNameCache = new WeakMap<StoryItem[], Map<SectionSlug, string[]>>();

function sectionNameList(catalog: StoryItem[], section: SectionSlug, lexicon: Lexicon): string[] {
  let bySection = sectionNameCache.get(catalog);
  if (!bySection) {
    bySection = new Map();
    sectionNameCache.set(catalog, bySection);
  }
  const cached = bySection.get(section);
  if (cached) return cached;
  const list = [...lexicon.names.entries()]
    .filter(([name, stats]) => stats.sections.has(section) && isRealName(name, lexicon))
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 60)
    .map(([name]) => name);
  bySection.set(section, list);
  return list;
}

const quizCache = new Map<string, ChapterQuiz>();

export function getChapterQuiz(
  story: StoryItem,
  chapterIndex: number,
  catalog: StoryItem[],
): ChapterQuiz {
  const key = `${story.id}:${chapterIndex}`;
  const cached = quizCache.get(key);
  if (cached) return cached;

  const random = seededRandom(key);
  const chapters = getStoryChapters(story);
  const index = indexStory(story, chapters);
  const sentences = shuffle(index.sentencesByChapter[chapterIndex] ?? [], random);
  const lexicon = buildLexicon(catalog);
  const storyNames = [...index.names.keys()].filter((name) => isRealName(name, lexicon));
  const sectionNames = sectionNameList(catalog, story.sectionSlug, lexicon);
  const peerFigures = sectionPeers(story, catalog).map((peer) => peer.figureName);
  const poolsFor = (answer: string): string[][] => {
    const kind = nameClass(answer, lexicon);
    const sameKind = (name: string) => nameClass(name, lexicon) === kind;
    return [
      storyNames.filter(sameKind),
      sectionNames.filter(sameKind),
      kind === 'person' ? peerFigures : [],
    ];
  };

  const drafts: Omit<QuizQuestion, 'id' | 'storyId' | 'chapterIndex'>[] = [];
  const used = new Set<string>();
  const add = (draft: Omit<QuizQuestion, 'id' | 'storyId' | 'chapterIndex'> | null, sentence: string) => {
    if (!draft || used.has(sentence) || drafts.length >= QUESTIONS_PER_CHAPTER) return false;
    used.add(sentence);
    drafts.push(draft);
    return true;
  };

  let nameCount = 0;
  for (const sentence of sentences) {
    if (nameCount >= 3) break;
    const answers = nameSpans(sentence).filter((span) => isRealName(span, lexicon));
    const answer = pick(answers, random);
    if (answer && add(nameQuestion(sentence, answer, poolsFor(answer), random), sentence)) nameCount += 1;
  }

  for (const sentence of sentences) {
    if (drafts.some((draft) => draft.kind === 'number')) break;
    add(numberQuestion(sentence, random), sentence);
  }

  const lines = peerLines(story, catalog, random);
  for (const sentence of sentences) {
    if (drafts.length >= QUESTIONS_PER_CHAPTER) break;
    if (drafts.filter((draft) => draft.kind === 'line').length >= 2) break;
    add(lineQuestion(sentence, lines, random), sentence);
  }

  for (const sentence of sentences) {
    if (drafts.length >= QUESTIONS_PER_CHAPTER) break;
    const answer = pick(
      nameSpans(sentence).filter((span) => isRealName(span, lexicon)),
      random,
    );
    if (answer) add(nameQuestion(sentence, answer, poolsFor(answer), random), sentence);
  }

  for (const sentence of sentences) {
    if (drafts.length >= QUESTIONS_PER_CHAPTER) break;
    add(lineQuestion(sentence, lines, random), sentence);
  }

  if (drafts.length < QUESTIONS_PER_CHAPTER) add(figureQuestion(story, catalog, random), '__figure__');

  for (const sentence of sentences) {
    if (drafts.length >= QUESTIONS_PER_CHAPTER) break;
    if (drafts.some((draft) => draft.kind === 'line' && draft.explanation === sentence)) continue;
    add(lineQuestion(sentence, lines, random), `line:${sentence}`);
  }

  const questions = drafts.map((draft, position) => ({
    ...draft,
    id: `${key}:${position}`,
    storyId: story.id,
    chapterIndex,
  }));
  const quiz = { storyId: story.id, chapterIndex, questions };
  quizCache.set(key, quiz);
  return quiz;
}

export type GameQuestion = QuizQuestion & { storyTitle: string; sectionSlug: SectionSlug };

/** Random questions across the catalog for the knowledge game. */
export function drawGameQuestions(
  catalog: StoryItem[],
  count: number,
  seed: string,
  section: SectionSlug | 'all' = 'all',
): GameQuestion[] {
  const random = seededRandom(seed);
  const pool = catalog.filter((story) => section === 'all' || story.sectionSlug === section);
  const picked: GameQuestion[] = [];
  const seen = new Set<string>();
  let attempts = 0;
  while (picked.length < count && attempts < count * 8 && pool.length) {
    attempts += 1;
    const story = pool[Math.floor(random() * pool.length)];
    const chapters = getStoryChapters(story);
    const chapterIndex = Math.floor(random() * chapters.length);
    const quiz = getChapterQuiz(story, chapterIndex, catalog);
    const question = pick(
      quiz.questions.filter((item) => item.kind !== 'figure' && !seen.has(item.id)),
      random,
    );
    if (!question) continue;
    seen.add(question.id);
    picked.push({
      ...question,
      prompt:
        question.kind === 'line'
          ? `Which of these lines is from “${story.title}”?`
          : `${story.title}: ${question.prompt.replace('the chapter', 'the story')}`,
      storyTitle: story.title,
      sectionSlug: story.sectionSlug,
    });
  }
  return picked;
}
