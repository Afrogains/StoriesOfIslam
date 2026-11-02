export type HighlightKind = 'story' | 'hadith' | 'name';

export type Highlight = {
  id: string;
  text: string;
  kind: HighlightKind;
  sourceLabel: string;
  storyId?: string;
  storyTitle?: string;
  createdAt: number;
};
