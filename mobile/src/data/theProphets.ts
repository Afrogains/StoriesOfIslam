/**
 * Prophets roster for Qisas al-Anbiya, ordered as in Ibn Kathir’s
 * Stories of the Prophets (English). Summaries are concise teaching notes —
 * source attribution only, not a full reprint of the book.
 */

export interface ProphetFigure {
  sortOrder: number;
  slug: string;
  nameEn: string;
  nameAr: string;
  honorificEn: string;
  honorificAr: string;
  summaryEn: string;
}

export const PROPHETS_SERIES = {
  title: 'Stories of the Prophets',
  author: 'Ibn Kathir',
  credit: 'Ibn Kathir — Stories of the Prophets',
  description:
    'Chronological messengers of Allah as arranged in Ibn Kathir’s Qisas al-Anbiya, with brief summaries for learning.',
} as const;

export const theProphets: ProphetFigure[] = [
  {
    sortOrder: 1,
    slug: 'adam',
    nameEn: 'Adam',
    nameAr: 'آدم',
    honorificEn: 'peace be upon him',
    honorificAr: 'عليه السلام',
    summaryEn:
      'The first human and prophet, taught the names and placed on earth as Allah’s vicegerent.',
  },
  {
    sortOrder: 2,
    slug: 'idris',
    nameEn: 'Idris',
    nameAr: 'إدريس',
    honorificEn: 'peace be upon him',
    honorificAr: 'عليه السلام',
    summaryEn:
      'A truthful prophet raised to a high station; called people back to Adam’s religion.',
  },
  {
    sortOrder: 3,
    slug: 'nuh',
    nameEn: 'Nuh',
    nameAr: 'نوح',
    honorificEn: 'peace be upon him',
    honorificAr: 'عليه السلام',
    summaryEn:
      'Called his people to tawhid for centuries; believers were saved in the Ark from the Flood.',
  },
  {
    sortOrder: 4,
    slug: 'hud',
    nameEn: 'Hud',
    nameAr: 'هود',
    honorificEn: 'peace be upon him',
    honorificAr: 'عليه السلام',
    summaryEn: 'Sent to the powerful people of ‘Ad, calling them to worship Allah alone.',
  },
  {
    sortOrder: 5,
    slug: 'salih',
    nameEn: 'Salih',
    nameAr: 'صالح',
    honorificEn: 'peace be upon him',
    honorificAr: 'عليه السلام',
    summaryEn: 'Sent to Thamud; warned them concerning the she-camel of Allah.',
  },
  {
    sortOrder: 6,
    slug: 'ibrahim',
    nameEn: 'Ibrahim',
    nameAr: 'إبراهيم',
    honorificEn: 'peace be upon him',
    honorificAr: 'عليه السلام',
    summaryEn: 'The Friend of Allah who broke the idols and called his people to pure tawhid.',
  },
  {
    sortOrder: 7,
    slug: 'ismail',
    nameEn: 'Isma‘il',
    nameAr: 'إسماعيل',
    honorificEn: 'peace be upon him',
    honorificAr: 'عليه السلام',
    summaryEn: 'Son of Ibrahim, settled with Hajar in Makkah; linked to Zamzam and the Ka‘bah.',
  },
  {
    sortOrder: 8,
    slug: 'ishaq',
    nameEn: 'Ishaq',
    nameAr: 'إسحاق',
    honorificEn: 'peace be upon him',
    honorificAr: 'عليه السلام',
    summaryEn: 'Son of Ibrahim; father of Yaqub and a prophet in the line of guidance.',
  },
  {
    sortOrder: 9,
    slug: 'yaqub',
    nameEn: 'Yaqub',
    nameAr: 'يعقوب',
    honorificEn: 'peace be upon him',
    honorificAr: 'عليه السلام',
    summaryEn: 'Also called Israel; father of the twelve tribes including Yusuf.',
  },
  {
    sortOrder: 10,
    slug: 'lut',
    nameEn: 'Lut',
    nameAr: 'لوط',
    honorificEn: 'peace be upon him',
    honorificAr: 'عليه السلام',
    summaryEn: 'Sent to the people of Sodom to forbid open immorality and call to Allah.',
  },
  {
    sortOrder: 11,
    slug: 'shuaib',
    nameEn: 'Shu‘aib',
    nameAr: 'شعيب',
    honorificEn: 'peace be upon him',
    honorificAr: 'عليه السلام',
    summaryEn: 'Sent to Madyan; commanded fair trade and forbade corruption on the earth.',
  },
  {
    sortOrder: 12,
    slug: 'yusuf',
    nameEn: 'Yusuf',
    nameAr: 'يوسف',
    honorificEn: 'peace be upon him',
    honorificAr: 'عليه السلام',
    summaryEn: 'Thrown into a well, sold into Egypt, then raised by Allah through patience.',
  },
  {
    sortOrder: 13,
    slug: 'ayyub',
    nameEn: 'Ayyub',
    nameAr: 'أيوب',
    honorificEn: 'peace be upon him',
    honorificAr: 'عليه السلام',
    summaryEn: 'Patient through severe trial; he turned to Allah and was restored.',
  },
  {
    sortOrder: 14,
    slug: 'dhul-kifl',
    nameEn: 'Dhul-Kifl',
    nameAr: 'ذو الكفل',
    honorificEn: 'peace be upon him',
    honorificAr: 'عليه السلام',
    summaryEn: 'Counted among the patient and righteous in Ibn Kathir’s accounts.',
  },
  {
    sortOrder: 15,
    slug: 'yunus',
    nameEn: 'Yunus',
    nameAr: 'يونس',
    honorificEn: 'peace be upon him',
    honorificAr: 'عليه السلام',
    summaryEn: 'Swallowed by the whale, then rescued after calling upon Allah in the darkness.',
  },
  {
    sortOrder: 16,
    slug: 'musa',
    nameEn: 'Musa',
    nameAr: 'موسى',
    honorificEn: 'peace be upon him',
    honorificAr: 'عليه السلام',
    summaryEn: 'Sent to Pharaoh with clear signs; received the Torah and led his people.',
  },
  {
    sortOrder: 17,
    slug: 'harun',
    nameEn: 'Harun',
    nameAr: 'هارون',
    honorificEn: 'peace be upon him',
    honorificAr: 'عليه السلام',
    summaryEn: 'Brother of Musa who supported him in calling Pharaoh and guiding Israel.',
  },
  {
    sortOrder: 18,
    slug: 'hizqeel',
    nameEn: 'Hizqeel',
    nameAr: 'حزقيل',
    honorificEn: 'peace be upon him',
    honorificAr: 'عليه السلام',
    summaryEn: 'Ezekiel; among the prophets after Musa in Ibn Kathir’s narration.',
  },
  {
    sortOrder: 19,
    slug: 'ilyas',
    nameEn: 'Ilyas',
    nameAr: 'إلياس',
    honorificEn: 'peace be upon him',
    honorificAr: 'عليه السلام',
    summaryEn: 'Called his people away from idolatry between Musa and later messengers.',
  },
  {
    sortOrder: 20,
    slug: 'shammil',
    nameEn: 'Shammil',
    nameAr: 'شمويل',
    honorificEn: 'peace be upon him',
    honorificAr: 'عليه السلام',
    summaryEn: 'Samuel; guided the Israelites when they asked Allah for a king.',
  },
  {
    sortOrder: 21,
    slug: 'dawud',
    nameEn: 'Dawud',
    nameAr: 'داود',
    honorificEn: 'peace be upon him',
    honorificAr: 'عليه السلام',
    summaryEn: 'Defeated Goliath; given kingship and the Zabur.',
  },
  {
    sortOrder: 22,
    slug: 'sulaiman',
    nameEn: 'Sulaiman',
    nameAr: 'سليمان',
    honorificEn: 'peace be upon him',
    honorificAr: 'عليه السلام',
    summaryEn: 'Inherited Dawud’s prophethood; taught the speech of birds and given vast dominion.',
  },
  {
    sortOrder: 23,
    slug: 'shia',
    nameEn: 'Shi‘a',
    nameAr: 'شعيا',
    honorificEn: 'peace be upon him',
    honorificAr: 'عليه السلام',
    summaryEn: 'Isaiah; advised his king and, per Ibn Kathir, spoke of later messengers.',
  },
  {
    sortOrder: 24,
    slug: 'aramaya',
    nameEn: 'Aramaya',
    nameAr: 'أرميا',
    honorificEn: 'peace be upon him',
    honorificAr: 'عليه السلام',
    summaryEn: 'Jeremiah; warned his people through the trials of Jerusalem.',
  },
  {
    sortOrder: 25,
    slug: 'daniel',
    nameEn: 'Daniel',
    nameAr: 'دانيال',
    honorificEn: 'peace be upon him',
    honorificAr: 'عليه السلام',
    summaryEn: 'Preserved by Allah when cast among lions during the Babylonian captivity.',
  },
  {
    sortOrder: 26,
    slug: 'uzair',
    nameEn: 'Uzair',
    nameAr: 'عزير',
    honorificEn: 'peace be upon him',
    honorificAr: 'عليه السلام',
    summaryEn: 'Ezra; the Quranic account of one caused to die a hundred years then raised.',
  },
  {
    sortOrder: 27,
    slug: 'zakariyah',
    nameEn: 'Zakariyah',
    nameAr: 'زكريا',
    honorificEn: 'peace be upon him',
    honorificAr: 'عليه السلام',
    summaryEn: 'Cared for Maryam and was granted Yahya in his old age.',
  },
  {
    sortOrder: 28,
    slug: 'yahya',
    nameEn: 'Yahya',
    nameAr: 'يحيى',
    honorificEn: 'peace be upon him',
    honorificAr: 'عليه السلام',
    summaryEn: 'Given wisdom as a child; devout, merciful, and firm upon the Scripture.',
  },
  {
    sortOrder: 29,
    slug: 'isa',
    nameEn: 'Isa',
    nameAr: 'عيسى',
    honorificEn: 'peace be upon him',
    honorificAr: 'عليه السلام',
    summaryEn: 'Son of Maryam, created by Allah’s word; a messenger with clear signs.',
  },
];

export function prophetBySlug(slug: string): ProphetFigure | undefined {
  return theProphets.find((item) => item.slug === slug);
}
