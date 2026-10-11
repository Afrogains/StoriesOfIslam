/**
 * PDF-extracted chapters hard-wrap lines mid-sentence with single newlines;
 * real paragraphs are separated by blank lines. Rejoin wrapped lines so text
 * reflows to the device width instead of breaking into fragments.
 */
export function toParagraphs(body: string): string[] {
  return body
    .split(/\n\s*\n+/)
    .map((block) => block.replace(/\s*\n\s*/g, ' ').replace(/\s{2,}/g, ' ').trim())
    .filter(Boolean);
}
