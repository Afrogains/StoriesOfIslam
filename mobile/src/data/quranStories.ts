import type { AuthenticityGrade, StoryItem } from '../types/catalog';
import { QURAN_STORIES_PDF } from './quranStoriesPdfIndex';
import pdfChapters from './quranStoriesFromPdf.json';
import { toParagraphs } from './text';

export type QuranStoryEra =
  | 'first-generations'
  | 'musa-and-israel'
  | 'kingdoms-and-travels'
  | 'signs-and-counsel'
  | 'before-the-prophet';

export const QURAN_STORY_ERA_LABELS: Record<QuranStoryEra, { en: string; ar: string }> = {
  'first-generations': { en: 'First generations', ar: 'الأمم الأولى' },
  'musa-and-israel': { en: 'Musa and Israel', ar: 'موسى وبنو إسرائيل' },
  'kingdoms-and-travels': { en: 'Kingdoms and travels', ar: 'ممالك ومسير' },
  'signs-and-counsel': { en: 'Signs and counsel', ar: 'آيات ومواعظ' },
  'before-the-prophet': { en: 'Before the Prophet ﷺ', ar: 'قبيل بعثته ﷺ' },
};

export type QuranStorySection = {
  heading: string;
  body: string;
};

export type QuranStoryChapter = {
  slug: string;
  sortOrder: number;
  titleEn: string;
  titleAr: string;
  nameEn: string;
  nameAr: string;
  contentEn: string;
  summaryEn: string;
  sections: QuranStorySection[];
  durationMs: number;
  sourceCitation: string;
  pdfPageStart?: number;
  pdfPageEnd?: number;
};

type QuranStoryOverlay = {
  era: QuranStoryEra;
  summaryEn: string;
  takeawayEn: string;
  honorific: string;
  honorificAr: string;
  authenticityGrade: AuthenticityGrade;
};

/**
 * Short card copy and grouping. Full chapter text stays in the extracted PDF JSON.
 */
const OVERLAY: Record<string, QuranStoryOverlay> = {
  'quran-habil-qabil': {
    era: 'first-generations',
    summaryEn:
      'The sons of Adam offered sacrifices. Only Habil’s was accepted. Qabil killed his brother — the first crime on earth — and a raven taught him how to bury the dead.',
    takeawayEn: 'Envy ruins the self. Accepted worship is sincere, and murder of one soul is like killing all mankind.',
    honorific: 'as related in the Quran',
    honorificAr: 'كما ورد في القرآن',
    authenticityGrade: 'sahih',
  },
  'quran-harut-marut': {
    era: 'first-generations',
    summaryEn:
      'The people of Babylon followed what the satans recited of magic in the time of Sulaiman. Two angels, Harut and Marut, were a trial: they taught only after warning, “We are a test, so do not disbelieve.”',
    takeawayEn: 'Magic is a trial. Whoever sells belief for it has no share in the Hereafter.',
    honorific: 'as related in the Quran',
    honorificAr: 'كما ورد في القرآن',
    authenticityGrade: 'historical',
  },
  'quran-dwellers-of-the-town': {
    era: 'first-generations',
    summaryEn:
      'Allah sent two messengers to a town, then a third. A man came running from the farthest side of the city and said, “Follow the messengers.” The people killed him; Allah admitted him to Paradise.',
    takeawayEn: 'Support the truth even when you stand alone. A single sincere voice can outweigh a city.',
    honorific: 'as related in the Quran',
    honorificAr: 'كما ورد في القرآن',
    authenticityGrade: 'sahih',
  },
  'quran-the-heifer': {
    era: 'musa-and-israel',
    summaryEn:
      'A man was murdered among the Children of Israel. Musa told them Allah commanded them to slaughter a cow. They delayed with questions until the cow was rare and costly — then the dead man named his killer.',
    takeawayEn: 'Do not stall when Allah commands you. Delay turns a simple duty into a heavy one.',
    honorific: 'peace be upon him',
    honorificAr: 'عليه السلام',
    authenticityGrade: 'sahih',
  },
  'quran-musa-and-al-khidr': {
    era: 'musa-and-israel',
    summaryEn:
      'Musa travelled to the meeting of the two seas to learn from a servant whom Allah had taught from His own knowledge. The damaged boat, the slain boy, and the rebuilt wall were all mercy Musa could not see at first.',
    takeawayEn: 'Human sight is short. What looks like loss may be protection written by the Most Knowing.',
    honorific: 'peace be upon him',
    honorificAr: 'عليه السلام',
    authenticityGrade: 'sahih',
  },
  'quran-qarun': {
    era: 'musa-and-israel',
    summaryEn:
      'Qarun was of Musa’s people, yet he oppressed them. His keys would have burdened a company of strong men. He said his wealth was from knowledge of his own — then the earth swallowed him and his house.',
    takeawayEn: 'Wealth without gratitude is a trap. Do not wish for the pomp of those whom Allah has left to themselves.',
    honorific: 'as related in the Quran',
    honorificAr: 'كما ورد في القرآن',
    authenticityGrade: 'sahih',
  },
  'quran-bilqis': {
    era: 'kingdoms-and-travels',
    summaryEn:
      'The hoopoe brought Sulaiman news of a queen in Yemen who, with her people, worshipped the sun. A letter, a throne carried in the blink of an eye, and a glass palace led Bilqis to submit with Sulaiman to the Lord of the worlds.',
    takeawayEn: 'Wisdom recognizes a sign. Rank and wealth are nothing beside the One who gave them.',
    honorific: 'peace be upon him',
    honorificAr: 'عليه السلام',
    authenticityGrade: 'sahih',
  },
  'quran-saba': {
    era: 'kingdoms-and-travels',
    summaryEn:
      'Saba’ had two gardens and easy roads. They turned away from gratitude, so the flood of the dam left only bitter fruit. Their story is a sign for whoever is grateful — and a warning for whoever is not.',
    takeawayEn: 'Blessings last with thanks. Arrogance turns gardens into wasteland.',
    honorific: 'as related in the Quran',
    honorificAr: 'كما ورد في القرآن',
    authenticityGrade: 'sahih',
  },
  'quran-uzair': {
    era: 'kingdoms-and-travels',
    summaryEn:
      'A man passed a town tumbled on its roofs and asked how Allah would bring it to life. Allah caused him to die a hundred years, then raised him. His food had not spoiled, yet his donkey was bones — then assembled before his eyes.',
    takeawayEn: 'The One who gives life to a town and a donkey gives life to the dead. Never measure Allah by what you can imagine.',
    honorific: 'peace be upon him',
    honorificAr: 'عليه السلام',
    authenticityGrade: 'sahih',
  },
  'quran-dhul-qarnayn': {
    era: 'kingdoms-and-travels',
    summaryEn:
      'They asked about Dhul-Qarnayn. Allah established him in the earth and gave him a way to everything. He travelled west and east, then built a barrier of iron and molten copper against a people who could not raid beyond it.',
    takeawayEn: 'Power is a trust. Help the weak, judge with justice, and remember that every barrier falls when the promise comes.',
    honorific: 'as related in the Quran',
    honorificAr: 'كما ورد في القرآن',
    authenticityGrade: 'sahih',
  },
  'quran-gog-and-magog': {
    era: 'kingdoms-and-travels',
    summaryEn:
      'Ya’juj and Ma’juj were a people of corruption behind Dhul-Qarnayn’s wall. The Quran and the authentic reports say they will surge from every height when the promise draws near — a trial at the end of time.',
    takeawayEn: 'No wall lasts forever except the command of Allah. Prepare for the Hour more than you fear any nation.',
    honorific: 'as related in the Quran',
    honorificAr: 'كما ورد في القرآن',
    authenticityGrade: 'sahih',
  },
  'quran-people-of-the-cave': {
    era: 'signs-and-counsel',
    summaryEn:
      'Young men fled a city that worshipped other than Allah and took shelter in a cave. Their Lord sealed their ears for years, then raised them so the people would know that the promise of Allah is true and the Hour is coming.',
    takeawayEn: 'Leave a place of shirk for a place of tawhid. Allah guards those who take Him as protector.',
    honorific: 'as related in the Quran',
    honorificAr: 'كما ورد في القرآن',
    authenticityGrade: 'sahih',
  },
  'quran-believer-and-disbeliever': {
    era: 'signs-and-counsel',
    summaryEn:
      'Two men: one had two gardens and entered them in pride, saying he did not think the Hour would come. His companion reminded him to say “That which Allah wills — there is no power except with Allah.” The fruit was ruined overnight.',
    takeawayEn: 'When you enter a blessing, say “ma sha Allah, la quwwata illa billah.” Wealth is not proof that you are loved.',
    honorific: 'as related in the Quran',
    honorificAr: 'كما ورد في القرآن',
    authenticityGrade: 'sahih',
  },
  'quran-people-of-the-garden': {
    era: 'signs-and-counsel',
    summaryEn:
      'Owners of a garden swore they would harvest at dawn so no poor person would come. A visitor from their Lord circled the garden while they slept. In the morning they found a blackened field, then blamed one another, then turned back to their Lord.',
    takeawayEn: 'Charity is due when the fruit is picked. A plot against the poor is a plot against yourself.',
    honorific: 'as related in the Quran',
    honorificAr: 'كما ورد في القرآن',
    authenticityGrade: 'sahih',
  },
  'quran-sabbath-breakers': {
    era: 'signs-and-counsel',
    summaryEn:
      'A town by the sea was tested on the Sabbath. Fish came openly that day and hid on other days. Some laid nets on Friday as a trick. Those who warned were saved; those who transgressed were told, “Be apes, despised.”',
    takeawayEn: 'Tricks do not hide disobedience. When you see a sin, at least refuse it in the heart and speak if you can.',
    honorific: 'as related in the Quran',
    honorificAr: 'كما ورد في القرآن',
    authenticityGrade: 'sahih',
  },
  'quran-luqman': {
    era: 'signs-and-counsel',
    summaryEn:
      'Allah gave Luqman wisdom. He told his son: do not associate anything with Allah, be good to your parents, establish prayer, enjoin what is right, bear what befalls you, and do not walk on the earth in pride.',
    takeawayEn: 'The first lesson a parent teaches is tawhid. Wisdom is gratitude, humility, and a tongue that remembers Allah.',
    honorific: 'may Allah have mercy on him',
    honorificAr: 'رحمه الله',
    authenticityGrade: 'sahih',
  },
  'quran-people-of-the-ditch': {
    era: 'before-the-prophet',
    summaryEn:
      'A boy learned faith from a monk, healed the king’s companion, and then the people believed. The king dug a ditch of fire. Those who would not leave their Lord were thrown in — and a mother and her child walked in together.',
    takeawayEn: 'Faith can cost everything. Those who burn a believing people have only burned themselves.',
    honorific: 'as related in the Quran',
    honorificAr: 'كما ورد في القرآن',
    authenticityGrade: 'sahih',
  },
  'quran-barsisa': {
    era: 'before-the-prophet',
    summaryEn:
      'A renowned worshipper was asked to care for a woman left in trust. Shaytan led him step by step until he fell, then killed, then disbelieved so that he might be saved — and Shaytan left him. “The allies of Shaytan disappoint whoever takes them.”',
    takeawayEn: 'A small door of fitnah becomes a wide gate. Do not walk the path Shaytan opens, even if it looks like a rescue.',
    honorific: 'as related in the Quran',
    honorificAr: 'كما ورد في القرآن',
    authenticityGrade: 'historical',
  },
  'quran-owners-of-the-elephant': {
    era: 'before-the-prophet',
    summaryEn:
      'Abraha marched on the Ka‘bah with elephants in the year the Prophet ﷺ was born. Abdul-Muttalib said the House has a Lord who will defend it. Allah sent birds in flocks with baked clay, and He made their plot like eaten straw.',
    takeawayEn: 'Allah guards His House. The Year of the Elephant prepared Makkah for the coming of the Messenger ﷺ.',
    honorific: 'as related in the Quran',
    honorificAr: 'كما ورد في القرآن',
    authenticityGrade: 'sahih',
  },
};

const bySlug = pdfChapters as unknown as Record<string, QuranStoryChapter>;

export function getQuranStory(slug: string): QuranStoryChapter | undefined {
  return bySlug[slug];
}

export function listQuranStorySlugs(): string[] {
  return Object.values(bySlug)
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((chapter) => chapter.slug);
}

export function quranStoryEra(slug: string): QuranStoryEra {
  return OVERLAY[slug]?.era ?? 'signs-and-counsel';
}

function cuesFromSections(
  chapter: QuranStoryChapter,
): { startMs: number; endMs: number; textEn: string; textAr: string }[] {
  const chunks: { en: string }[] = [];
  for (const section of chapter.sections) {
    chunks.push({ en: section.heading });
    const paras = toParagraphs(section.body);
    for (const para of paras) {
      const sentences = para
        .split(/(?<=[.!?])\s+/)
        .map((part) => part.trim())
        .filter(Boolean);
      if (sentences.length <= 2) chunks.push({ en: para });
      else {
        for (let i = 0; i < sentences.length; i += 2) {
          chunks.push({ en: sentences.slice(i, i + 2).join(' ') });
        }
      }
    }
  }

  const maxChunks = 180;
  const used =
    chunks.length <= maxChunks
      ? chunks
      : chunks.filter((_, index) => index % Math.ceil(chunks.length / maxChunks) === 0);
  const durationMs = Math.max(chapter.durationMs, used.length * 8_000);
  const slice = Math.max(Math.floor(durationMs / used.length), 6_000);

  return used.map((chunk, index) => ({
    textEn: chunk.en,
    textAr: index === 0 ? chapter.titleAr : '',
    startMs: index * slice,
    endMs: index === used.length - 1 ? durationMs : (index + 1) * slice,
  }));
}

export function quranStoryToStoryItem(slug: string): StoryItem | null {
  const chapter = getQuranStory(slug);
  if (!chapter) return null;
  const overlay = OVERLAY[slug];
  const durationMs = chapter.durationMs;
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);
  const pageLabel =
    chapter.pdfPageStart && chapter.pdfPageEnd
      ? `pp. ${chapter.pdfPageStart}–${chapter.pdfPageEnd}`
      : `Chapter ${chapter.sortOrder}`;

  return {
    id: chapter.slug,
    sectionSlug: 'qisas-al-quran',
    title: chapter.titleEn,
    titleAr: chapter.titleAr,
    figureName: chapter.nameEn,
    figureNameAr: chapter.nameAr,
    honorific: overlay?.honorific ?? 'as related in the Quran',
    honorificAr: overlay?.honorificAr ?? 'كما ورد في القرآن',
    summary: overlay?.summaryEn ?? chapter.summaryEn,
    content: chapter.contentEn,
    durationLabel: `${minutes}:${seconds.toString().padStart(2, '0')}`,
    durationMs,
    authenticityGrade: overlay?.authenticityGrade ?? 'sahih',
    sourceCitation: chapter.sourceCitation,
    sourceBook: `${QURAN_STORIES_PDF.author} — ${QURAN_STORIES_PDF.title}`,
    sourceVolume: `${QURAN_STORIES_PDF.translator} · ${QURAN_STORIES_PDF.edition}`,
    sourcePageOrHadith: `${pageLabel} · Story ${chapter.sortOrder} of 19`,
    hasAudio: true,
    audioUrl: null,
    timedCues: cuesFromSections(chapter),
    isFavorite: false,
    keyTakeaway: overlay?.takeawayEn ?? `Read the full account from Ibn Kathir’s Stories of the Quran (${pageLabel}).`,
  };
}

export function buildQuranStoriesCatalog(): StoryItem[] {
  return listQuranStorySlugs()
    .map((slug) => quranStoryToStoryItem(slug))
    .filter((story): story is StoryItem => Boolean(story));
}

export function mergeQuranStoriesIntoCatalog(stories: StoryItem[]): StoryItem[] {
  const slugs = new Set(listQuranStorySlugs());
  const without = stories.filter(
    (story) => story.sectionSlug !== 'qisas-al-quran' && !slugs.has(story.id),
  );
  return [...without, ...buildQuranStoriesCatalog()];
}
