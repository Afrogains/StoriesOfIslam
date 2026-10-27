import { describe, expect, it } from 'vitest';
import {
  bookmarkFromScroll,
  formatReadingPercent,
  lastVisibleLine,
  parseReadingBookmark,
  readingPercent,
  serializeReadingBookmark,
  wrapPlainLines,
} from '../../mobile/src/hooks/readingBookmark';

describe('reading bookmark progress', () => {
  it('computes a real percentage from scroll geometry', () => {
    expect(readingPercent(0, 1000, 200)).toBe(0);
    expect(readingPercent(400, 1000, 200)).toBe(0.5);
    expect(readingPercent(800, 1000, 200)).toBe(1);
    expect(readingPercent(0, 180, 200)).toBe(1);
    expect(formatReadingPercent(0.476)).toBe('48%');
  });

  it('keeps the last visible heading and wraps the last line at the viewport bottom', () => {
    const blocks = [
      { y: 0, height: 54, heading: 'Birth', text: 'He was born in Makkah in the Year of the Elephant among a noble household.' },
      { y: 80, height: 81, heading: 'The cave', text: 'In the cave of Hira he worshipped in seclusion until the first verses were revealed.' },
    ];
    const visible = lastVisibleLine(blocks, 120, 320);
    expect(visible.heading).toBe('The cave');
    expect(visible.line.toLowerCase()).toMatch(/seclusion|verses|revealed/);
    expect(wrapPlainLines('one two three four five', 10)).toEqual(['one two', 'three four', 'five']);
  });

  it('round-trips JSON bookmarks and still reads legacy numeric offsets', () => {
    const saved = parseReadingBookmark(
      serializeReadingBookmark({
        y: 240,
        contentHeight: 1200,
        viewportHeight: 400,
        heading: 'The cave',
        line: 'until the first verses were revealed.',
        percent: 0.3,
      }),
    );
    expect(saved).toMatchObject({ y: 240, heading: 'The cave', percent: 0.3 });
    expect(parseReadingBookmark('180').y).toBe(180);
    expect(parseReadingBookmark(null).percent).toBe(0);
    const fromScroll = bookmarkFromScroll(400, 1000, 200, 320, [
      { y: 0, height: 100, heading: 'Birth', text: 'He was born in Makkah in a blessed house of noble lineage and care.' },
      { y: 500, height: 80, heading: 'The cave', text: 'Then the first verses were revealed to him in the cave.' },
    ]);
    expect(fromScroll.percent).toBe(0.5);
    expect(fromScroll.heading).toBe('The cave');
    expect(fromScroll.line.length).toBeGreaterThan(8);
  });
});
