/**
 * Canonical in-app source for Sahabah biographies:
 * Companions of the Prophet (Abdul Wahid Hamid / ISL Software), English PDF.
 */
export const SAHABAH_PDF = {
  title: 'Biographies of the Companions (Sahaabah)',
  author: 'Abdul Wahid Hamid / ISL Software',
  edition: 'English PDF (bundled in-app)',
  publicPath: '/sources/biographies-of-the-companions-sahaba.pdf',
  pageCount: 251,
} as const;

export type SahabahPdfSpan = { start: number; end: number; nameEn: string };

export const sahabahPdfPages: Record<string, SahabahPdfSpan> = {
  "abbad-ibn-bishr": {
    "start": 4,
    "end": 6,
    "nameEn": "Abbad Ibn Bishr"
  },
  "abdullah-ibn-abbas": {
    "start": 7,
    "end": 11,
    "nameEn": "Abdullah Ibn Abbas"
  },
  "abdullah-ibn-hudhafah": {
    "start": 12,
    "end": 15,
    "nameEn": "Abdullah Ibn Hudhafah As-Sahmi"
  },
  "abdullah-ibn-jahsh": {
    "start": 16,
    "end": 19,
    "nameEn": "Abdullah Ibn Jahsh"
  },
  "abdullah-ibn-masud": {
    "start": 20,
    "end": 23,
    "nameEn": "Abdullah Ibn Mas'ud"
  },
  "abdullah-ibn-sailam": {
    "start": 24,
    "end": 26,
    "nameEn": "Abdullah Ibn Sailam"
  },
  "abdullah-ibn-umar": {
    "start": 27,
    "end": 29,
    "nameEn": "Abdullah Ibn Umar"
  },
  "abdullah-ibn-umm-maktum": {
    "start": 30,
    "end": 32,
    "nameEn": "Abdullah Ibn Umm Maktum"
  },
  "abdur-rahman-ibn-awf": {
    "start": 33,
    "end": 36,
    "nameEn": "Abdur-Rahman Ibn Awf"
  },
  "abu-ayyub-al-ansari": {
    "start": 37,
    "end": 40,
    "nameEn": "Abu Ayyub Al-Ansari"
  },
  "abu-dharr-al-ghifari": {
    "start": 41,
    "end": 44,
    "nameEn": "Abu Dharr Al-Ghifari"
  },
  "abu-musa-al-ashari": {
    "start": 45,
    "end": 47,
    "nameEn": "Abu Musa Al-Ashari"
  },
  "abu-hurayrah": {
    "start": 48,
    "end": 52,
    "nameEn": "Abu Hurayrah"
  },
  "abu-sufyan-ibn-al-harith": {
    "start": 53,
    "end": 56,
    "nameEn": "Abu Sufyan Ibn Al-Harith"
  },
  "abu-ubaydah-ibn-al-jarrah": {
    "start": 57,
    "end": 60,
    "nameEn": "Abu Ubaydah Ibn Al-Jarrah"
  },
  "abu-darda": {
    "start": 61,
    "end": 64,
    "nameEn": "Abu-d Dardaa"
  },
  "abu-l-aas": {
    "start": 65,
    "end": 68,
    "nameEn": "Abu-l Aas ibn ar-Rabiah"
  },
  "adiyy-ibn-hatim": {
    "start": 69,
    "end": 72,
    "nameEn": "Adiyy Ibn Hatim"
  },
  "aishah": {
    "start": 73,
    "end": 77,
    "nameEn": "Aishah Bint Abi Bakr"
  },
  "al-baraa-ibn-malik": {
    "start": 78,
    "end": 80,
    "nameEn": "Al-Baraa Ibn Malik Al-Ansari"
  },
  "amr-ibn-al-jamuh": {
    "start": 81,
    "end": 83,
    "nameEn": "Amr Ibn Al-Jamuh"
  },
  "an-nuayman-ibn-amr": {
    "start": 84,
    "end": 86,
    "nameEn": "An-Nuayman Ibn Amr"
  },
  "an-numan-ibn-muqarrin": {
    "start": 87,
    "end": 90,
    "nameEn": "An-Numan Ibn Muqarrin"
  },
  "at-tufayl-ibn-amr": {
    "start": 91,
    "end": 94,
    "nameEn": "At-Tufayl Ibn Amr Ad-Dawsi"
  },
  "asmaa-bint-abu-bakr": {
    "start": 95,
    "end": 99,
    "nameEn": "Asmaa Bint Abu Bakr"
  },
  "barakah": {
    "start": 100,
    "end": 104,
    "nameEn": "Barakah"
  },
  "fatimah-bint-muhammad": {
    "start": 105,
    "end": 112,
    "nameEn": "Fatimah Bint Muhammad"
  },
  "fayruz-ad-daylami": {
    "start": 113,
    "end": 116,
    "nameEn": "Fayruz Ad-Daylami"
  },
  "habib-ibn-zayd": {
    "start": 117,
    "end": 119,
    "nameEn": "Habib Ibn Zayd Al-Ansari"
  },
  "hakim-ibn-hazm": {
    "start": 120,
    "end": 122,
    "nameEn": "Hakim Ibn Hazm"
  },
  "hudhayfah-ibn-al-yaman": {
    "start": 123,
    "end": 127,
    "nameEn": "Hudhayfah Ibn Al-Yaman"
  },
  "ikrimah-ibn-abi-jahl": {
    "start": 128,
    "end": 131,
    "nameEn": "Ikrimah Ibn Abi Jahl"
  },
  "jafar-ibn-abi-talib": {
    "start": 132,
    "end": 136,
    "nameEn": "Jafar Ibn Abi Talib"
  },
  "julaybib": {
    "start": 137,
    "end": 139,
    "nameEn": "Julaybib"
  },
  "khabbab-ibn-al-aratt": {
    "start": 140,
    "end": 143,
    "nameEn": "Khabbab Ibn Al-Aratt"
  },
  "muadh-ibn-jabal": {
    "start": 144,
    "end": 146,
    "nameEn": "Muadh Ibn Jabal"
  },
  "muhammad-ibn-maslamah": {
    "start": 147,
    "end": 151,
    "nameEn": "Muhammad Ibn Maslamah"
  },
  "musab-ibn-umayr": {
    "start": 152,
    "end": 158,
    "nameEn": "Musab Ibn Umayr"
  },
  "nuaym-ibn-masud": {
    "start": 159,
    "end": 164,
    "nameEn": "Nuaym Ibn Masud"
  },
  "rabiah-ibn-kab": {
    "start": 165,
    "end": 168,
    "nameEn": "Rabiah Ibn Kab"
  },
  "ramlah-bint-abi-sufyan": {
    "start": 169,
    "end": 171,
    "nameEn": "Ramlah Bint Abi Sufyan"
  },
  "rumaysa-bint-milhan": {
    "start": 172,
    "end": 175,
    "nameEn": "Rumaysa Bint Milhan"
  },
  "sad-ibn-abi-waqqas": {
    "start": 176,
    "end": 181,
    "nameEn": "Sad Ibn Abi Waqqas"
  },
  "said-ibn-aamir": {
    "start": 182,
    "end": 186,
    "nameEn": "Said Ibn Aamir Al-Jumahi"
  },
  "said-ibn-zayd": {
    "start": 187,
    "end": 190,
    "nameEn": "Said Ibn Zayd"
  },
  "salim-mawla-abi-hudhayfah": {
    "start": 191,
    "end": 193,
    "nameEn": "Salim Mawla Abi Hudhayfah"
  },
  "salman-al-farsi": {
    "start": 194,
    "end": 197,
    "nameEn": "Salman Al-Farsi"
  },
  "suhayb-ar-rumi": {
    "start": 198,
    "end": 201,
    "nameEn": "Suhayb Ar-Rumi"
  },
  "suhayl-ibn-amr": {
    "start": 202,
    "end": 206,
    "nameEn": "Suhayl Ibn Amr"
  },
  "talhah-ibn-ubaydullah": {
    "start": 207,
    "end": 211,
    "nameEn": "Talhah ibn Ubaydullah"
  },
  "thabit-ibn-qays": {
    "start": 212,
    "end": 214,
    "nameEn": "Thabit Ibn Qays"
  },
  "thumamah-ibn-uthal": {
    "start": 215,
    "end": 218,
    "nameEn": "Thumamah Ibn Uthal"
  },
  "ubayy-ibn-kab": {
    "start": 219,
    "end": 221,
    "nameEn": "Ubayy Ibn Kab"
  },
  "umayr-ibn-sad": {
    "start": 222,
    "end": 228,
    "nameEn": "Umayr Ibn Sad Al-Ansari"
  },
  "umayr-ibn-wahb": {
    "start": 229,
    "end": 232,
    "nameEn": "Umayr Ibn Wahb"
  },
  "umm-salamah": {
    "start": 233,
    "end": 236,
    "nameEn": "Umm Salamah"
  },
  "uqbah-ibn-amir": {
    "start": 237,
    "end": 240,
    "nameEn": "Uqbah Ibn Amir"
  },
  "utbah-ibn-ghazwan": {
    "start": 241,
    "end": 244,
    "nameEn": "Utbah Ibn Ghazwan"
  },
  "zayd-al-khayr": {
    "start": 245,
    "end": 248,
    "nameEn": "Zayd Al-Khayr"
  },
  "zayd-ibn-thabit": {
    "start": 249,
    "end": 251,
    "nameEn": "Zayd ibn Thabit"
  }
} as const;

export function sahabahPdfUrl(page?: number): string {
  const base = SAHABAH_PDF.publicPath;
  if (!page || page < 1) return base;
  return `${base}#page=${page}`;
}

/** Ordered roster metadata generated with chapter extract. */
export const SAHABAH_ROSTER_META = [
  {
    "slug": "abbad-ibn-bishr",
    "nameEn": "Abbad Ibn Bishr",
    "nameAr": "عباد بن بشر",
    "honorificEn": "may Allah be pleased with him",
    "honorificAr": "رضي الله عنه",
    "summaryEn": "Biography It was the fourth year after the Hijrah. The city of the Prophet was still under threat from within and without. From within.",
    "sortOrder": 1,
    "female": false
  },
  {
    "slug": "abdullah-ibn-abbas",
    "nameEn": "Abdullah Ibn Abbas",
    "nameAr": "عبد الله بن عباس",
    "honorificEn": "may Allah be pleased with him",
    "honorificAr": "رضي الله عنه",
    "summaryEn": "Biography Abdullah was the son of Abbas, an uncle of the noble Prophet. He was born just three years before the Hijrah.",
    "sortOrder": 2,
    "female": false
  },
  {
    "slug": "abdullah-ibn-hudhafah",
    "nameEn": "Abdullah Ibn Hudhafah As-Sahmi",
    "nameAr": "عبد الله بن حذافة السهمي",
    "honorificEn": "may Allah be pleased with him",
    "honorificAr": "رضي الله عنه",
    "summaryEn": "Abdullah Ibn Hudhafah As-Sahmi History would have by-passed this man as it had by- passed thousands of Arabs before him.",
    "sortOrder": 3,
    "female": false
  },
  {
    "slug": "abdullah-ibn-jahsh",
    "nameEn": "Abdullah Ibn Jahsh",
    "nameAr": "عبد الله بن جحش",
    "honorificEn": "may Allah be pleased with him",
    "honorificAr": "رضي الله عنه",
    "summaryEn": "Biography Abdullah ibn Jahsh was a cousin of the Prophet and his sister, Zaynab bint Jahsh, was a wife of the Prophet.",
    "sortOrder": 4,
    "female": false
  },
  {
    "slug": "abdullah-ibn-masud",
    "nameEn": "Abdullah Ibn Mas'ud",
    "nameAr": "عبد الله بن مسعود",
    "honorificEn": "may Allah be pleased with him",
    "honorificAr": "رضي الله عنه",
    "summaryEn": "Biography When he was still a youth, not yet past the age of puberty, he used to roam the mountain trails of Makkah far away from people, tending the flocks of…",
    "sortOrder": 5,
    "female": false
  },
  {
    "slug": "abdullah-ibn-sailam",
    "nameEn": "Abdullah Ibn Sailam",
    "nameAr": "عبد الله بن سلام",
    "honorificEn": "may Allah be pleased with him",
    "honorificAr": "رضي الله عنه",
    "summaryEn": "Biography Al-Husayn ibn Sailam was a Jewish rabbi in Yathrib who was widely respected and honoured by the people of the city even by those who were not Jewish.",
    "sortOrder": 6,
    "female": false
  },
  {
    "slug": "abdullah-ibn-umar",
    "nameEn": "Abdullah Ibn Umar",
    "nameAr": "عبد الله بن عمر",
    "honorificEn": "may Allah be pleased with him",
    "honorificAr": "رضي الله عنه",
    "summaryEn": "Biography At Shaykhan, halfway between Madinah and Uhud, the thousand strong Muslim army led by the Prophet stopped.",
    "sortOrder": 7,
    "female": false
  },
  {
    "slug": "abdullah-ibn-umm-maktum",
    "nameEn": "Abdullah Ibn Umm Maktum",
    "nameAr": "عبد الله بن أم مكتوم",
    "honorificEn": "may Allah be pleased with him",
    "honorificAr": "رضي الله عنه",
    "summaryEn": "Biography Abdullah ibn Umm Maktum was a cousin of Khadijah bint Khuwaylid, Mother of the Believers, may God be pleased with her.",
    "sortOrder": 8,
    "female": false
  },
  {
    "slug": "abdur-rahman-ibn-awf",
    "nameEn": "Abdur-Rahman Ibn Awf",
    "nameAr": "عبد الرحمن بن عوف",
    "honorificEn": "may Allah be pleased with him",
    "honorificAr": "رضي الله عنه",
    "summaryEn": "Biography He was one of the first eight persons to accept Islam. He was one of the ten persons (al-asharatu-l mubashshirin) who were assured of entering Paradis…",
    "sortOrder": 9,
    "female": false
  },
  {
    "slug": "abu-ayyub-al-ansari",
    "nameEn": "Abu Ayyub Al-Ansari",
    "nameAr": "أبو أيوب الأنصاري",
    "honorificEn": "may Allah be pleased with him",
    "honorificAr": "رضي الله عنه",
    "summaryEn": "Biography Khalid ibn Zayd ibn Kulayb from the Banu Najjar was a great and close companion of the Prophet.",
    "sortOrder": 10,
    "female": false
  },
  {
    "slug": "abu-dharr-al-ghifari",
    "nameEn": "Abu Dharr Al-Ghifari",
    "nameAr": "أبو ذر الغفاري",
    "honorificEn": "may Allah be pleased with him",
    "honorificAr": "رضي الله عنه",
    "summaryEn": "Biography Scanned from \"Companions of The Prophet\", Vol. 1, By: Abdul Wahid Hamid.",
    "sortOrder": 11,
    "female": false
  },
  {
    "slug": "abu-musa-al-ashari",
    "nameEn": "Abu Musa Al-Ashari",
    "nameAr": "أبو موسى الأشعري",
    "honorificEn": "may Allah be pleased with him",
    "honorificAr": "رضي الله عنه",
    "summaryEn": "Biography When he went to Basrah as governor of the city, he called the inhabitants to a meeting and addressed them: \"The Amir al-Muminin, Umar, has sent me to…",
    "sortOrder": 12,
    "female": false
  },
  {
    "slug": "abu-hurayrah",
    "nameEn": "Abu Hurayrah",
    "nameAr": "أبو هريرة",
    "honorificEn": "may Allah be pleased with him",
    "honorificAr": "رضي الله عنه",
    "summaryEn": "Biography \"An Abi Hurayrata, radiyallahu anhu, qal.' qala rasul Allahi, sallallahu alayhi wa sailam...\" Through this phrase millions of Muslims from the early h…",
    "sortOrder": 13,
    "female": false
  },
  {
    "slug": "abu-sufyan-ibn-al-harith",
    "nameEn": "Abu Sufyan Ibn Al-Harith",
    "nameAr": "أبو سفيان بن الحارث",
    "honorificEn": "may Allah be pleased with him",
    "honorificAr": "رضي الله عنه",
    "summaryEn": "Biography Rarely can one find a closer bond between two persons such as existed between Muhammad the son of Abdullah and Abu Sufyan the son of al-Harith.",
    "sortOrder": 14,
    "female": false
  },
  {
    "slug": "abu-ubaydah-ibn-al-jarrah",
    "nameEn": "Abu Ubaydah Ibn Al-Jarrah",
    "nameAr": "أبو عبيدة بن الجراح",
    "honorificEn": "may Allah be pleased with him",
    "honorificAr": "رضي الله عنه",
    "summaryEn": "Biography His appearance was striking. He was slim and tall. His face was bright and he had a sparse beard.",
    "sortOrder": 15,
    "female": false
  },
  {
    "slug": "abu-darda",
    "nameEn": "Abu-d Dardaa",
    "nameAr": "أبو الدرداء",
    "honorificEn": "may Allah be pleased with him",
    "honorificAr": "رضي الله عنه",
    "summaryEn": "Biography Early in the morning, Abu-d Dardaa awoke and went straight to his idol which he kept in the best part of his house.",
    "sortOrder": 16,
    "female": false
  },
  {
    "slug": "abu-l-aas",
    "nameEn": "Abu-l Aas ibn ar-Rabiah",
    "nameAr": "أبو العاص بن الربيع",
    "honorificEn": "may Allah be pleased with him",
    "honorificAr": "رضي الله عنه",
    "summaryEn": "Biography Abu-l Aas belonged to the Abd ash-Shams clan of the Quraysh. He was in the prime of his youth, handsome and very impressive looking.",
    "sortOrder": 17,
    "female": false
  },
  {
    "slug": "adiyy-ibn-hatim",
    "nameEn": "Adiyy Ibn Hatim",
    "nameAr": "عدي بن حاتم",
    "honorificEn": "may Allah be pleased with him",
    "honorificAr": "رضي الله عنه",
    "summaryEn": "Biography In the ninth year of the Hijrah, an Arab king made the first positive moves to Islam after years of feeling hatred for it.",
    "sortOrder": 18,
    "female": false
  },
  {
    "slug": "aishah",
    "nameEn": "Aishah Bint Abi Bakr",
    "nameAr": "عائشة بنت أبي بكر",
    "honorificEn": "may Allah be pleased with her",
    "honorificAr": "رضي الله عنها",
    "summaryEn": "Biography The life of Aishah is proof that a woman can be far more learned than men and that she can be the teacher of scholars and experts.",
    "sortOrder": 19,
    "female": true
  },
  {
    "slug": "al-baraa-ibn-malik",
    "nameEn": "Al-Baraa Ibn Malik Al-Ansari",
    "nameAr": "البراء بن مالك الأنصاري",
    "honorificEn": "may Allah be pleased with him",
    "honorificAr": "رضي الله عنه",
    "summaryEn": "Al-Baraa Ibn Malik Al-Ansari His hair looked dishevelled and his whole appearance was unkempt.",
    "sortOrder": 20,
    "female": false
  },
  {
    "slug": "amr-ibn-al-jamuh",
    "nameEn": "Amr Ibn Al-Jamuh",
    "nameAr": "عمرو بن الجموح",
    "honorificEn": "may Allah be pleased with him",
    "honorificAr": "رضي الله عنه",
    "summaryEn": "Biography Amr ibn al-Jamuh was one of the leading men in Yathrib in the days of Jahiliyyah.",
    "sortOrder": 21,
    "female": false
  },
  {
    "slug": "an-nuayman-ibn-amr",
    "nameEn": "An-Nuayman Ibn Amr",
    "nameAr": "النعيمان بن عمرو",
    "honorificEn": "may Allah be pleased with him",
    "honorificAr": "رضي الله عنه",
    "summaryEn": "Biography In spite of the fact that he fought in the battles of Badr, Uhud, Khandaq and other major encounters, an- Nuayman remained a light-hearted person who…",
    "sortOrder": 22,
    "female": false
  },
  {
    "slug": "an-numan-ibn-muqarrin",
    "nameEn": "An-Numan Ibn Muqarrin",
    "nameAr": "النعمان بن مقرن",
    "honorificEn": "may Allah be pleased with him",
    "honorificAr": "رضي الله عنه",
    "summaryEn": "Biography The tribe of Muzaynah had their habitations some distance from Yathrib on the caravan route which linked the city to Makkah.",
    "sortOrder": 23,
    "female": false
  },
  {
    "slug": "at-tufayl-ibn-amr",
    "nameEn": "At-Tufayl Ibn Amr Ad-Dawsi",
    "nameAr": "الطفيل بن عمرو الدوسي",
    "honorificEn": "may Allah be pleased with him",
    "honorificAr": "رضي الله عنه",
    "summaryEn": "Biography At-Tufayl ibn Amr ad-Dawsi At-Tufayl ibn Amr was the chief of the Daws tribe in preQuranic times and a distinguished Arab notable known for his manly…",
    "sortOrder": 24,
    "female": false
  },
  {
    "slug": "asmaa-bint-abu-bakr",
    "nameEn": "Asmaa Bint Abu Bakr",
    "nameAr": "أسماء بنت أبي بكر",
    "honorificEn": "may Allah be pleased with her",
    "honorificAr": "رضي الله عنها",
    "summaryEn": "Biography Asmaa bint Abu Bakr belonged to a distinguished Muslim family. Her father, Abu Bakr, was a close friend of the Prophet and the first Khalifah after hi…",
    "sortOrder": 25,
    "female": true
  },
  {
    "slug": "barakah",
    "nameEn": "Barakah",
    "nameAr": "بركة",
    "honorificEn": "may Allah be pleased with her",
    "honorificAr": "رضي الله عنها",
    "summaryEn": "Biography We do not know precisely how the young Abyssinian girl ended up for sale in Makkah.",
    "sortOrder": 26,
    "female": true
  },
  {
    "slug": "fatimah-bint-muhammad",
    "nameEn": "Fatimah Bint Muhammad",
    "nameAr": "فاطمة بنت محمد",
    "honorificEn": "may Allah be pleased with her",
    "honorificAr": "رضي الله عنها",
    "summaryEn": "Biography Fatimah was the fifth child of Muhammad and Khadijah. She was born at a time when her noble father had begun to spend long periods in the solitude of…",
    "sortOrder": 27,
    "female": true
  },
  {
    "slug": "fayruz-ad-daylami",
    "nameEn": "Fayruz Ad-Daylami",
    "nameAr": "فيروز الديلمي",
    "honorificEn": "may Allah be pleased with him",
    "honorificAr": "رضي الله عنه",
    "summaryEn": "Biography When the Prophet, peace be on him, returned to Madinah from the Farewell Pilgrimage in the tenth year after the Hijrah, he fell ill, News of his illne…",
    "sortOrder": 28,
    "female": false
  },
  {
    "slug": "habib-ibn-zayd",
    "nameEn": "Habib Ibn Zayd Al-Ansari",
    "nameAr": "حبيب بن زيد الأنصاري",
    "honorificEn": "may Allah be pleased with him",
    "honorificAr": "رضي الله عنه",
    "summaryEn": "Habib Ibn Zayd Al-Ansari He grew up in a home filled with the fragrance of iman, and in a family where everyone was imbued with the spirit of sacrifice.",
    "sortOrder": 29,
    "female": false
  },
  {
    "slug": "hakim-ibn-hazm",
    "nameEn": "Hakim Ibn Hazm",
    "nameAr": "حكيم بن حزام",
    "honorificEn": "may Allah be pleased with him",
    "honorificAr": "رضي الله عنه",
    "summaryEn": "Biography History has recorded that he is the only person who was born inside the Kabah itself.",
    "sortOrder": 30,
    "female": false
  },
  {
    "slug": "hudhayfah-ibn-al-yaman",
    "nameEn": "Hudhayfah Ibn Al-Yaman",
    "nameAr": "حذيفة بن اليمان",
    "honorificEn": "may Allah be pleased with him",
    "honorificAr": "رضي الله عنه",
    "summaryEn": "Biography \"If you wish you may consider yourself among the Muhajirin or, if you wish, you may consider yourself one of the Ansar.",
    "sortOrder": 31,
    "female": false
  },
  {
    "slug": "ikrimah-ibn-abi-jahl",
    "nameEn": "Ikrimah Ibn Abi Jahl",
    "nameAr": "عكرمة بن أبي جهل",
    "honorificEn": "may Allah be pleased with him",
    "honorificAr": "رضي الله عنه",
    "summaryEn": "Biography He was at the end of the third decade of his life on the day the Prophet made public his call to guidance and truth.",
    "sortOrder": 32,
    "female": false
  },
  {
    "slug": "jafar-ibn-abi-talib",
    "nameEn": "Jafar Ibn Abi Talib",
    "nameAr": "جعفر بن أبي طالب",
    "honorificEn": "may Allah be pleased with him",
    "honorificAr": "رضي الله عنه",
    "summaryEn": "Biography In spite of his noble standing among the Quraysh, Abu Talib, an uncle of the Prophet, was quite poor.",
    "sortOrder": 33,
    "female": false
  },
  {
    "slug": "julaybib",
    "nameEn": "Julaybib",
    "nameAr": "جليبب",
    "honorificEn": "may Allah be pleased with him",
    "honorificAr": "رضي الله عنه",
    "summaryEn": "Biography His name was unusual and incomplete. Julaybib means \"small grown\" being the diminutive form of the word \"Jalbab \".",
    "sortOrder": 34,
    "female": false
  },
  {
    "slug": "khabbab-ibn-al-aratt",
    "nameEn": "Khabbab Ibn Al-Aratt",
    "nameAr": "خباب بن الأرت",
    "honorificEn": "may Allah be pleased with him",
    "honorificAr": "رضي الله عنه",
    "summaryEn": "Biography Scanned from Companions of The Prophet, Vol. 1, By: Abdul Wahid Hamid A woman named Umm Anmaar who belonged to the Khuza'a tribe in Makkah went to the…",
    "sortOrder": 35,
    "female": false
  },
  {
    "slug": "muadh-ibn-jabal",
    "nameEn": "Muadh Ibn Jabal",
    "nameAr": "معاذ بن جبل",
    "honorificEn": "may Allah be pleased with him",
    "honorificAr": "رضي الله عنه",
    "summaryEn": "Biography Muadh ibn Jabal was a young man growing up in Yathrib as the light of guidance and truth began to spread over the Arabian peninsula.",
    "sortOrder": 36,
    "female": false
  },
  {
    "slug": "muhammad-ibn-maslamah",
    "nameEn": "Muhammad Ibn Maslamah",
    "nameAr": "محمد بن مسلمة",
    "honorificEn": "may Allah be pleased with him",
    "honorificAr": "رضي الله عنه",
    "summaryEn": "Biography Black, tall and sturdy, Muhammad ibn Maslamah towered above his contemporaries.",
    "sortOrder": 37,
    "female": false
  },
  {
    "slug": "musab-ibn-umayr",
    "nameEn": "Musab Ibn Umayr",
    "nameAr": "مصعب بن عمير",
    "honorificEn": "may Allah be pleased with him",
    "honorificAr": "رضي الله عنه",
    "summaryEn": "Biography Musab ibn Umayr was born and grew up in the lap of affluence and luxury. His rich parents lavished a great deal of care and attention on him.",
    "sortOrder": 38,
    "female": false
  },
  {
    "slug": "nuaym-ibn-masud",
    "nameEn": "Nuaym Ibn Masud",
    "nameAr": "نعيم بن مسعود",
    "honorificEn": "may Allah be pleased with him",
    "honorificAr": "رضي الله عنه",
    "summaryEn": "Biography Nuaym ibn Masud was from Najd in the northern highlands of Arabia. He belonged to the powerful Ghatafan tribe.",
    "sortOrder": 39,
    "female": false
  },
  {
    "slug": "rabiah-ibn-kab",
    "nameEn": "Rabiah Ibn Kab",
    "nameAr": "ربيعة بن كعب",
    "honorificEn": "may Allah be pleased with him",
    "honorificAr": "رضي الله عنه",
    "summaryEn": "Biography Here is the story of Rabiah told in his own words: \"I was still quite young when the light of iman shone through me and my heart was opened to the tea…",
    "sortOrder": 40,
    "female": false
  },
  {
    "slug": "ramlah-bint-abi-sufyan",
    "nameEn": "Ramlah Bint Abi Sufyan",
    "nameAr": "رملة بنت أبي سفيان",
    "honorificEn": "may Allah be pleased with her",
    "honorificAr": "رضي الله عنها",
    "summaryEn": "Biography Abu Sufyan ibn Harb could not conceive of anyone among the Quraysh who would dare challenge his authority or go against his orders.",
    "sortOrder": 41,
    "female": true
  },
  {
    "slug": "rumaysa-bint-milhan",
    "nameEn": "Rumaysa Bint Milhan",
    "nameAr": "رميصة بنت ملحان",
    "honorificEn": "may Allah be pleased with her",
    "honorificAr": "رضي الله عنها",
    "summaryEn": "Biography Even before Islam was introduced to Yathrib, Rumaysa was known for her excellent character, the power of her intellect and her independent attitude of…",
    "sortOrder": 42,
    "female": true
  },
  {
    "slug": "sad-ibn-abi-waqqas",
    "nameEn": "Sad Ibn Abi Waqqas",
    "nameAr": "سعد بن أبي وقاص",
    "honorificEn": "may Allah be pleased with him",
    "honorificAr": "رضي الله عنه",
    "summaryEn": "Biography We are now in a small town in a narrow valley. There is no vegetation, no livestock, no gardens, no rivers.",
    "sortOrder": 43,
    "female": false
  },
  {
    "slug": "said-ibn-aamir",
    "nameEn": "Said Ibn Aamir Al-Jumahi",
    "nameAr": "سعيد بن عامر الجمحي",
    "honorificEn": "may Allah be pleased with him",
    "honorificAr": "رضي الله عنه",
    "summaryEn": "Sa'id ibn Aamir Al-Jumahi Sa'id ibn Aamir al-Jumahi was one of thousands who left for the region of Tan'im on the outskirts of Makkah at the invitation of the Q…",
    "sortOrder": 44,
    "female": false
  },
  {
    "slug": "said-ibn-zayd",
    "nameEn": "Said Ibn Zayd",
    "nameAr": "سعيد بن زيد",
    "honorificEn": "may Allah be pleased with him",
    "honorificAr": "رضي الله عنه",
    "summaryEn": "Biography Zayd the son of Amr stood away from the Quraysh crowd as they celebrated one of their festivals.",
    "sortOrder": 45,
    "female": false
  },
  {
    "slug": "salim-mawla-abi-hudhayfah",
    "nameEn": "Salim Mawla Abi Hudhayfah",
    "nameAr": "سالم مولى أبي حذيفة",
    "honorificEn": "may Allah be pleased with him",
    "honorificAr": "رضي الله عنه",
    "summaryEn": "Biography In giving advice to his companions, the noble Prophet, peace be on him, once said: \"Learn the Quran from four persons: Abdullah ibn Masud, Salim Mawla…",
    "sortOrder": 46,
    "female": false
  },
  {
    "slug": "salman-al-farsi",
    "nameEn": "Salman Al-Farsi",
    "nameAr": "سلمان الفارسي",
    "honorificEn": "may Allah be pleased with him",
    "honorificAr": "رضي الله عنه",
    "summaryEn": "Biography This is a story of a seeker of Truth, the story of Salman the Persian, gleaned, to begin with, from his own words: I grew up in the town of Isfahan in…",
    "sortOrder": 47,
    "female": false
  },
  {
    "slug": "suhayb-ar-rumi",
    "nameEn": "Suhayb Ar-Rumi",
    "nameAr": "صهيب الرومي",
    "honorificEn": "may Allah be pleased with him",
    "honorificAr": "رضي الله عنه",
    "summaryEn": "Biography About twenty years before the start of the Prophet's mission, that is about the middle of the sixth century CE, an Arab named Sinan ibn Malik governed…",
    "sortOrder": 48,
    "female": false
  },
  {
    "slug": "suhayl-ibn-amr",
    "nameEn": "Suhayl Ibn Amr",
    "nameAr": "سهيل بن عمرو",
    "honorificEn": "may Allah be pleased with him",
    "honorificAr": "رضي الله عنه",
    "summaryEn": "Biography At the Battle of Badr, when Suhayl fell into the hands of the Muslims as a prisoner, Umar ibn al-Khattab came up to the Prophet and said: \"Messenger o…",
    "sortOrder": 49,
    "female": false
  },
  {
    "slug": "talhah-ibn-ubaydullah",
    "nameEn": "Talhah ibn Ubaydullah",
    "nameAr": "طلحة بن عبيد الله",
    "honorificEn": "may Allah be pleased with him",
    "honorificAr": "رضي الله عنه",
    "summaryEn": "Biography Returning to Makkah in haste after a trading trip to Syria, Talhah asked his family: \"Did anything happen in Makkah since we left?\" \"Yes,\" they replie…",
    "sortOrder": 50,
    "female": false
  },
  {
    "slug": "thabit-ibn-qays",
    "nameEn": "Thabit Ibn Qays",
    "nameAr": "ثابت بن قيس",
    "honorificEn": "may Allah be pleased with him",
    "honorificAr": "رضي الله عنه",
    "summaryEn": "Biography Thabit ibn Qays was a chieftain of the Khazraj and therefore a man of considerable influence in Yathrib.",
    "sortOrder": 51,
    "female": false
  },
  {
    "slug": "thumamah-ibn-uthal",
    "nameEn": "Thumamah Ibn Uthal",
    "nameAr": "ثمامة بن أثال",
    "honorificEn": "may Allah be pleased with him",
    "honorificAr": "رضي الله عنه",
    "summaryEn": "Biography In the sixth year after the hiCrah, the Prophet, may the blessings of God be on him, decided to expand the scope of his mission.",
    "sortOrder": 52,
    "female": false
  },
  {
    "slug": "ubayy-ibn-kab",
    "nameEn": "Ubayy Ibn Kab",
    "nameAr": "أبي بن كعب",
    "honorificEn": "may Allah be pleased with him",
    "honorificAr": "رضي الله عنه",
    "summaryEn": "Biography \"O Abu Mundhir! Which verse of the Book of God is the greatest?\" asked the Messenger of God, may God bless him and grant him peace.",
    "sortOrder": 53,
    "female": false
  },
  {
    "slug": "umayr-ibn-sad",
    "nameEn": "Umayr Ibn Sad Al-Ansari",
    "nameAr": "عمير بن سعد الأنصاري",
    "honorificEn": "may Allah be pleased with him",
    "honorificAr": "رضي الله عنه",
    "summaryEn": "Umayr ibn Sad al-Ansari Umayr ibn Sad became an orphan at an early age. His father died leaving him and his mother poor and destitute.",
    "sortOrder": 54,
    "female": false
  },
  {
    "slug": "umayr-ibn-wahb",
    "nameEn": "Umayr Ibn Wahb",
    "nameAr": "عمير بن وهب",
    "honorificEn": "may Allah be pleased with him",
    "honorificAr": "رضي الله عنه",
    "summaryEn": "Biography Umayr ibn Wahb al-Jumahi returned safely from the Battle of~Badr. His son, Wahb, was left behind, a prisoner in the hands of the Muslims.",
    "sortOrder": 55,
    "female": false
  },
  {
    "slug": "umm-salamah",
    "nameEn": "Umm Salamah",
    "nameAr": "أم سلمة",
    "honorificEn": "may Allah be pleased with her",
    "honorificAr": "رضي الله عنها",
    "summaryEn": "Biography Umm Salamah! What an eventful life she had! Her real name was Hind. She was the daughter of one of the notables in the Makhzum clan nicknamed \"Zad ar-…",
    "sortOrder": 56,
    "female": true
  },
  {
    "slug": "uqbah-ibn-amir",
    "nameEn": "Uqbah Ibn Amir",
    "nameAr": "عقبة بن عامر",
    "honorificEn": "may Allah be pleased with him",
    "honorificAr": "رضي الله عنه",
    "summaryEn": "Biography After a long and exhausting journey, the Prophet, peace be on him, is at last on the outskirts of Yathrib.",
    "sortOrder": 57,
    "female": false
  },
  {
    "slug": "utbah-ibn-ghazwan",
    "nameEn": "Utbah Ibn Ghazwan",
    "nameAr": "عتبة بن غزوان",
    "honorificEn": "may Allah be pleased with him",
    "honorificAr": "رضي الله عنه",
    "summaryEn": "Biography Umar ibn al-Kattab, the head of the rapidly expanding Muslim State went to bed early just after the Salat al-Isha.",
    "sortOrder": 58,
    "female": false
  },
  {
    "slug": "zayd-al-khayr",
    "nameEn": "Zayd Al-Khayr",
    "nameAr": "زيد الخير",
    "honorificEn": "may Allah be pleased with him",
    "honorificAr": "رضي الله عنه",
    "summaryEn": "Biography People are made up of basic \"metals\" or qualities. The best of them in JahilEyyah are the best of them in Islam, according to a hadith of the Prophet.…",
    "sortOrder": 59,
    "female": false
  },
  {
    "slug": "zayd-ibn-thabit",
    "nameEn": "Zayd ibn Thabit",
    "nameAr": "زيد بن ثابت",
    "honorificEn": "may Allah be pleased with him",
    "honorificAr": "رضي الله عنه",
    "summaryEn": "Biography We are in the second year of the Hijrah. Madinah the city of the Prophet is buzzing with activity as the Muslims prepare for the long march southwards…",
    "sortOrder": 60,
    "female": false
  }
] as const;
