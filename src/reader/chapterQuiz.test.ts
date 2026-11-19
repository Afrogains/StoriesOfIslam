import { describe, expect, it } from 'vitest';
import { loadBundledCatalog } from '../../mobile/src/data/bundledCatalog';
import { buildChapters, chapterPlainText, countWords, getStoryChapters } from '../../mobile/src/data/chapters';
import {
  chapterSentences,
  drawGameQuestions,
  getChapterQuiz,
  nameSpans,
  QUESTIONS_PER_CHAPTER,
  seededRandom,
} from '../../mobile/src/data/quiz';

const catalog = loadBundledCatalog();

function paragraph(words: number, seed: string): string {
  const sentence = `${seed} walked to the city and spoke with the people there about faith.`;
  const perSentence = countWords(sentence);
  return Array.from({ length: Math.ceil(words / perSentence) }, () => sentence).join(' ');
}

describe('story chapters', () => {
  it('keeps short stories as a single chapter', () => {
    const chapters = buildChapters([{ heading: 'Intro', body: paragraph(300, 'Salman') }]);
    expect(chapters).toHaveLength(1);
    expect(chapters[0].title).toBe('Intro');
  });

  it('splits long single-section stories into numbered parts', () => {
    const body = [paragraph(600, 'Bilal'), paragraph(600, 'Bilal'), paragraph(600, 'Bilal')].join('\n\n');
    const chapters = buildChapters([{ heading: 'Biography', body }]);
    expect(chapters.length).toBeGreaterThan(1);
    expect(chapters[0].title).toBe('Biography · Part 1');
    expect(chapters[1].blocks[0].heading).toBe('Biography (continued)');
    const total = chapters.reduce((sum, chapter) => sum + chapter.words, 0);
    expect(total).toBe(countWords(body));
  });

  it('never loses text and never produces tiny chapters', () => {
    for (const story of catalog) {
      const chapters = getStoryChapters(story);
      expect(chapters.length).toBeGreaterThan(0);
      chapters.forEach((chapter, index) => {
        expect(chapter.index).toBe(index);
        if (chapters.length > 1) expect(chapter.words).toBeGreaterThanOrEqual(250);
        expect(chapterPlainText(chapter).length).toBeGreaterThan(0);
      });
    }
  });
});

describe('chapter CBT', () => {
  it('builds exactly five well-formed questions for every chapter in the catalog', () => {
    for (const story of catalog) {
      for (const chapter of getStoryChapters(story)) {
        const quiz = getChapterQuiz(story, chapter.index, catalog);
        expect(quiz.questions, `${story.id} #${chapter.index}`).toHaveLength(QUESTIONS_PER_CHAPTER);
        for (const question of quiz.questions) {
          expect(question.options).toHaveLength(4);
          expect(new Set(question.options).size).toBe(4);
          expect(question.options[question.answerIndex]).toBeDefined();
          if (question.quote) expect(question.quote).toContain('_____');
        }
      }
    }
  });

  it('is deterministic for the same chapter', () => {
    const story = catalog[0];
    const first = getChapterQuiz(story, 0, catalog).questions.map((q) => q.options.join('|'));
    const second = getChapterQuiz(story, 0, [...catalog]).questions.map((q) => q.options.join('|'));
    expect(second).toEqual(first);
  });

  it('extracts names and filters unusable sentences', () => {
    expect(nameSpans('Then Khalid ibn al-Walid rode out with Abu Bakr to Makkah.')).toEqual([
      'Khalid ibn al-Walid',
      'Abu Bakr',
      'Makkah',
    ]);
    expect(chapterSentences('Short. See Quran 2:255 for the verse that was revealed then.')).toEqual([]);
  });

  it('draws game questions across sections', () => {
    const questions = drawGameQuestions(catalog, 10, 'round-1');
    expect(questions).toHaveLength(10);
    expect(new Set(questions.map((q) => q.id)).size).toBe(10);
    const sahabah = drawGameQuestions(catalog, 5, 'round-2', 'sahabah');
    expect(sahabah.every((q) => q.sectionSlug === 'sahabah')).toBe(true);
    expect(seededRandom('a')()).toBe(seededRandom('a')());
  });
});
