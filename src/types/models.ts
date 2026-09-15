export type AuthenticityGrade = 'sahih' | 'hasan' | 'athar' | 'historical';
export type PublicationStatus = 'draft' | 'in_review' | 'approved' | 'published' | 'archived';

export type CategorySlug =
  | 'qisas-al-anbiya'
  | 'seerah-shamail'
  | 'sahabah'
  | 'gleanings';

export interface LocalizedText {
  en: string;
  ar: string;
}

export interface AudioCdnMetadata {
  provider: string;
  bucket: string;
  objectKey: string;
  region?: string;
  publicUrl: string;
}

export interface BackgroundPlayerControls {
  title: string;
  artist: string;
  artworkUrl?: string;
  continueInBackground: boolean;
  showLockScreenControls: boolean;
  skipForwardSeconds: number;
  skipBackwardSeconds: number;
}

export interface AudioPlayback {
  url: string;
  mimeType: string;
  durationSeconds: number;
  fileSizeBytes: number;
  bitrateKbps?: number;
  cdn: AudioCdnMetadata;
  backgroundPlayer: BackgroundPlayerControls;
}

export interface TimedCue {
  startMs: number;
  endMs: number;
  textEn: string;
  textAr: string;
}

export interface Category {
  id: string;
  slug: CategorySlug;
  name: LocalizedText;
  description: LocalizedText;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Figure {
  id: string;
  categoryId: string;
  slug: string;
  name: LocalizedText;
  honorific: LocalizedText;
  isKeyFigure: boolean;
  sortOrder: number;
  bio: LocalizedText;
  createdAt: string;
  updatedAt: string;
}

export interface Story {
  id: string;
  categoryId: string;
  figureId: string | null;
  slug: string;
  title: LocalizedText;
  content: LocalizedText;
  sourceCitation: string;
  authenticityGrade: AuthenticityGrade;
  publicationStatus: PublicationStatus;
  reviewerId: string | null;
  reviewedAt: string | null;
  publishedAt: string | null;
  audioUrl: string | null;
  audio: AudioPlayback | null;
  timedCues: TimedCue[];
  createdAt: string;
  updatedAt: string;
}

export interface SeedData {
  categories: Category[];
  figures: Figure[];
  stories: Array<
    Omit<
      Story,
      | 'publicationStatus'
      | 'reviewerId'
      | 'reviewedAt'
      | 'publishedAt'
      | 'audioUrl'
      | 'audio'
    > & {
      audioUrl: string;
      audio: AudioPlayback;
    }
  >;
}
