import type { AuthenticityGrade, SectionSlug } from '../types/catalog';

export interface PodcastSegment {
  id: string;
  speaker: 'Host A (Scholar)' | 'Host B (Learner)';
  text: string;
  textAr?: string;
  startMs: number;
  endMs: number;
}

export interface FeaturedStory {
  id: string;
  sectionSlug: SectionSlug;
  title: string;
  titleAr: string;
  scholarSpeaker: string;
  originalNarrationUrl: string;
  category: string;
  theme: string;
  durationLabel: string;
  durationMs: number;
  audioUrl?: string | null;
  authenticityGrade: AuthenticityGrade | 'athar';
  sourceCitation: string;
  summary: string;
  fullText: string;
  keyTakeaways: string[];
  podcastOverview: PodcastSegment[];
}

export const baqiyyIbnMakhladStory: FeaturedStory = {
  id: 'baqiyy-ibn-makhlad-imam-ahmad',
  sectionSlug: 'gleanings',
  title: 'Baqiyy ibn Makhlad & Imam Ahmad ibn Hanbal',
  titleAr: 'بقي بن مخلد والإمام أحمد بن حنبل',
  scholarSpeaker: 'Shaykh Saleh Ale ash-Shaykh',
  originalNarrationUrl: 'https://youtu.be/kexPDupLh0Y',
  category: 'Gleanings (Tabi’un & Successors / Historical Narrations)',
  theme: 'Patience in Seeking Knowledge & Visiting the Sick',
  durationLabel: '7:40',
  durationMs: 460000,
  authenticityGrade: 'athar',
  sourceCitation: 'Siyar A’lam al-Nubala (Al-Dhahabi); Tartib al-Madaarik',
  summary:
    'Imam Baqiyy ibn Makhlad traveled on foot from Andalusia (Spain) to Baghdad to learn from Imam Ahmad during his house arrest. Disguised as a beggar, he received one Hadith every day, demonstrating unmatched devotion to sacred knowledge.',
  fullText:
    'Imam Baqiyy ibn Makhlad al-Andalusi traveled on foot thousands of miles from Cordoba to Baghdad with the sole dream of hearing Hadith from Imam Ahmad ibn Hanbal. Upon his arrival in Baghdad, he discovered that Imam Ahmad had been banned by the ruler from teaching or speaking in public.\n\nUndeterred, Baqiyy visited Imam Ahmad in secret. Disguised in the garments of a street beggar, Baqiyy would knock on Imam Ahmad’s door each morning calling out for charity. Imam Ahmad would step out and dictate one or two authentic Hadith to him, which Baqiyy carefully recorded in his sleeve.\n\nYears later, when Imam Ahmad was cleared and held assemblies with thousands of students, whenever Baqiyy entered the mosque, Imam Ahmad would honor him, sit him beside him, and tell his students: “This is a true seeker of knowledge.” When Baqiyy fell ill in Baghdad, Imam Ahmad visited him accompanied by his students, inspiring awe across the entire neighborhood.',
  keyTakeaways: [
    'Unshakable sacrifice and patience in seeking authentic Islamic knowledge.',
    'Creative resilience when facing hardship and restriction.',
    'The profound sunnah of honoring scholars and visiting the sick.',
  ],
  podcastOverview: [
    {
      id: 'p1',
      speaker: 'Host A (Scholar)',
      text: 'Assalamu Alaikum and welcome back. Today we examine one of the most astonishing journeys in Islamic intellectual history: the story of Imam Baqiyy ibn Makhlad.',
      textAr: 'السلام عليكم ورحمة الله. نصل اليوم إلى واحدة من أعجب الرحلات في تاريخ طلب العلم.',
      startMs: 0,
      endMs: 12000,
    },
    {
      id: 'p2',
      speaker: 'Host B (Learner)',
      text: 'Wa Alaikum Assalam! What makes his story so unique compared to other travelers of Hadith?',
      textAr: 'وعليكم السلام! ما الذي يجعل قصته فريدة مقارنة بغيره من رحالة الحديث؟',
      startMs: 12000,
      endMs: 22000,
    },
    {
      id: 'p3',
      speaker: 'Host A (Scholar)',
      text: 'Baqiyy walked on foot all the way from Cordoba in Andalusia to Baghdad — a journey of thousands of miles — only to find Imam Ahmad under strict house arrest.',
      textAr: 'مشى بقي على قدميه من قرطبة في الأندلس إلى بغداد، فقط ليجد الإمام أحمد تحت الإقامة الجبرية.',
      startMs: 22000,
      endMs: 38000,
    },
    {
      id: 'p4',
      speaker: 'Host B (Learner)',
      text: 'SubhanAllah! How did he manage to learn from him if public teaching was forbidden?',
      textAr: 'سبحان الله! كيف استطاع التعلم منه إذا كان التدريس ممنوعاً؟',
      startMs: 38000,
      endMs: 50000,
    },
    {
      id: 'p5',
      speaker: 'Host A (Scholar)',
      text: 'He disguised himself as a beggar every morning, knocked on Imam Ahmad’s door, and received one Hadith dictation per day written on paper hidden inside his sleeve.',
      textAr: 'تنكر بزي سائل ومسكين، يطرق باب الإمام أحمد يومياً ليتلقى حديثاً واحداً يكتبه في كمه.',
      startMs: 50000,
      endMs: 68000,
    },
  ],
};

export const featuredStoriesList: FeaturedStory[] = [
  baqiyyIbnMakhladStory,
  {
    id: 'uways-al-qarni-pearl',
    sectionSlug: 'gleanings',
    title: 'Uways al-Qarni & The Honor of Parents',
    titleAr: 'أويس القرني وبر الوالدين',
    scholarSpeaker: 'Dr. Umar Suleiman',
    originalNarrationUrl: 'https://youtu.be/kexPDupLh0Y',
    category: 'Gleanings (Tabi’un & Successors)',
    theme: 'Sincerity & Filial Piety',
    durationLabel: '5:20',
    durationMs: 320000,
    authenticityGrade: 'sahih',
    sourceCitation: 'Sahih Muslim 2542',
    summary:
      'The best of the Tabi’un who was unseen on earth but famous in the heavens due to his secret devotion to his elderly mother.',
    fullText:
      'Uways al-Qarni lived in Yemen and cared for his blind, elderly mother. Because of his devotion to her, he was unable to travel to Medina during the lifetime of Prophet Muhammad ﷺ. Yet the Prophet ﷺ foretold his arrival to Umar ibn al-Khattab and advised Umar to ask Uways to make du’a for him.',
    keyTakeaways: [
      'Hidden good deeds are often the heaviest on the scale.',
      'Sincere service to parents elevates one’s status with Allah above worldly fame.',
    ],
    podcastOverview: [
      {
        id: 'u1',
        speaker: 'Host A (Scholar)',
        text: 'Welcome to this deep dive into Uways al-Qarni, the man described by the Prophet ﷺ as the best of the Tabi’un.',
        startMs: 0,
        endMs: 10000,
      },
      {
        id: 'u2',
        speaker: 'Host B (Learner)',
        text: 'It is amazing that Caliph Umar ibn al-Khattab was told to seek du’a from a man who never met the Prophet in person!',
        startMs: 10000,
        endMs: 22000,
      },
    ],
  },
];
