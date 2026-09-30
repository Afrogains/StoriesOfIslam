#!/usr/bin/env node
/**
 * Extract chapter text + page map from the bundled Ibn Kathir PDF into
 * mobile/src/data/prophetChaptersFromPdf.json and ibnKathirPdfIndex.ts
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pdf = join(root, 'mobile/public/sources/ibn-kathir-stories-of-the-prophets.pdf');
const outJson = join(root, 'mobile/src/data/prophetChaptersFromPdf.json');
const outIndex = join(root, 'mobile/src/data/ibnKathirPdfIndex.ts');

const HEADING_TO_SLUG = [
  [/^\s*Prophet\s+Adam\s*$/i, 'adam', 'Adam', 'آدم'],
  [/^\s*Prophet\s+Idris/i, 'idris', 'Idris', 'إدريس'],
  [/^\s*Prophet\s+Nuh/i, 'nuh', 'Nuh', 'نوح'],
  [/^\s*Prophet\s+Hud\s*$/i, 'hud', 'Hud', 'هود'],
  [/^\s*Prophet\s+Salih\s*$/i, 'salih', 'Salih', 'صالح'],
  [/^\s*Prophet\s+Ibrahim/i, 'ibrahim', 'Ibrahim', 'إبراهيم'],
  [/^\s*Prophet\s+Isma/i, 'ismail', 'Isma‘il', 'إسماعيل'],
  [/^\s*Prophet\s+Ishaq/i, 'ishaq', 'Ishaq', 'إسحاق'],
  [/^\s*Prophet\s+Yaqub/i, 'yaqub', 'Yaqub', 'يعقوب'],
  [/^\s*Prophet\s+Lot/i, 'lut', 'Lut', 'لوط'],
  [/^\s*Prophet\s+Shu/i, 'shuaib', 'Shu‘aib', 'شعيب'],
  [/^\s*Prophet\s+Yusuf/i, 'yusuf', 'Yusuf', 'يوسف'],
  [/^\s*Prophet\s+Job/i, 'ayyub', 'Ayyub', 'أيوب'],
  [/^\s*Prophet\s+Dhul/i, 'dhul-kifl', 'Dhul-Kifl', 'ذو الكفل'],
  [/^\s*Prophet\s+Yunus/i, 'yunus', 'Yunus', 'يونس'],
  [/^\s*Prophet\s+Musa/i, 'musa', 'Musa', 'موسى'],
  [/^\s*Prophet\s+Hizqeel/i, 'hizqeel', 'Hizqeel', 'حزقيل'],
  [/^\s*Prophet\s+Elisha/i, 'ilyas', 'Ilyas', 'إلياس'],
  [/^\s*Prophet\s+Shammil/i, 'shammil', 'Shammil', 'شمويل'],
  [/^\s*Prophet\s+Dawud/i, 'dawud', 'Dawud', 'داود'],
  [/^\s*Prophet\s+Sulaiman/i, 'sulaiman', 'Sulaiman', 'سليمان'],
  [/^\s*Prophet\s+Shia/i, 'shia', 'Shi‘a', 'شعيا'],
  [/^\s*Prophet\s+Aramaya/i, 'aramaya', 'Aramaya', 'أرميا'],
  [/^\s*Prophet\s+Daniel/i, 'daniel', 'Daniel', 'دانيال'],
  [/^\s*Prophet\s+Uzair/i, 'uzair', 'Uzair', 'عزير'],
  [/^\s*Prophet\s+Zakariyah/i, 'zakariyah', 'Zakariyah', 'زكريا'],
  [/^\s*Prophet\s+Yahya/i, 'yahya', 'Yahya', 'يحيى'],
  [/^\s*Prophet\s+Isa\b/i, 'isa', 'Isa', 'عيسى'],
  // Boundary only — Muhammad ﷺ lives under Seerah in the app, not Qisas.
  [/^\s*Prophet\s+Muhammad\b/i, '__muhammad_boundary__', 'Muhammad', 'محمد'],
];

function cleanPage(text) {
  return text
    .replace(/www\.islambasics\.com/gi, '')
    .replace(/Kalamullah\.Com/gi, '')
    .replace(/\r/g, '')
    .trim();
}

function splitSections(body) {
  const lines = body.split('\n').map((l) => l.trimEnd());
  const sections = [];
  let heading = 'Account';
  let buf = [];

  const flush = () => {
    const text = buf.join('\n').replace(/\n{3,}/g, '\n\n').trim();
    if (text) sections.push({ heading, body: text });
    buf = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      buf.push('');
      continue;
    }
    const isHeading =
      trimmed.length <= 80 &&
      !/[.!?]$/.test(trimmed) &&
      !trimmed.startsWith('"') &&
      !trimmed.startsWith('“') &&
      !/^Allah\b/i.test(trimmed) &&
      !/^We said:/i.test(trimmed) &&
      !/^He said:/i.test(trimmed) &&
      !/^Remember when/i.test(trimmed) &&
      /^[A-Z][\w’'\- (),:]{2,78}$/.test(trimmed) &&
      trimmed.split(/\s+/).length <= 10;

    if (isHeading && buf.some((x) => x.trim())) {
      flush();
      heading = trimmed;
      continue;
    }
    if (isHeading && !buf.some((x) => x.trim())) {
      heading = trimmed;
      continue;
    }
    buf.push(trimmed);
  }
  flush();
  if (!sections.length && body.trim()) {
    sections.push({ heading: 'Account', body: body.trim() });
  }
  return sections;
}

function summarize(text, max = 220) {
  const flat = text.replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max);
  const last = cut.lastIndexOf('. ');
  return (last > 80 ? cut.slice(0, last + 1) : `${cut.trim()}…`).trim();
}

const raw = execFileSync('pdftotext', ['-layout', pdf, '-'], {
  encoding: 'utf8',
  maxBuffer: 32 * 1024 * 1024,
});
const pages = raw.split('\f').map(cleanPage);
// pdftotext often ends with an empty page
while (pages.length && !pages[pages.length - 1]) pages.pop();

const starts = [];
for (let i = 0; i < pages.length; i += 1) {
  const pageNo = i + 1;
  const page = pages[i];
  const firstLines = page.split('\n').slice(0, 8).join('\n');
  for (const [re, slug, nameEn, nameAr] of HEADING_TO_SLUG) {
    if (re.test(firstLines) || re.test(page.split('\n')[0] || '')) {
      if (!starts.find((s) => s.slug === slug)) {
        starts.push({ page: pageNo, slug, nameEn, nameAr });
      }
      break;
    }
  }
}

const chapters = {};
const pageIndex = {};

for (let i = 0; i < starts.length; i += 1) {
  const cur = starts[i];
  if (cur.slug.startsWith('__')) continue;
  const endPage = (starts[i + 1]?.page ?? pages.length + 1) - 1;
  const chunk = pages
    .slice(cur.page - 1, endPage)
    .join('\n\n')
    .replace(new RegExp(`^\\s*Prophet\\s+[^\\n]+\\n+`, 'i'), '')
    .trim();

  const sections = splitSections(chunk);
  const contentEn = sections.map((s) => `${s.heading}\n\n${s.body}`).join('\n\n');
  const words = contentEn.split(/\s+/).filter(Boolean).length;
  const durationMs = Math.max(120_000, Math.round((words / 150) * 60_000));

  chapters[cur.slug] = {
    slug: cur.slug,
    titleEn: `The Story of ${cur.nameEn}`,
    titleAr: `قصة ${cur.nameAr}`,
    nameEn: cur.nameEn,
    nameAr: cur.nameAr,
    contentEn,
    summaryEn: summarize(contentEn),
    sections,
    durationMs,
    sourceCitation:
      'Ibn Kathir, Stories of the Prophets (English PDF edition bundled in-app)',
    pdfPageStart: cur.page,
    pdfPageEnd: endPage,
  };
  pageIndex[cur.slug] = { start: cur.page, end: endPage, nameEn: cur.nameEn };

  // Harun shares Musa’s chapter in this edition.
  if (cur.slug === 'musa') {
    chapters.harun = {
      ...chapters.musa,
      slug: 'harun',
      titleEn: 'The Story of Musa & Harun',
      titleAr: 'قصة موسى وهارون',
      nameEn: 'Harun',
      nameAr: 'هارون',
      summaryEn: summarize(
        'Harun supported his brother Musa in calling Pharaoh and guiding the Children of Israel, as related in Ibn Kathir’s chapter on Musa and Harun.',
      ),
    };
    pageIndex.harun = pageIndex.musa;
  }
}

mkdirSync(dirname(outJson), { recursive: true });
writeFileSync(outJson, `${JSON.stringify(chapters, null, 2)}\n`);
writeFileSync(
  outIndex,
  `/**
 * Canonical in-app source for Qisas al-Anbiya: Ibn Kathir, Stories of the Prophets
 * (English PDF). Text/audio for Prophets resolve against this edition.
 */
export const IBN_KATHIR_PDF = {
  title: 'Stories of the Prophets',
  author: 'Al-Imam Ibn Kathir',
  edition: 'English PDF (Kalamullah / bundled in-app)',
  /** Served from Expo web public/ and available as a static asset path. */
  publicPath: '/sources/ibn-kathir-stories-of-the-prophets.pdf',
  pageCount: ${pages.length},
} as const;

export type IbnKathirPdfSpan = { start: number; end: number; nameEn: string };

export const ibnKathirPdfPages: Record<string, IbnKathirPdfSpan> = ${JSON.stringify(
    pageIndex,
    null,
    2,
  )} as const;

export function ibnKathirPdfUrl(page?: number): string {
  const base = IBN_KATHIR_PDF.publicPath;
  if (!page || page < 1) return base;
  return \`\${base}#page=\${page}\`;
}
`,
);

console.log(
  `Extracted ${Object.keys(chapters).length} chapters from ${pages.length} pages → ${outJson}`,
);
