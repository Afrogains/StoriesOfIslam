export type SectionSlug = 'qisas-al-anbiya' | 'seerah-shamail' | 'sahabah' | 'gleanings';
export type MediaFilter = 'all' | 'audio' | 'text';
export type AuthenticityGrade = 'sahih' | 'hasan' | 'athar' | 'historical';

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
  durationMs?: number;
  audioUrl?: string | null;
  artworkUrl?: string | null;
  timedCues?: { startMs: number; endMs: number; textEn: string; textAr: string }[];
};
