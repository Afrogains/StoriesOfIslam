export type AuthenticityGrade = 'sahih' | 'hasan' | 'historical';

export type StoryCue = {
  text: string;
  textAr: string;
  startMs: number;
  endMs: number;
};

export type MockStory = {
  id: string;
  slug: string;
  title: string;
  titleAr: string;
  figureName: string;
  figureNameAr: string;
  honorific: string;
  honorificAr: string;
  sourceCitation: string;
  authenticityGrade: AuthenticityGrade;
  audioUrl: string;
  artworkUrl: string;
  durationMs: number;
  cues: StoryCue[];
};

export const mockStory: MockStory = {
  id: '20a1b2c3-d4e5-4060-8071-222222222001',
  slug: 'ibrahim-and-the-fire',
  title: 'Ibrahim and the Fire',
  titleAr: 'إبراهيم والنار',
  figureName: 'Ibrahim',
  figureNameAr: 'إبراهيم',
  honorific: 'peace be upon him',
  honorificAr: 'عليه السلام',
  sourceCitation:
    'Ibn Kathir, Qisas al-Anbiya; Al-Bidayah wan-Nihayah; Quran 21:69',
  authenticityGrade: 'sahih',
  audioUrl:
    'https://cdn.storiesofislam.example/audio/qisas/ibrahim-and-the-fire.mp3',
  artworkUrl: 'https://cdn.storiesofislam.example/artwork/qisas/ibrahim.jpg',
  durationMs: 45000,
  cues: [
    {
      text: 'When Ibrahim, peace be upon him, called his people to worship Allah alone, they answered him with anger.',
      textAr:
        'لما دعا إبراهيم عليه السلام قومه إلى عبادة الله وحده، قابلوه بالغضب.',
      startMs: 0,
      endMs: 5500,
    },
    {
      text: 'He broke their idols, leaving the largest one standing, so they might turn to it in thought.',
      textAr:
        'فكسّر أصنامهم وترك كبيرها قائماً، لعلهم إليه يرجعون.',
      startMs: 5500,
      endMs: 11000,
    },
    {
      text: 'They seized him and kindled a great fire.',
      textAr: 'فأخذوه وأوقدوا له ناراً عظيمة.',
      startMs: 11000,
      endMs: 15500,
    },
    {
      text: 'Then they cast him into it, intending to make an end of his call.',
      textAr: 'ثم ألقوه فيها يريدون إبطال دعوته.',
      startMs: 15500,
      endMs: 20500,
    },
    {
      text: 'Allah commanded: “O fire, be coolness and safety upon Ibrahim.”',
      textAr: 'فقال الله تعالى: «يَا نَارُ كُونِي بَرْدًا وَسَلَامًا عَلَىٰ إِبْرَاهِيمَ».',
      startMs: 20500,
      endMs: 28000,
    },
    {
      text: 'The fire did not harm him.',
      textAr: 'فلم تمسّه النار بسوء.',
      startMs: 28000,
      endMs: 32000,
    },
    {
      text: 'His call to tawhid remained, a sign for those who reflect.',
      textAr: 'وبقي نداؤه بالتوحيد آيةً لقوم يتفكرون.',
      startMs: 32000,
      endMs: 38500,
    },
    {
      text: 'So Allah saved His friend, and the plot of his people came to nothing.',
      textAr: 'فنجّى الله خليله، وبطل كيد قومه.',
      startMs: 38500,
      endMs: 45000,
    },
  ],
};

export function cueIndexAt(positionMs: number, cues: StoryCue[]): number {
  const hit = cues.findIndex(
    (cue) => positionMs >= cue.startMs && positionMs < cue.endMs,
  );
  if (hit >= 0) return hit;
  if (positionMs >= (cues[cues.length - 1]?.endMs ?? 0)) {
    return Math.max(0, cues.length - 1);
  }
  return 0;
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
