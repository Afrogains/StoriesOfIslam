import {
  BookOpen,
  Bookmark,
  CheckCircle2,
  Clock,
  Headphones,
  Library,
  Play,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { sectionsMeta } from '../data/catalogMeta';
import type { SectionSlug, StoryItem } from '../types/catalog';
import { useLibrary } from '../hooks/useLibrary';
import { alpha, radius, sectionAccent } from '../theme/tokens';
import {
  ArabicTitle,
  Badge,
  Body,
  Caption,
  Card,
  Divider,
  GradientButton,
  OutlineBadge,
  Row,
  Small,
  Title,
  useTheme,
} from './ui';

export const sectionIcons: Record<SectionSlug, LucideIcon> = {
  'qisas-al-anbiya': BookOpen,
  'seerah-shamail': Sparkles,
  sahabah: Users,
  gleanings: Library,
};

export default function StoryCard({
  story,
  onPress,
  variant = 'full',
}: {
  story: StoryItem;
  onPress: () => void;
  /** `compact` drops the summary and key-wisdom block for dense lists. */
  variant?: 'full' | 'compact';
}) {
  const { colors, isDark } = useTheme();
  const { isSaved, toggleSaved } = useLibrary();
  const meta = sectionsMeta[story.sectionSlug];
  const accent = sectionAccent(story.sectionSlug, isDark);
  const saved = isSaved(story.id);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${story.hasAudio ? 'Open and listen to' : 'Open and read'} ${story.title}`}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <Card accent={accent.primary} accessibilityLabel={`${story.title}. ${story.summary}`}>
      <Row justify="space-between" style={styles.metaRow}>
        <Row gap={6}>
          <Badge label={meta.title} color={accent.badgeText} background={accent.badgeBg} />
          <OutlineBadge label={story.authenticityGrade} color={accent.primary} icon={CheckCircle2} />
        </Row>

        <Pressable
          onPress={(event) => {
            event.stopPropagation();
            toggleSaved(story.id);
          }}
          hitSlop={8}
          style={styles.bookmark}
          accessibilityRole="button"
          accessibilityState={{ selected: saved }}
          accessibilityLabel={saved ? `Remove ${story.title} from library` : `Save ${story.title} to library`}
        >
          <Bookmark
            size={18}
            color={saved ? colors.gold : colors.inkSubtle}
            fill={saved ? colors.gold : 'transparent'}
          />
        </Pressable>
      </Row>

      <Title numberOfLines={2}>{story.title}</Title>
      <ArabicTitle color={accent.primary} style={styles.arabic}>
        {story.titleAr}
      </ArabicTitle>

      <Caption color={colors.inkMuted} style={styles.figure}>
        {story.figureName} · {story.honorific}
      </Caption>

      {variant === 'full' ? (
        <>
          <Body style={styles.summary}>{story.summary}</Body>

          {story.keyTakeaway ? (
            <View
              style={[
                styles.wisdom,
                {
                  backgroundColor: isDark ? colors.cardAlt : accent.surface,
                  borderLeftColor: accent.primary,
                },
              ]}
            >
              <Caption color={accent.primary} style={styles.wisdomLabel}>
                KEY WISDOM
              </Caption>
              <Small color={colors.ink} style={styles.wisdomText}>
                {story.keyTakeaway}
              </Small>
            </View>
          ) : null}
        </>
      ) : (
        <Body numberOfLines={2} style={styles.summary}>
          {story.summary}
        </Body>
      )}

      <Divider style={styles.divider} />

      <Row justify="space-between">
        <Row gap={5}>
          {story.hasAudio ? (
            <Headphones size={13} color={colors.inkSubtle} />
          ) : (
            <BookOpen size={13} color={colors.inkSubtle} />
          )}
          <Caption>{story.hasAudio ? `${story.durationLabel} audio` : 'Full text'}</Caption>
          <View style={[styles.dot, { backgroundColor: alpha(colors.inkSubtle, 0.5) }]} />
          <Clock size={12} color={colors.inkSubtle} />
          <Caption>{story.durationLabel}</Caption>
        </Row>

        <GradientButton
          label={story.hasAudio ? 'Open' : 'Read'}
          icon={story.hasAudio ? Play : BookOpen}
          gradient={accent.accentGradient}
          size="sm"
          onPress={onPress}
          accessibilityLabel={`Open full story: ${story.title}`}
        />
      </Row>
    </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.92 },
  metaRow: { marginBottom: 12 },
  bookmark: { padding: 2 },
  arabic: { marginTop: 2 },
  figure: { marginTop: 4 },
  summary: { marginTop: 8 },
  wisdom: {
    marginTop: 14,
    padding: 12,
    borderRadius: radius.md,
    borderLeftWidth: 3,
  },
  wisdomLabel: { letterSpacing: 1, fontWeight: '800' },
  wisdomText: { marginTop: 3, fontWeight: '600' },
  divider: { marginTop: 16, marginBottom: 12 },
  dot: { width: 3, height: 3, borderRadius: 2, marginHorizontal: 2 },
});
