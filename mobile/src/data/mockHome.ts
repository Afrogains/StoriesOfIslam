export type SectionSlug = 'qisas-al-anbiya' | 'seerah-shamail' | 'sahabah' | 'gleanings';
export type MediaFilter = 'all' | 'audio' | 'text';
export type AuthenticityGrade = 'sahih' | 'hasan' | 'athar' | 'historical';

export type HomeMetric = {
  id: 'listened' | 'streak' | 'favorites' | 'hours';
  label: string;
  value: string;
};

export type SectionMeta = {
  id: SectionSlug;
  title: string;
  titleAr: string;
  subtitle: string;
  description: string;
  countLabel: string;
  accentColor: string;
  bgTint: string;
  badgeBg: string;
  badgeText: string;
  conceptTagline: string;
  iconName: string;
  kidsTitle: string;
  kidsSubtitle: string;
};

export type StoryItem = {
  id: string;
  sectionSlug: SectionSlug;
  title: string;
  titleAr: string;
  figureName: string;
  figureNameAr?: string;
  honorific: string;
  honorificAr?: string;
  summary: string;
  content?: string;
  contentAr?: string;
  durationLabel: string;
  durationMs: number;
  authenticityGrade: AuthenticityGrade;
  sourceCitation: string;
  hasAudio: boolean;
  audioUrl?: string | null;
  artworkUrl?: string | null;
  timedCues?: { startMs: number; endMs: number; textEn: string; textAr: string }[];
  isFavorite?: boolean;
  keyTakeaway?: string;
};

export type KidsStoryCard = {
  id: string;
  sectionSlug: SectionSlug;
  title: string;
  titleAr: string;
  figureName: string;
  summary: string;
  lesson: string;
  durationLabel: string;
  badgeLabel: string;
  tint: 'sunset' | 'teal' | 'sky' | 'coral' | 'yellow';
  rewardStarCount: number;
};

export const sectionsMeta: Record<SectionSlug, SectionMeta> = {
  'qisas-al-anbiya': {
    id: 'qisas-al-anbiya',
    title: 'Prophets',
    titleAr: 'قصص الأنبياء',
    subtitle: 'Qisas al-Anbiya',
    description: 'Timeless accounts of the messengers of Allah, grounded in Quranic verses and authentic tafsir.',
    countLabel: '48 Stories',
    accentColor: '#0F766E',
    bgTint: '#E6F4F1',
    badgeBg: '#CCFBF1',
    badgeText: '#0F766E',
    conceptTagline: 'Prophetic Guidance & Firm Faith',
    iconName: 'BookOpen',
    kidsTitle: "Prophets' Adventures",
    kidsSubtitle: 'Brave messengers who trusted Allah',
  },
  'seerah-shamail': {
    id: 'seerah-shamail',
    title: 'Seerah & Shama’il',
    titleAr: 'السيرة والشمائل',
    subtitle: "Life & Noble Character",
    description: 'The luminous life, blessed character, and sublime manners of Prophet Muhammad ﷺ.',
    countLabel: '36 Stories',
    accentColor: '#D97706',
    bgTint: '#FEF8E8',
    badgeBg: '#FEF3C7',
    badgeText: '#92400E',
    conceptTagline: 'Noor, Mercy & Noble Character',
    iconName: 'Sparkles',
    kidsTitle: "Prophet's Kindness",
    kidsSubtitle: 'Gentle stories from the life of Prophet Muhammad ﷺ',
  },
  sahabah: {
    id: 'sahabah',
    title: 'Sahabah',
    titleAr: 'الصحابة الكرام',
    subtitle: 'The Companions',
    description: 'Inspiring accounts of devotion, courage, and loyalty from the noble companions.',
    countLabel: '12 Key Figures',
    accentColor: '#0284C7',
    bgTint: '#F0F9FF',
    badgeBg: '#E0F2FE',
    badgeText: '#0369A1',
    conceptTagline: 'Valor, Loyalty & Pillar Foundations',
    iconName: 'Users',
    kidsTitle: 'Brave Companions',
    kidsSubtitle: 'Heroic friends who stood for truth',
  },
  gleanings: {
    id: 'gleanings',
    title: 'Gleanings',
    titleAr: 'قبسات وسلف',
    subtitle: 'Successors & Predecessors',
    description: 'Pearls of wisdom, spiritual reflections, and moral deeds from the Tabi’un and early righteous predecessors.',
    countLabel: '24 Reflections',
    accentColor: '#C2410C',
    bgTint: '#FFF7ED',
    badgeBg: '#FFEDD5',
    badgeText: '#C2410C',
    conceptTagline: 'Wisdom, Contemplation & Actionable Moral',
    iconName: 'Library',
    kidsTitle: 'Gentle Wise Deeds',
    kidsSubtitle: 'Little habits that make Allah happy',
  },
};

export const homeMetrics: HomeMetric[] = [
  { id: 'listened', label: 'Stories Listened', value: '14' },
  { id: 'streak', label: 'Daily Streak', value: '8 Days' },
  { id: 'favorites', label: 'Saved Stories', value: '6' },
  { id: 'hours', label: 'Audio Hours', value: '4.2 h' },
];

export const dailyVerse = {
  textEn: 'Indeed, with hardship comes ease. So when you finish, still strive.',
  textAr: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا ﴿٦﴾ فَإِذَا فَرَغْتَ فَانصَبْ',
  source: 'Surah Ash-Sharh (94:6-7)',
  sectionRef: 'qisas-al-anbiya' as SectionSlug,
};

export const continueListening = {
  storyId: '20a1b2c3-d4e5-4060-8071-222222222001',
  sectionSlug: 'qisas-al-anbiya' as SectionSlug,
  title: 'Ibrahim and the Fire',
  titleAr: 'إبراهيم والنار',
  figureName: 'Ibrahim, peace be upon him',
  progress: 0.42,
  remainingLabel: '2 min remaining',
};

export const allStandardStories: StoryItem[] = [
  // Prophets
  {
    id: '20a1b2c3-d4e5-4060-8071-222222222001',
    sectionSlug: 'qisas-al-anbiya',
    title: 'Ibrahim and the Fire',
    titleAr: 'إبراهيم عليه السلام والنار',
    figureName: 'Ibrahim',
    figureNameAr: 'إبراهيم',
    honorific: 'peace be upon him',
    honorificAr: 'عليه السلام',
    summary: 'When Prophet Ibrahim called his people to tawhid, they cast him into a blazing fire. Allah commanded the fire to be coolness and peace.',
    durationLabel: '4:12',
    durationMs: 252000,
    authenticityGrade: 'sahih',
    sourceCitation: 'Ibn Kathir, Qisas al-Anbiya; Quran 21:69',
    hasAudio: true,
    isFavorite: true,
    keyTakeaway: 'Unwavering trust (Tawakkul) in Allah turns trial into safety.',
  },
  {
    id: 'prophet-musa-sea',
    sectionSlug: 'qisas-al-anbiya',
    title: 'Musa and the Parting of the Sea',
    titleAr: 'موسى عليه السلام وفلق البحر',
    figureName: 'Musa',
    figureNameAr: 'موسى',
    honorific: 'peace be upon him',
    honorificAr: 'عليه السلام',
    summary: 'Trapped between Pharaoh’s army and the Red Sea, Prophet Musa declared "Indeed with me is my Lord". The sea parted into safe paths.',
    durationLabel: '5:30',
    durationMs: 330000,
    authenticityGrade: 'sahih',
    sourceCitation: 'Tafsir Ibn Kathir; Quran 26:61-68',
    hasAudio: true,
    isFavorite: false,
    keyTakeaway: 'Certainty in Divine aid opens ways when all human paths seem closed.',
  },
  {
    id: 'prophet-yunus-whale',
    sectionSlug: 'qisas-al-anbiya',
    title: 'Yunus in the Belly of the Whale',
    titleAr: 'يونس عليه السلام في بطن الحوت',
    figureName: 'Yunus',
    figureNameAr: 'يونس',
    honorific: 'peace be upon him',
    honorificAr: 'عليه السلام',
    summary: 'In three layers of darkness, Prophet Yunus cried out the supplication of Tawhid and repentance, and Allah rescued him.',
    durationLabel: '3:45',
    durationMs: 225000,
    authenticityGrade: 'sahih',
    sourceCitation: 'Sahih al-Bukhari; Quran 21:87-88',
    hasAudio: true,
    isFavorite: true,
    keyTakeaway: 'The supplication of Dhu al-Nun is an everlasting key out of distress.',
  },

  // Seerah
  {
    id: 'first-revelation-hira',
    sectionSlug: 'seerah-shamail',
    title: 'The First Revelation at Hira',
    titleAr: 'بدء الوحي في غار حراء',
    figureName: 'Prophet Muhammad',
    figureNameAr: 'محمد',
    honorific: 'peace and blessings be upon him',
    honorificAr: 'صلى الله عليه وسلم',
    summary: 'In the solitude of Cave Hira, Jibril descended with the first words of the Quran: "Read in the name of your Lord who created."',
    durationLabel: '6:15',
    durationMs: 375000,
    authenticityGrade: 'sahih',
    sourceCitation: 'Sahih al-Bukhari 3; Sahih Muslim 160',
    hasAudio: true,
    isFavorite: true,
    keyTakeaway: 'Knowledge and divine light began with reflection and reading.',
  },
  {
    id: 'noble-character-humility',
    sectionSlug: 'seerah-shamail',
    title: 'The Character of the Prophet ﷺ: Gentleness & Humility',
    titleAr: 'شمائل النبوة: تواضعه ورحمته',
    figureName: 'Prophet Muhammad',
    figureNameAr: 'محمد',
    honorific: 'peace and blessings be upon him',
    honorificAr: 'صلى الله عليه وسلم',
    summary: 'Anas ibn Malik reported serving the Prophet ﷺ for ten years, during which he never heard a harsh word or reprimand.',
    durationLabel: '4:50',
    durationMs: 290000,
    authenticityGrade: 'sahih',
    sourceCitation: 'Shama’il al-Muhammadiyya (Al-Tirmidhi)',
    hasAudio: true,
    isFavorite: false,
    keyTakeaway: 'True leadership is defined by gentle patience and grace.',
  },

  // Sahabah
  {
    id: 'abu-bakr-cave-thawr',
    sectionSlug: 'sahabah',
    title: 'Abu Bakr in the Cave of Thawr',
    titleAr: 'أبو بكر الصديق في غار ثور',
    figureName: 'Abu Bakr al-Siddiq',
    figureNameAr: 'أبو بكر الصديق',
    honorific: 'may Allah be pleased with him',
    honorificAr: 'رضي الله عنه',
    summary: 'During the Hijrah, Abu Bakr protected the Prophet ﷺ in the cave. The Prophet reassured him: "Do not grieve; Allah is with us."',
    durationLabel: '5:10',
    durationMs: 310000,
    authenticityGrade: 'sahih',
    sourceCitation: 'Sahih al-Bukhari 3653; Quran 9:40',
    hasAudio: true,
    isFavorite: true,
    keyTakeaway: 'Unconditional friendship and loyalty in the face of peril.',
  },
  {
    id: 'umar-justice-night',
    sectionSlug: 'sahabah',
    title: 'Umar ibn al-Khattab and the Night Patrol',
    titleAr: 'عمر بن الخطاب وعساس الليل',
    figureName: 'Umar ibn al-Khattab',
    figureNameAr: 'عمر بن الخطاب',
    honorific: 'may Allah be pleased with him',
    honorificAr: 'رضي الله عنه',
    summary: 'Caliph Umar walked the streets of Medina at night to care for the needy himself, carrying flour sacks on his own back.',
    durationLabel: '4:40',
    durationMs: 280000,
    authenticityGrade: 'hasan',
    sourceCitation: 'Tarikh al-Tabari; Sifat al-Safwah',
    hasAudio: true,
    isFavorite: false,
    keyTakeaway: 'Sincere responsibility means serving others in secret.',
  },

  // Gleanings
  {
    id: 'uways-al-qarni-devotion',
    sectionSlug: 'gleanings',
    title: 'Uways al-Qarni: Devotion to His Mother',
    titleAr: 'أويس القرني وإحسانه لوالدته',
    figureName: 'Uways al-Qarni',
    figureNameAr: 'أويس القرني',
    honorific: 'may Allah have mercy on him',
    honorificAr: 'رحمه الله',
    summary: 'Though he never met the Prophet ﷺ in person, Uways was praised by the Messenger of Allah for his extraordinary devotion to his elderly mother.',
    durationLabel: '3:55',
    durationMs: 235000,
    authenticityGrade: 'sahih',
    sourceCitation: 'Sahih Muslim 2542',
    hasAudio: true,
    isFavorite: true,
    keyTakeaway: 'Devotion to parents can elevate a person to the highest ranks with Allah.',
  },
  {
    id: 'hasan-al-basri-reflection',
    sectionSlug: 'gleanings',
    title: 'Hasan al-Basri on the Passage of Time',
    titleAr: 'موعظة الحسن البصري في حقيقة العمر',
    figureName: 'Hasan al-Basri',
    figureNameAr: 'الحسن البصري',
    honorific: 'may Allah have mercy on him',
    honorificAr: 'رحمه الله',
    summary: 'The great successor reflected: "O child of Adam, you are but a sum of days; whenever a day passes, a portion of you departs."',
    durationLabel: '3:20',
    durationMs: 200000,
    authenticityGrade: 'hasan',
    sourceCitation: 'Hilyat al-Awliya (Abu Nu’aym)',
    hasAudio: true,
    isFavorite: false,
    keyTakeaway: 'Valuing every passing moment for good deeds.',
  },
];

export const kidsStories: KidsStoryCard[] = [
  {
    id: 'ibrahim-and-the-fire',
    sectionSlug: 'qisas-al-anbiya',
    title: 'Ibrahim and the Cool Fire',
    titleAr: 'إبراهيم والنار البرد',
    figureName: 'Prophet Ibrahim',
    summary: 'People were unkind to Ibrahim, peace be upon him. Allah protected him in the fire and turned it cool like a gentle breeze.',
    lesson: 'Trust Allah! He protects those who tell the truth and stay brave.',
    durationLabel: '2 min',
    badgeLabel: '⭐ Trust in Allah',
    tint: 'sunset',
    rewardStarCount: 3,
  },
  {
    id: 'the-first-revelation',
    sectionSlug: 'seerah-shamail',
    title: 'The Angel in the Cave',
    titleAr: 'إقرا في غار حراء',
    figureName: 'Prophet Muhammad ﷺ',
    summary: 'In a quiet cave, Angel Jibril asked Prophet Muhammad ﷺ to read. Learning and reading are sweet gifts from Allah.',
    lesson: 'Love reading! Every good word we learn brings us closer to Allah.',
    durationLabel: '2 min',
    badgeLabel: '✨ Love for Learning',
    tint: 'yellow',
    rewardStarCount: 3,
  },
  {
    id: 'abu-bakr-in-the-cave',
    sectionSlug: 'sahabah',
    title: 'Abu Bakr the Brave Friend',
    titleAr: 'الصديق في الغار',
    figureName: 'Abu Bakr',
    summary: 'Abu Bakr stayed with the Prophet ﷺ in a dark cave. He was peaceful and brave because he knew Allah was watching over them.',
    lesson: 'A true friend is kind, loyal, and brave when things feel hard.',
    durationLabel: '2 min',
    badgeLabel: '🛡️ True Loyalty',
    tint: 'sky',
    rewardStarCount: 3,
  },
  {
    id: 'uways-al-qarni-of-yemen',
    sectionSlug: 'gleanings',
    title: 'Kind Uways & His Mom',
    titleAr: 'بر أويس بأمه',
    figureName: 'Uways al-Qarni',
    summary: 'Uways took gentle care of his elderly mother every single day. Prophet Muhammad ﷺ praised his big, loving heart.',
    lesson: 'Be extra kind to your parents! Small acts of care are huge good deeds.',
    durationLabel: '2 min',
    badgeLabel: '💖 Kindness to Parents',
    tint: 'coral',
    rewardStarCount: 3,
  },
  {
    id: 'yunus-and-the-whale',
    sectionSlug: 'qisas-al-anbiya',
    title: 'Yunus & the Big Blue Whale',
    titleAr: 'يونس والحوت اللطيف',
    figureName: 'Prophet Yunus',
    summary: 'Inside the whale, Yunus made a gentle prayer to Allah. Allah heard his voice deep in the water and helped him land safely.',
    lesson: 'Always talk to Allah in your heart. He hears every quiet prayer!',
    durationLabel: '2 min',
    badgeLabel: '🌊 Gentle Prayer',
    tint: 'teal',
    rewardStarCount: 3,
  },
];

export const lessonOfTheDay = {
  lesson: 'A gentle smile is a gift of charity, and kind words spread light everywhere.',
  title: 'The Noble Manners of Prophet Muhammad ﷺ',
  sectionSlug: 'seerah-shamail' as SectionSlug,
};
