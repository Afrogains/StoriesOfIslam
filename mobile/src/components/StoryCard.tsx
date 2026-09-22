import {
  BookOpen,
  Bookmark,
  CheckCircle2,
  Clock,
  Headphones,
  Library,
  User,
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
  OutlineButton,
  Row,
  Small,
  Title,
  useTheme,
} from './ui';

export const sectionIcons: Record<SectionSlug, LucideIcon> = {
  'qisas-al-anbiya': User,
  'seerah-shamail': BookOpen,
  sahabah: User,
  gleanings: Library,
};

export default function StoryCard({
  story,
  onRead,
  onListen,
  variant = 'full',
}: {
  story: StoryItem;
  onRead: () => void;
  onListen: () => void;
  /** `compact` drops the summary and key-wisdom block for dense lists. */
  variant?: 'full' | 'compact';
}) {
  const { colors, isDark } = useTheme();
  const { isSaved, toggleSaved } = useLibrary();
  const meta = sectionsMeta[story.sectionSlug];
  const accent = sectionAccent(story.sectionSlug, isDark);
  const saved = isSaved(story.id);
  const canListen = Boolean(story.hasAudio || story.audioUrl || story.content);

  return (
    <Card accent={accent.primary} accessibilityLabel={`${story.title}. ${story.summary}`}>
      <Row justify="space-between" style={styles.metaRow}>
        <Row gap={6}>
          <Badge label={meta.title} color={accent.badgeText} background={accent.badgeBg} />
          <OutlineBadge label={story.authenticityGrade} color={accent.primary} icon={CheckCircle2} />
        </Row>

        <Pressable
          onPress={() => toggleSaved(story.id)}
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
          <Body style={styles.summary} numberOfLines={3}>
            {story.summary}
          </Body>

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

      <Row justify="space-between" style={styles.metaFooter}>
        <Row gap={5}>
          <Clock size={12} color={colors.inkSubtle} />
          <Caption>{story.durationLabel}</Caption>
          <View style={[styles.dot, { backgroundColor: alpha(colors.inkSubtle, 0.5) }]} />
          <Caption>{story.hasAudio ? 'Audio ready' : 'Text first'}</Caption>
        </Row>
      </Row>

      <Row gap={8} style={styles.ctaRow}>
        <View style={styles.ctaFlex}>
          <OutlineButton
            label="Read Story"
            icon={BookOpen}
            onPress={onRead}
            accessibilityLabel={`Read story: ${story.title}`}
          />
        </View>
        <View style={styles.ctaFlex}>
          <GradientButton
            label="Listen"
            icon={Headphones}
            gradient={accent.accentGradient}
            size="sm"
            onPress={onListen}
            disabled={!canListen}
            accessibilityLabel={`Listen to: ${story.title}`}
          />
        </View>
      </Row>
    </Card>
  );
}

const styles = StyleSheet.create({
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
  metaFooter: { marginBottom: 12 },
  dot: { width: 3, height: 3, borderRadius: 2, marginHorizontal: 2 },
  ctaRow: { marginTop: 2 },
  ctaFlex: { flex: 1 },
});
