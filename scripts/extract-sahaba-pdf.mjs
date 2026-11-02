#!/usr/bin/env node
/**
 * Extract companion biographies from the bundled Sahaba PDF into
 * mobile/src/data/sahabahChaptersFromPdf.json and sahabahPdfIndex.ts
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pdf = join(root, 'mobile/public/sources/biographies-of-the-companions-sahaba.pdf');
const outJson = join(root, 'mobile/src/data/sahabahChaptersFromPdf.json');
const outIndex = join(root, 'mobile/src/data/sahabahPdfIndex.ts');

/** Ordered TOC from the PDF (pages 1–2), with OCR-tolerant match aliases. */
const COMPANIONS = [
  { slug: 'abbad-ibn-bishr', nameEn: 'Abbad Ibn Bishr', nameAr: 'عباد بن بشر', aliases: ['Abbad Ibn Bishr'] },
  { slug: 'abdullah-ibn-abbas', nameEn: 'Abdullah Ibn Abbas', nameAr: 'عبد الله بن عباس', aliases: ['Abdullah ibn Abbas', 'Abdullah Ibn Abbas'] },
  { slug: 'abdullah-ibn-hudhafah', nameEn: 'Abdullah Ibn Hudhafah As-Sahmi', nameAr: 'عبد الله بن حذافة السهمي', aliases: ['Abdullah Ibn Hudhafah'] },
  { slug: 'abdullah-ibn-jahsh', nameEn: 'Abdullah Ibn Jahsh', nameAr: 'عبد الله بن جحش', aliases: ['Abdullah Ibn Jahsh'] },
  { slug: 'abdullah-ibn-masud', nameEn: "Abdullah Ibn Mas'ud", nameAr: 'عبد الله بن مسعود', aliases: ["Abdullah Ibn Mas'ud", 'Abdullah Ibn Masud'] },
  { slug: 'abdullah-ibn-sailam', nameEn: 'Abdullah Ibn Sailam', nameAr: 'عبد الله بن سلام', aliases: ['Abdullah Ibn Sailam', 'Abdullah Ibn Sallam', 'Abdullah ibn Sallam'] },
  { slug: 'abdullah-ibn-umar', nameEn: 'Abdullah Ibn Umar', nameAr: 'عبد الله بن عمر', aliases: ['Abdullah Ibn Umar'] },
  { slug: 'abdullah-ibn-umm-maktum', nameEn: 'Abdullah Ibn Umm Maktum', nameAr: 'عبد الله بن أم مكتوم', aliases: ['Abdullah Ibn Umm Maktum'] },
  { slug: 'abdur-rahman-ibn-awf', nameEn: 'Abdur-Rahman Ibn Awf', nameAr: 'عبد الرحمن بن عوف', aliases: ['Abdur-Rahman Ibn Awl', 'Abdur-Rahman Ibn Awf', 'Abdur Rahman Ibn Awf'] },
  { slug: 'abu-ayyub-al-ansari', nameEn: 'Abu Ayyub Al-Ansari', nameAr: 'أبو أيوب الأنصاري', aliases: ['Abu Ayyub Al-Ansari'] },
  { slug: 'abu-dharr-al-ghifari', nameEn: 'Abu Dharr Al-Ghifari', nameAr: 'أبو ذر الغفاري', aliases: ['Abu Dharr Al-Ghifari'] },
  { slug: 'abu-musa-al-ashari', nameEn: 'Abu Musa Al-Ashari', nameAr: 'أبو موسى الأشعري', aliases: ['Abu Musa Al-Ashari'] },
  { slug: 'abu-hurayrah', nameEn: 'Abu Hurayrah', nameAr: 'أبو هريرة', aliases: ['Abu Hurayrah'] },
  { slug: 'abu-sufyan-ibn-al-harith', nameEn: 'Abu Sufyan Ibn Al-Harith', nameAr: 'أبو سفيان بن الحارث', aliases: ['Abu Sufyan ibn al-Harith', 'Abu Sufyan Ibn Al-Harith'] },
  { slug: 'abu-ubaydah-ibn-al-jarrah', nameEn: 'Abu Ubaydah Ibn Al-Jarrah', nameAr: 'أبو عبيدة بن الجراح', aliases: ['Abu Ubaydah ibn Al-Jarrah', 'Abu Ubaydah Ibn Al-Jarrah'] },
  { slug: 'abu-darda', nameEn: 'Abu-d Dardaa', nameAr: 'أبو الدرداء', aliases: ['Abu-d Dardaa', 'Abu ad-Darda'] },
  { slug: 'abu-l-aas', nameEn: 'Abu-l Aas ibn ar-Rabiah', nameAr: 'أبو العاص بن الربيع', aliases: ['Abu-l Aas ibn ar-Rabiah'] },
  { slug: 'adiyy-ibn-hatim', nameEn: 'Adiyy Ibn Hatim', nameAr: 'عدي بن حاتم', aliases: ['Adiyy Ibn Hatim'] },
  { slug: 'aishah', nameEn: 'Aishah Bint Abi Bakr', nameAr: 'عائشة بنت أبي بكر', aliases: ['Aishah Bint Abi Bakr', 'Aisha Bint Abi Bakr'], female: true },
  { slug: 'al-baraa-ibn-malik', nameEn: 'Al-Baraa Ibn Malik Al-Ansari', nameAr: 'البراء بن مالك الأنصاري', aliases: ['Al-Baraa Ibn Malik', 'Al-Baraa Ibn Malil'] },
  { slug: 'amr-ibn-al-jamuh', nameEn: 'Amr Ibn Al-Jamuh', nameAr: 'عمرو بن الجموح', aliases: ['Amr Ibn Al-Jamuh'] },
  { slug: 'an-nuayman-ibn-amr', nameEn: 'An-Nuayman Ibn Amr', nameAr: 'النعيمان بن عمرو', aliases: ['An-Nuayman Ibn Amr'] },
  { slug: 'an-numan-ibn-muqarrin', nameEn: 'An-Numan Ibn Muqarrin', nameAr: 'النعمان بن مقرن', aliases: ['An-Numan Ibn Muqarrin'] },
  { slug: 'at-tufayl-ibn-amr', nameEn: 'At-Tufayl Ibn Amr Ad-Dawsi', nameAr: 'الطفيل بن عمرو الدوسي', aliases: ['At-Tufayl ibn Amr', 'At-Tufayl Ibn Amr'] },
  { slug: 'asmaa-bint-abu-bakr', nameEn: 'Asmaa Bint Abu Bakr', nameAr: 'أسماء بنت أبي بكر', aliases: ['Asmaa Bint Abu Bakr'], female: true },
  { slug: 'barakah', nameEn: 'Barakah', nameAr: 'بركة', aliases: ['Barakah'], female: true },
  { slug: 'fatimah-bint-muhammad', nameEn: 'Fatimah Bint Muhammad', nameAr: 'فاطمة بنت محمد', aliases: ['Fatimah Bint Muhammad'], female: true },
  { slug: 'fayruz-ad-daylami', nameEn: 'Fayruz Ad-Daylami', nameAr: 'فيروز الديلمي', aliases: ['Fayruz Ad-Daylami'] },
  { slug: 'habib-ibn-zayd', nameEn: 'Habib Ibn Zayd Al-Ansari', nameAr: 'حبيب بن زيد الأنصاري', aliases: ['Habib Ibn Zayd'] },
  { slug: 'hakim-ibn-hazm', nameEn: 'Hakim Ibn Hazm', nameAr: 'حكيم بن حزام', aliases: ['Hakim ibn Hazm', 'Hakim Ibn Hazm'] },
  { slug: 'hudhayfah-ibn-al-yaman', nameEn: 'Hudhayfah Ibn Al-Yaman', nameAr: 'حذيفة بن اليمان', aliases: ['Hudhayfah Ibn Al-Yaman'] },
  { slug: 'ikrimah-ibn-abi-jahl', nameEn: 'Ikrimah Ibn Abi Jahl', nameAr: 'عكرمة بن أبي جهل', aliases: ['Ikrimah Ibn Abi Jahl'] },
  { slug: 'jafar-ibn-abi-talib', nameEn: 'Jafar Ibn Abi Talib', nameAr: 'جعفر بن أبي طالب', aliases: ['Jafar ibn Abi Talib', 'Jafar Ibn Abi Talib'] },
  { slug: 'julaybib', nameEn: 'Julaybib', nameAr: 'جليبب', aliases: ['Julaybib'] },
  { slug: 'khabbab-ibn-al-aratt', nameEn: 'Khabbab Ibn Al-Aratt', nameAr: 'خباب بن الأرت', aliases: ['Khabbab Ibn Al-Aratt'] },
  { slug: 'muadh-ibn-jabal', nameEn: 'Muadh Ibn Jabal', nameAr: 'معاذ بن جبل', aliases: ['Muadh Ibn Jabal'] },
  { slug: 'muhammad-ibn-maslamah', nameEn: 'Muhammad Ibn Maslamah', nameAr: 'محمد بن مسلمة', aliases: ['Muhammad Ibn Maslamah'] },
  { slug: 'musab-ibn-umayr', nameEn: 'Musab Ibn Umayr', nameAr: 'مصعب بن عمير', aliases: ['Musab Ibn Umayr'] },
  { slug: 'nuaym-ibn-masud', nameEn: 'Nuaym Ibn Masud', nameAr: 'نعيم بن مسعود', aliases: ['Nuaym Ibn Masud'] },
  { slug: 'rabiah-ibn-kab', nameEn: 'Rabiah Ibn Kab', nameAr: 'ربيعة بن كعب', aliases: ['Rabiah Ibn Kab'] },
  { slug: 'ramlah-bint-abi-sufyan', nameEn: 'Ramlah Bint Abi Sufyan', nameAr: 'رملة بنت أبي سفيان', aliases: ['Ramlah Bint Abi Sufyan'], female: true },
  { slug: 'rumaysa-bint-milhan', nameEn: 'Rumaysa Bint Milhan', nameAr: 'رميصة بنت ملحان', aliases: ['Rumaysa Bint Milhan'], female: true },
  { slug: 'sad-ibn-abi-waqqas', nameEn: 'Sad Ibn Abi Waqqas', nameAr: 'سعد بن أبي وقاص', aliases: ['Sad Ibn Abi Waqqas', "Sa'd Ibn Abi Waqqas"] },
  { slug: 'said-ibn-aamir', nameEn: 'Said Ibn Aamir Al-Jumahi', nameAr: 'سعيد بن عامر الجمحي', aliases: ["Sa'id ibn Aamir", 'Said Ibn Aamir'] },
  { slug: 'said-ibn-zayd', nameEn: 'Said Ibn Zayd', nameAr: 'سعيد بن زيد', aliases: ['Said Ibn Zayd', "Sa'id Ibn Zayd"] },
  { slug: 'salim-mawla-abi-hudhayfah', nameEn: 'Salim Mawla Abi Hudhayfah', nameAr: 'سالم مولى أبي حذيفة', aliases: ['Salim Mawla Abi Hudhayfah'] },
  { slug: 'salman-al-farsi', nameEn: 'Salman Al-Farsi', nameAr: 'سلمان الفارسي', aliases: ['Salman al-Farsi', 'Salman Al-Farsi'] },
  { slug: 'suhayb-ar-rumi', nameEn: 'Suhayb Ar-Rumi', nameAr: 'صهيب الرومي', aliases: ['Suhayb Ar-Rumi'] },
  { slug: 'suhayl-ibn-amr', nameEn: 'Suhayl Ibn Amr', nameAr: 'سهيل بن عمرو', aliases: ['Suhayl Ibn Amr'] },
  { slug: 'talhah-ibn-ubaydullah', nameEn: 'Talhah ibn Ubaydullah', nameAr: 'طلحة بن عبيد الله', aliases: ['Talhah ibn Ubaydullah'] },
  { slug: 'thabit-ibn-qays', nameEn: 'Thabit Ibn Qays', nameAr: 'ثابت بن قيس', aliases: ['Thabit Ibn Qays'] },
  { slug: 'thumamah-ibn-uthal', nameEn: 'Thumamah Ibn Uthal', nameAr: 'ثمامة بن أثال', aliases: ['Thumamah Ibn Uthal'] },
  { slug: 'ubayy-ibn-kab', nameEn: 'Ubayy Ibn Kab', nameAr: 'أبي بن كعب', aliases: ['Ubayy Ibn Kab'] },
  { slug: 'umayr-ibn-sad', nameEn: 'Umayr Ibn Sad Al-Ansari', nameAr: 'عمير بن سعد الأنصاري', aliases: ['Umayr ibn Sad', 'Umayr Ibn Sad'] },
  { slug: 'umayr-ibn-wahb', nameEn: 'Umayr Ibn Wahb', nameAr: 'عمير بن وهب', aliases: ['Umayr Ibn Wahb'] },
  { slug: 'umm-salamah', nameEn: 'Umm Salamah', nameAr: 'أم سلمة', aliases: ['Umm Salamah'], female: true },
  { slug: 'uqbah-ibn-amir', nameEn: 'Uqbah Ibn Amir', nameAr: 'عقبة بن عامر', aliases: ['Uqbah Ibn Aamir', 'Uqbah Ibn Amir'] },
  { slug: 'utbah-ibn-ghazwan', nameEn: 'Utbah Ibn Ghazwan', nameAr: 'عتبة بن غزوان', aliases: ['Utbah Ibn Ghazwan'] },
  { slug: 'zayd-al-khayr', nameEn: 'Zayd Al-Khayr', nameAr: 'زيد الخير', aliases: ['Zayd Al-Khayr'] },
  { slug: 'zayd-ibn-thabit', nameEn: 'Zayd ibn Thabit', nameAr: 'زيد بن ثابت', aliases: ['Zayd ibn Thabit', 'Zayd Ibn Thabit'] },
];

function cleanPage(text) {
  return text
    .replace(/Courtesy of ISL Software[^\n]*/gi, '')
    .replace(/List of the Sahaabah's Biographies/gi, '')
    .replace(/Scanned from:[^\n]*/gi, '')
    .replace(/From Alim[^\n]*/gi, '')
    .replace(/www\.islambasics\.com/gi, '')
    .replace(/\r/g, '')
    .trim();
}

function normalize(s) {
  return s
    .toLowerCase()
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function pageMatchesCompanion(pageText, companion) {
  const head = pageText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 8)
    .join('\n');
  const headNorm = normalize(head);
  for (const alias of companion.aliases) {
    const a = normalize(alias);
    if (headNorm.startsWith(a) || headNorm.includes(`\n${a}`) || normalize(head.split('\n')[0] || '') === a) {
      return true;
    }
    // First non-empty line contains alias as leading title
    const first = normalize(head.split('\n')[0] || '');
    if (first.startsWith(a) || a.startsWith(first) && first.length >= 8) return true;
  }
  return false;
}

function splitSections(body) {
  const paragraphs = body
    .split(/\n{2,}/)
    .map((p) => p.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  if (!paragraphs.length) return [];

  const sections = [];
  let heading = 'Biography';
  let buf = [];

  const flush = () => {
    const text = buf.join('\n\n').trim();
    if (text) sections.push({ heading, body: text });
    buf = [];
  };

  for (const para of paragraphs) {
    const looksHeading =
      para.length <= 70 &&
      !/[.!?]$/.test(para) &&
      para.split(/\s+/).length <= 10 &&
      /^[A-Z]/.test(para) &&
      !/^(It|On|From|The|He|She|When|After|In|At|His|Her|This|With|For|As|They|One|Then|There|During|Among)\b/.test(
        para,
      );

    if (looksHeading && buf.length) {
      flush();
      heading = para;
      continue;
    }
    if (looksHeading && !buf.length) {
      heading = para;
      continue;
    }
    buf.push(para);
  }
  flush();
  if (!sections.length && body.trim()) {
    sections.push({ heading: 'Biography', body: body.trim() });
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

function stripLeadingTitle(chunk, companion) {
  let out = chunk;
  for (const alias of companion.aliases) {
    const re = new RegExp(`^\\s*${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\n+`, 'i');
    out = out.replace(re, '');
  }
  return out.trim();
}

const raw = execFileSync('pdftotext', ['-layout', pdf, '-'], {
  encoding: 'utf8',
  maxBuffer: 32 * 1024 * 1024,
});
const pages = raw.split('\f').map(cleanPage);
while (pages.length && !pages[pages.length - 1]) pages.pop();

// Skip TOC pages 1–3; biographies begin around page 4.
const BODY_START_PAGE = 4;

const starts = [];
for (let i = BODY_START_PAGE - 1; i < pages.length; i += 1) {
  const pageNo = i + 1;
  for (const companion of COMPANIONS) {
    if (starts.some((s) => s.slug === companion.slug)) continue;
    if (pageMatchesCompanion(pages[i], companion)) {
      starts.push({ page: pageNo, ...companion });
      break;
    }
  }
}

// Preserve TOC order for roster even if PDF scan order differs slightly.
starts.sort((a, b) => {
  const ai = COMPANIONS.findIndex((c) => c.slug === a.slug);
  const bi = COMPANIONS.findIndex((c) => c.slug === b.slug);
  return ai - bi;
});
// Re-sort by actual page for slicing
const byPage = [...starts].sort((a, b) => a.page - b.page);

const chapters = {};
const pageIndex = {};
const roster = [];

for (let i = 0; i < byPage.length; i += 1) {
  const cur = byPage[i];
  const endPage = (byPage[i + 1]?.page ?? pages.length + 1) - 1;
  const chunk = stripLeadingTitle(
    pages.slice(cur.page - 1, endPage).join('\n\n'),
    cur,
  );

  const sections = splitSections(chunk);
  const contentEn = sections.map((s) => `${s.heading}\n\n${s.body}`).join('\n\n');
  const words = contentEn.split(/\s+/).filter(Boolean).length;
  const durationMs = Math.max(90_000, Math.round((words / 140) * 60_000));
  const honorificEn = cur.female
    ? 'may Allah be pleased with her'
    : 'may Allah be pleased with him';
  const honorificAr = cur.female ? 'رضي الله عنها' : 'رضي الله عنه';

  chapters[cur.slug] = {
    slug: cur.slug,
    titleEn: cur.nameEn,
    titleAr: cur.nameAr,
    nameEn: cur.nameEn,
    nameAr: cur.nameAr,
    honorificEn,
    honorificAr,
    contentEn,
    summaryEn: summarize(contentEn),
    sections,
    durationMs,
    sourceCitation:
      'Companions of the Prophet (Abdul Wahid Hamid / ISL Software) — English PDF bundled in-app',
    pdfPageStart: cur.page,
    pdfPageEnd: Math.max(cur.page, endPage),
  };
  pageIndex[cur.slug] = { start: cur.page, end: Math.max(cur.page, endPage), nameEn: cur.nameEn };
  roster.push({
    slug: cur.slug,
    nameEn: cur.nameEn,
    nameAr: cur.nameAr,
    honorificEn,
    honorificAr,
    summaryEn: summarize(contentEn, 160),
    sortOrder: COMPANIONS.findIndex((c) => c.slug === cur.slug) + 1,
    female: Boolean(cur.female),
  });
}

roster.sort((a, b) => a.sortOrder - b.sortOrder);

mkdirSync(dirname(outJson), { recursive: true });
writeFileSync(outJson, `${JSON.stringify(chapters, null, 2)}\n`);
writeFileSync(
  outIndex,
  `/**
 * Canonical in-app source for Sahabah biographies:
 * Companions of the Prophet (Abdul Wahid Hamid / ISL Software), English PDF.
 */
export const SAHABAH_PDF = {
  title: 'Biographies of the Companions (Sahaabah)',
  author: 'Abdul Wahid Hamid / ISL Software',
  edition: 'English PDF (bundled in-app)',
  publicPath: '/sources/biographies-of-the-companions-sahaba.pdf',
  pageCount: ${pages.length},
} as const;

export type SahabahPdfSpan = { start: number; end: number; nameEn: string };

export const sahabahPdfPages: Record<string, SahabahPdfSpan> = ${JSON.stringify(
    pageIndex,
    null,
    2,
  )} as const;

export function sahabahPdfUrl(page?: number): string {
  const base = SAHABAH_PDF.publicPath;
  if (!page || page < 1) return base;
  return \`\${base}#page=\${page}\`;
}

/** Ordered roster metadata generated with chapter extract. */
export const SAHABAH_ROSTER_META = ${JSON.stringify(roster, null, 2)} as const;
`,
);

const missing = COMPANIONS.filter((c) => !chapters[c.slug]).map((c) => c.slug);
console.log(
  `Extracted ${Object.keys(chapters).length}/${COMPANIONS.length} companions from ${pages.length} pages → ${outJson}`,
);
if (missing.length) {
  console.warn('Missing companions:', missing.join(', '));
  process.exitCode = 1;
}
