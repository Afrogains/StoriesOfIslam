import { Pressable, StyleSheet, View } from 'react-native';
import {
  SEERAH_ERA_LABELS,
  SEERAH_TIMELINE,
  type SeerahTimelineEntry,
} from '../data/seerahTimeline';
import { getSeerahPart } from '../data/seerahParts';
import { getShortStory } from '../data/shortStoriesFromTheLife';
import { alpha, radius } from '../theme/tokens';
import { BodyStrong, Caption, Card, Overline, Row, Small, useTheme } from './ui';

type SeerahPathProps = {
  onSelect?: (slug: string) => void;
};

function entryCopy(entry: SeerahTimelineEntry): { title: string; summary: string } {
  const life = getSeerahPart(entry.slug);
  if (life) return { title: life.titleEn, summary: life.summaryEn };
  const lesson = getShortStory(entry.slug);
  return { title: lesson?.titleEn ?? entry.slug, summary: lesson?.summaryEn ?? '' };
}

/** One compact chronological timeline — life chapters and lessons together. */
function timelineGroups(): { era: SeerahTimelineEntry['era']; items: { entry: SeerahTimelineEntry; index: number }[] }[] {
  const groups: { era: SeerahTimelineEntry['era']; items: { entry: SeerahTimelineEntry; index: number }[] }[] = [];
  SEERAH_TIMELINE.forEach((entry, index) => {
    const current = groups[groups.length - 1];
    if (!current || current.era !== entry.era) groups.push({ era: entry.era, items: [{ entry, index }] });
    else current.items.push({ entry, index });
  });
  return groups;
}

export default function SeerahPath({ onSelect }: SeerahPathProps) {
  const { colors, isDark } = useTheme();

  return (
    <Card style={styles.card} padding={14}>
      <Overline color={colors.gold}>One life, in order</Overline>
      <Small color={colors.inkMuted} style={styles.note}>
        Ibn Kathir’s Seerah and the short teaching stories in one timeline. Tap to read or listen.
      </Small>
      <View style={styles.rail}>
        {timelineGroups().map((group) => {
          const era = SEERAH_ERA_LABELS[group.era];
          return (
            <View key={group.era} style={styles.eraBlock}>
              <Row justify="space-between" align="center" style={styles.era}>
                <Overline color={colors.gold}>{era.en}</Overline>
                <Caption color={colors.inkSubtle}>{era.ar}</Caption>
              </Row>
              {group.items.map(({ entry, index }) => {
          const copy = entryCopy(entry);
          const isLife = entry.kind === 'life';
          return (
            <View key={entry.slug}>
              <Pressable
                onPress={() => onSelect?.(entry.slug)}
                accessibilityRole="button"
                accessibilityLabel={`Open ${copy.title}`}
                style={({ pressed }) => [
                  styles.row,
                  {
                    backgroundColor: isDark ? alpha(colors.gold, isLife ? 0.12 : 0.06) : colors.cardAlt,
                    borderColor: colors.border,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.num,
                    { backgroundColor: alpha(colors.gold, isLife ? 0.22 : 0.12) },
                  ]}
                >
                  <BodyStrong color={colors.gold} style={styles.numText}>
                    {index + 1}
                  </BodyStrong>
                </View>
                <View style={styles.copy}>
                  <BodyStrong numberOfLines={1} style={styles.title}>
                    {copy.title}
                  </BodyStrong>
                  <Caption color={colors.inkMuted} numberOfLines={1}>
                    {isLife ? 'Seerah' : 'Lesson'} · {copy.summary}
                  </Caption>
                </View>
              </Pressable>
            </View>
          );
              })}
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10 },
  note: { lineHeight: 18 },
  rail: { gap: 10 },
  eraBlock: { gap: 6 },
  era: { marginBottom: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  num: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numText: { fontSize: 12 },
  copy: { flex: 1, minWidth: 0, gap: 1 },
  title: { fontSize: 14 },
});
