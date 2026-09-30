import { BookOpen, Headphones, Shuffle } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { sectionsMeta } from '../data/catalogMeta';
import type { StoryItem } from '../types/catalog';
import { alpha, radius, sectionAccent, shadow } from '../theme/tokens';
import {
  Badge,
  Body,
  Caption,
  GradientButton,
  OutlineBadge,
  OutlineButton,
  Overline,
  Row,
  Small,
  Title,
  useTheme,
} from './ui';

function pickRandom(pool: StoryItem[], avoidId?: string | null): StoryItem | null {
  if (!pool.length) return null;
  if (pool.length === 1) return pool[0];
  const candidates = avoidId ? pool.filter((story) => story.id !== avoidId) : pool;
  const source = candidates.length ? candidates : pool;
  return source[Math.floor(Math.random() * source.length)] ?? null;
}

type ExploreRandomPickProps = {
  pool: StoryItem[];
  onRead: (story: StoryItem) => void;
  onListen: (story: StoryItem) => void;
};

/**
 * Brief random story overview for Explore — Read / Listen without searching.
 */
export default function ExploreRandomPick({ pool, onRead, onListen }: ExploreRandomPickProps) {
  const { colors, isDark } = useTheme();
  const [pick, setPick] = useState<StoryItem | null>(() => pickRandom(pool));
  const lastPoolKey = useRef('');

  useEffect(() => {
    const key = pool.map((story) => story.id).join('|');
    if (key === lastPoolKey.current) return;
    lastPoolKey.current = key;
    setPick((current) => {
      if (current && pool.some((story) => story.id === current.id)) return current;
      return pickRandom(pool);
    });
  }, [pool]);

  if (!pick || !pool.length) return null;

  const meta = sectionsMeta[pick.sectionSlug];
  const accent = sectionAccent(pick.sectionSlug, isDark);
  const canListen = Boolean(pick.hasAudio || pick.audioUrl || pick.content);

  const reshuffle = () => {
    setPick((current) => pickRandom(pool, current?.id));
  };

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: isDark ? alpha(colors.emerald, 0.1) : colors.cardAlt,
          borderColor: colors.border,
        },
        shadow('sm', isDark),
      ]}
      accessibilityLabel={`Discover: ${pick.title}. ${pick.summary}`}
    >
      <Row justify="space-between" align="center" style={styles.head}>
        <View style={styles.headCopy}>
          <Overline color={colors.emerald}>Discover</Overline>
          <Small color={colors.inkMuted} style={styles.headHint}>
            A brief overview — jump straight into reading or listening.
          </Small>
        </View>
        <Pressable
          onPress={reshuffle}
          accessibilityRole="button"
          accessibilityLabel="Show another random story"
          style={({ pressed }) => [
            styles.shuffleBtn,
            {
              backgroundColor: isDark ? alpha(colors.emerald, 0.22) : accent.surface,
              borderColor: accent.primary,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Shuffle size={14} color={accent.primary} />
          <Caption color={accent.primary} style={styles.shuffleLabel}>
            Another
          </Caption>
        </Pressable>
      </Row>

      <Row gap={6} style={styles.badges}>
        <Badge label={meta.title} color={accent.badgeText} background={accent.badgeBg} />
        <OutlineBadge label={pick.authenticityGrade} color={accent.primary} />
      </Row>

      <Title numberOfLines={2} style={styles.title}>
        {pick.title}
      </Title>
      <Caption color={colors.inkMuted}>
        {pick.figureName} · {pick.honorific}
      </Caption>
      <Body color={colors.ink} numberOfLines={3} style={styles.summary}>
        {pick.summary}
      </Body>
      <Caption color={colors.inkSubtle} style={styles.meta}>
        {pick.durationLabel}
        {canListen ? ' · audio ready' : ' · text first'}
      </Caption>

      <Row gap={8} style={styles.ctaRow}>
        <View style={styles.ctaFlex}>
          <OutlineButton
            label="Read"
            icon={BookOpen}
            onPress={() => onRead(pick)}
            accessibilityLabel={`Read story: ${pick.title}`}
          />
        </View>
        <View style={styles.ctaFlex}>
          <GradientButton
            label="Listen"
            icon={Headphones}
            gradient={accent.accentGradient}
            size="sm"
            onPress={() => onListen(pick)}
            disabled={!canListen}
            accessibilityLabel={`Listen to: ${pick.title}`}
          />
        </View>
      </Row>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 14,
    gap: 4,
  },
  head: { marginBottom: 8 },
  headCopy: { flex: 1, paddingRight: 10, gap: 2 },
  headHint: { lineHeight: 17 },
  shuffleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  shuffleLabel: { fontWeight: '700' },
  badges: { marginBottom: 6, flexWrap: 'wrap' },
  title: { marginTop: 2 },
  summary: { marginTop: 6, lineHeight: 20 },
  meta: { marginTop: 4 },
  ctaRow: { marginTop: 12 },
  ctaFlex: { flex: 1 },
});
