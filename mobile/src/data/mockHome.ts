export type MediaFilter = 'all' | 'audio' | 'text';

export type HomeMetric = {
  id: 'listened' | 'streak' | 'favorites' | 'hours';
  label: string;
  value: string;
};

export type QuickAccessItem = {
  id: 'qisas-al-anbiya' | 'seerah-shamail' | 'sahabah' | 'gleanings';
  title: string;
  subtitle: string;
  count: string;
};

export type ContinueListening = {
  storyId: string;
  title: string;
  titleAr: string;
  figureName: string;
  progress: number;
  remainingLabel: string;
};

export type KidsStoryCard = {
  id: string;
  title: string;
  titleAr: string;
  figureName: string;
  summary: string;
  lesson: string;
  durationLabel: string;
  tint: 'sunset' | 'teal' | 'sky' | 'coral';
};

export const homeMetrics: HomeMetric[] = [
  { id: 'listened', label: 'Stories Listened', value: '12' },
  { id: 'streak', label: 'Streak (Days)', value: '7' },
  { id: 'favorites', label: 'Saved Favorites', value: '5' },
  { id: 'hours', label: 'Audio Hours', value: '3.4' },
];

export const quickAccess: QuickAccessItem[] = [
  {
    id: 'qisas-al-anbiya',
    title: 'Prophets',
    subtitle: 'Qisas al-Anbiya',
    count: '48 stories',
  },
  {
    id: 'seerah-shamail',
    title: 'Seerah',
    subtitle: "Seerah & Shama'il",
    count: '36 stories',
  },
  {
    id: 'sahabah',
    title: 'Sahabah',
    subtitle: 'The Companions',
    count: '12 figures',
  },
  {
    id: 'gleanings',
    title: 'Gleanings',
    subtitle: 'Successors',
    count: '24 stories',
  },
];

export const dailyVerse = {
  textEn: 'Indeed, with hardship comes ease.',
  textAr: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا',
  source: 'Quran 94:6',
};

export const continueListening: ContinueListening = {
  storyId: '20a1b2c3-d4e5-4060-8071-222222222001',
  title: 'Ibrahim and the Fire',
  titleAr: 'إبراهيم والنار',
  figureName: 'Ibrahim, peace be upon him',
  progress: 0.42,
  remainingLabel: '2 min left',
};

export const kidsStories: KidsStoryCard[] = [
  {
    id: 'ibrahim-and-the-fire',
    title: 'Ibrahim and the Fire',
    titleAr: 'إبراهيم والنار',
    figureName: 'Ibrahim',
    summary:
      'People were unkind to Ibrahim, peace be upon him. Allah kept him safe in the fire. We trust Allah when things feel hard.',
    lesson: 'Trust Allah. He protects those who tell the truth.',
    durationLabel: '2 min',
    tint: 'sunset',
  },
  {
    id: 'the-first-revelation',
    title: 'The First Revelation',
    titleAr: 'بدء الوحي',
    figureName: 'Prophet Muhammad ﷺ',
    summary:
      'In a quiet cave, an angel asked the Prophet ﷺ to read. Learning and reading are gifts from Allah.',
    lesson: 'Love learning. Every good word we read can bring us closer to Allah.',
    durationLabel: '2 min',
    tint: 'teal',
  },
  {
    id: 'abu-bakr-in-the-cave',
    title: 'Abu Bakr in the Cave',
    titleAr: 'أبو بكر في الغار',
    figureName: 'Abu Bakr',
    summary:
      'Abu Bakr was a brave friend. He stayed with the Prophet ﷺ in a cave and was not afraid, because Allah was with them.',
    lesson: 'A true friend stays close and is brave for what is right.',
    durationLabel: '2 min',
    tint: 'sky',
  },
  {
    id: 'uways-al-qarni-of-yemen',
    title: 'Kind Uways',
    titleAr: 'أويس القرني',
    figureName: 'Uways al-Qarni',
    summary:
      'Uways lived far away and took gentle care of his mother. The Prophet ﷺ praised his kindness.',
    lesson: 'Be extra kind to your parents. Small care is a great deed.',
    durationLabel: '2 min',
    tint: 'coral',
  },
];

export const lessonOfTheDay = kidsStories[0];
