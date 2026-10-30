import {
  BookMarked,
  BookOpen,
  Bookmark,
  CheckCircle2,
  Clock,
  Headphones,
  Share2,
  User,
  type LucideIcon,
} from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { sectionsMeta } from '../data/catalogMeta';
import { LISTEN_CTA_A11Y, LISTEN_CTA_LABEL, LISTEN_META_LABEL } from '../data/listenIncoming';
import type { SectionSlug, StoryItem } from '../types/catalog';
import { useShareSheet } from './ShareSheet';
import { useLibrary } from '../hooks/useLibrary';
import { formatStoryShare } from '../services/share';
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
  'qisas-al-quran': BookMarked,
  'seerah-shamail': BookOpen,
  sahabah: User,
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
  const { openShare } = useShareSheet();
  const meta = sectionsMeta[story.sectionSlug];
  const accent = sectionAccent(story.sectionSlug, isDark);
  const saved = isSaved(story.id);

  return (
    <Card accent={accent.primary} accessibilityLabel={`${story.title}. ${story.summary}`}>
      <Row justify="space-between" style={styles.metaRow} align="flex-start">
        <Row gap={6} style={styles.metaBadges}>
          <Badge label={meta.title} color={accent.badgeText} background={accent.badgeBg} />
          <OutlineBadge label={story.authenticityGrade} color={accent.primary} icon={CheckCircle2} />
        </Row>

        <Row gap={4} align="center">
          <Pressable
            onPress={() => openShare(formatStoryShare(story))}
            hitSlop={8}
            style={styles.bookmark}
            accessibilityRole="button"
            accessibilityLabel={`Share ${story.title}`}
          >
            <Share2 size={17} color={colors.inkSubtle} />
          </Pressable>
          <Pressable
            onPress={() => toggleSaved(story.id, story)}
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

          <Divider style={styles.divider} />

          <Row justify="space-between" style={styles.metaFooter}>
            <Row gap={5}>
              <Clock size={12} color={colors.inkSubtle} />
              <Caption>{story.durationLabel}</Caption>
              <View style={[styles.dot, { backgroundColor: alpha(colors.inkSubtle, 0.5) }]} />
              <Caption>{LISTEN_META_LABEL}</Caption>
            </Row>
          </Row>
        </>
      ) : (
        <Caption color={colors.inkSubtle} style={styles.compactMeta}>
          {story.durationLabel}
          {` · ${LISTEN_META_LABEL.toLowerCase()}`}
        </Caption>
      )}

      <Row gap={8} style={styles.ctaRow} align="center">
        <View style={styles.ctaFlex}>
          <OutlineButton
            label="Read"
            icon={BookOpen}
            size="sm"
            onPress={onRead}
            accessibilityLabel={`Read story: ${story.title}`}
            style={styles.ctaFill}
          />
        </View>
        <View style={styles.ctaFlex}>
          <GradientButton
            label={LISTEN_CTA_LABEL}
            icon={Headphones}
            gradient={accent.accentGradient}
            size="sm"
            onPress={onListen}
            accessibilityLabel={LISTEN_CTA_A11Y}
            style={styles.ctaFill}
          />
        </View>
      </Row>
    </Card>
  );
}

const styles = StyleSheet.create({
  metaRow: { marginBottom: 10, gap: 8 },
  metaBadges: { flex: 1, minWidth: 0, flexWrap: 'wrap' },
  bookmark: { padding: 4, marginTop: -2 },
  arabic: { marginTop: 2 },
  figure: { marginTop: 4 },
  summary: { marginTop: 8 },
  compactMeta: { marginTop: 6, marginBottom: 2 },
  wisdom: {
    marginTop: 12,
    padding: 12,
    borderRadius: radius.md,
    borderLeftWidth: 3,
  },
  wisdomLabel: { letterSpacing: 1, fontWeight: '800' },
  wisdomText: { marginTop: 3, fontWeight: '600' },
  divider: { marginTop: 14, marginBottom: 10 },
  metaFooter: { marginBottom: 10 },
  dot: { width: 3, height: 3, borderRadius: 2, marginHorizontal: 2 },
  ctaRow: { marginTop: 12, alignItems: 'stretch' },
  ctaFlex: { flex: 1, minWidth: 0 },
  ctaFill: { width: '100%' },
});
