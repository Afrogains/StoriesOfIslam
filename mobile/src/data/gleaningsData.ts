export interface PodcastTimestampSegment {
  id: string;
  speaker: 'Host A' | 'Host B';
  textEn: string;
  textAr?: string;
  startMs: number;
  endMs: number;
}

export interface PodcastEpisode {
  storyId: string;
  title: string;
  titleAr: string;
  category: 'gleanings';
  youtubeUrl: string;
  scholarSpeaker: string;
  originalArabicText: string;
  translatedEnglishText: string;
  hostA_script: string[];
  hostB_script: string[];
  audioUrl: string;
  durationLabel: string;
  durationMs: number;
  authenticityGrade: 'sahih' | 'hasan' | 'athar';
  sourceCitation: string;
  summary: string;
  keyTakeaways: string[];
  timestamps: PodcastTimestampSegment[];
}

export const abdullahIbnMasudGleaning: PodcastEpisode = {
  storyId: 'abdullah-ibn-masud-knowledge-intention',
  title: 'Abdullah ibn Mas’ud on Knowledge & Intention',
  titleAr: 'عبد الله بن مسعود: فضل العلم وإخلاص النية',
  category: 'gleanings',
  youtubeUrl: 'https://youtu.be/kexPDupLh0Y',
  scholarSpeaker: 'Shaykh Saleh Ale ash-Shaykh',
  originalArabicText:
    'عَنْ عَبْدِ اللَّهِ بْنِ مَسْعُودٍ رَضِيَ اللَّهُ عَنْهُ قَالَ: "تَعَلَّمُوا، فَإِذَا عَلِمْتُمْ فَاعْمَلُوا؛ فَإِنَّمَا العَالِمُ مَنْ عَمِلَ بِمَا عَلِمَ، وَإِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ".',
  translatedEnglishText:
    'Abdullah ibn Mas’ud (may Allah be pleased with him) said: "Learn, and once you have acquired knowledge, put it into practice. For indeed, a scholar is only one who acts upon what he knows, and actions are judged solely by intentions."',
  summary:
    'A profound narration from the great Companion Abdullah ibn Mas’ud emphasizing that sacred knowledge is not mere academic memorization, but a living light that demands sincere intention and immediate practice.',
  keyTakeaways: [
    'Knowledge without action is an unfulfilled trust.',
    'Intention (Niyyah) transforms daily efforts into heavy spiritual worship.',
    'True Islamic scholarship is proved through humility and good deeds.',
  ],
  durationLabel: '5:30',
  durationMs: 330000,
  authenticityGrade: 'sahih',
  sourceCitation: 'Jami’ Bayan al-’Ilm wa Fadlihi (Ibn ’Abd al-Barr); Hilyat al-Awliya',
  audioUrl: 'https://cdn.storiesofislam.example/audio/gleanings/ibn-masud-intentions.mp3',
  hostA_script: [
    'Assalamu Alaikum and welcome to NotebookLM Gleanings. Today we explore a timeless statement by Abdullah ibn Mas’ud on the true weight of knowledge.',
    'Ibn Mas’ud explicitly connects learning with immediate action. In early Islamic tradition, knowledge was never separated from spiritual practice.',
    'Exactly. He warns us that without sincere intention, knowledge becomes a burden against a person rather than an intercessor for them.',
  ],
  hostB_script: [
    'Wa Alaikum Assalam! What strikes me about Ibn Mas’ud’s words is how direct he is: "Learn, and once you learn, act."',
    'So true scholarship isn’t measured by how many books someone has on their shelf, but how much sincerity manifests in their character?',
    'SubhanAllah. That turns the entire modern concept of passive learning on its head. It demands self-reflection at every step.',
  ],
  timestamps: [
    {
      id: 'ts-1',
      speaker: 'Host A',
      textEn:
        'Assalamu Alaikum and welcome to NotebookLM Gleanings. Today we explore a timeless statement by Abdullah ibn Mas’ud on the true weight of knowledge.',
      textAr: 'السلام عليكم ورحمة الله. نرحب بكم في حلقة جديدة عن موعظة عبد الله بن مسعود.',
      startMs: 0,
      endMs: 12000,
    },
    {
      id: 'ts-2',
      speaker: 'Host B',
      textEn:
        'Wa Alaikum Assalam! What strikes me about Ibn Mas’ud’s words is how direct he is: "Learn, and once you learn, act."',
      textAr: 'وعليكم السلام! ما يلفت النظر في كلام ابن مسعود هو المباشرة: «تعلموا فإذا علمتم فاعملوا».',
      startMs: 12000,
      endMs: 25000,
    },
    {
      id: 'ts-3',
      speaker: 'Host A',
      textEn:
        'Ibn Mas’ud explicitly connects learning with immediate action. In early Islamic tradition, knowledge was never separated from spiritual practice.',
      textAr: 'ربط ابن مسعود العلم بالعمل فوراً؛ فالعلم في صدر الإسلام لم يكن مجرد تنظير.',
      startMs: 25000,
      endMs: 40000,
    },
    {
      id: 'ts-4',
      speaker: 'Host B',
      textEn:
        'So true scholarship isn’t measured by how many books someone has on their shelf, but how much sincerity manifests in their character?',
      textAr: 'إذن فالعالم الحقيقي ليس بكثرة الكتب، بل بإخلاص العمل وتزكية النفس؟',
      startMs: 40000,
      endMs: 54000,
    },
    {
      id: 'ts-5',
      speaker: 'Host A',
      textEn:
        'Exactly. He warns us that without sincere intention, knowledge becomes a burden against a person rather than an intercessor for them.',
      textAr: 'بالضبط. يحذرنا ابن مسعود من أن العلم بلا نية صادقة يصير حجة على صاحبه.',
      startMs: 54000,
      endMs: 70000,
    },
    {
      id: 'ts-6',
      speaker: 'Host B',
      textEn:
        'SubhanAllah. That turns the entire modern concept of passive learning on its head. It demands self-reflection at every step.',
      textAr: 'سبحان الله! هذا يتطلب مراجعة دائمة للنية وتطبيق كل ما نتعلمه.',
      startMs: 70000,
      endMs: 85000,
    },
  ],
};

export const gleaningsEpisodesList: PodcastEpisode[] = [abdullahIbnMasudGleaning];
