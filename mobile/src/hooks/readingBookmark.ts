export type ReadingBookmark = {
  y: number;
  contentHeight: number;
  viewportHeight: number;
  heading: string | null;
  line: string;
  percent: number;
};

export type ReadingBlock = {
  y: number;
  height: number;
  heading: string | null;
  text: string;
};

export const EMPTY_READING_BOOKMARK: ReadingBookmark = {
  y: 0,
  contentHeight: 0,
  viewportHeight: 0,
  heading: null,
  line: '',
  percent: 0,
};

export function readingPercent(y: number, contentHeight: number, viewportHeight: number): number {
  if (contentHeight <= 0) return 0;
  if (contentHeight <= viewportHeight + 1) return 1;
  return Math.min(1, Math.max(0, y / (contentHeight - viewportHeight)));
}

export function wrapPlainLines(text: string, maxChars: number): string[] {
  const limit = Math.max(12, maxChars);
  const words = text.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  if (!words.length) return [];
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > limit && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Last heading still in view, plus the last wrapped line at the bottom of the viewport. */
export function lastVisibleLine(
  blocks: ReadingBlock[],
  viewportBottom: number,
  contentWidth: number,
  lineHeight = 27,
): { heading: string | null; line: string } {
  const visible = blocks
    .filter((block) => block.text.trim() && block.y < viewportBottom - 4)
    .sort((a, b) => a.y - b.y);
  const last = visible[visible.length - 1];
  if (!last) return { heading: null, line: '' };
  const heading =
    [...visible].reverse().find((block) => block.heading)?.heading ?? last.heading;
  const visibleHeight = Math.max(0, Math.min(last.height, viewportBottom - last.y));
  const maxChars = Math.max(18, Math.floor((contentWidth || 320) / 8.2));
  const lines = wrapPlainLines(last.text, maxChars);
  if (!lines.length) return { heading, line: '' };
  const approxLines = Math.max(1, Math.round(last.height / lineHeight) || lines.length);
  const visibleLineCount = Math.max(1, Math.min(approxLines, Math.ceil(visibleHeight / lineHeight)));
  const index = Math.min(lines.length - 1, visibleLineCount - 1);
  return { heading, line: lines[index] ?? lines[lines.length - 1] };
}

export function parseReadingBookmark(raw: string | null): ReadingBookmark {
  if (!raw) return EMPTY_READING_BOOKMARK;
  const trimmed = raw.trim();
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    return { ...EMPTY_READING_BOOKMARK, y: Math.max(0, Number(trimmed) || 0) };
  }
  try {
    const parsed = JSON.parse(trimmed) as Partial<ReadingBookmark>;
    const y = Math.max(0, Number(parsed.y) || 0);
    const contentHeight = Math.max(0, Number(parsed.contentHeight) || 0);
    const viewportHeight = Math.max(0, Number(parsed.viewportHeight) || 0);
    const storedPercent = Number(parsed.percent);
    const percent = Number.isFinite(storedPercent)
      ? Math.min(1, Math.max(0, storedPercent))
      : readingPercent(y, contentHeight, viewportHeight);
    const heading =
      typeof parsed.heading === 'string' && parsed.heading.trim() ? parsed.heading.trim() : null;
    const line = typeof parsed.line === 'string' ? parsed.line.trim() : '';
    return { y, contentHeight, viewportHeight, heading, line, percent };
  } catch {
    return EMPTY_READING_BOOKMARK;
  }
}

export function serializeReadingBookmark(bookmark: ReadingBookmark): string {
  return JSON.stringify({
    y: Math.max(0, Math.round(bookmark.y)),
    contentHeight: Math.max(0, Math.round(bookmark.contentHeight)),
    viewportHeight: Math.max(0, Math.round(bookmark.viewportHeight)),
    heading: bookmark.heading,
    line: bookmark.line.slice(0, 240),
    percent: Math.round(bookmark.percent * 1000) / 1000,
  });
}

export function formatReadingPercent(percent: number): string {
  return `${Math.round(Math.min(1, Math.max(0, percent)) * 100)}%`;
}

export function bookmarkFromScroll(
  y: number,
  contentHeight: number,
  viewportHeight: number,
  contentWidth: number,
  blocks: ReadingBlock[],
): ReadingBookmark {
  const { heading, line } = lastVisibleLine(blocks, y + viewportHeight, contentWidth);
  return {
    y: Math.max(0, y),
    contentHeight,
    viewportHeight,
    heading,
    line,
    percent: readingPercent(y, contentHeight, viewportHeight),
  };
}
