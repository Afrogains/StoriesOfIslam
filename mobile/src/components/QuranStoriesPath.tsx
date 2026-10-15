import { Pressable, StyleSheet, View } from 'react-native';
import {
  QURAN_STORY_ERA_LABELS,
  getQuranStory,
  listQuranStorySlugs,
  quranStoryEra,
  type QuranStoryEra,
} from '../data/quranStories';
import { alpha, radius } from '../theme/tokens';
import { BodyStrong, Caption, Card, Overline, Row, Small, useTheme } from './ui';

type QuranStoriesPathProps = {
  onSelect?: (slug: string) => void;
};

function timelineGroups(): { era: QuranStoryEra; slugs: string[] }[] {
  const groups: { era: QuranStoryEra; slugs: string[] }[] = [];
  for (const slug of listQuranStorySlugs()) {
    const era = quranStoryEra(slug);
    const current = groups[groups.length - 1];
    if (!current || current.era !== era) groups.push({ era, slugs: [slug] });
    else current.slugs.push(slug);
  }
  return groups;
}

/** Nineteen Quranic narratives in Ibn Kathir’s book order, grouped by era. */
export default function QuranStoriesPath({ onSelect }: QuranStoriesPathProps) {
  const { colors, isDark } = useTheme();

  return (
    <Card style={styles.card} padding={14}>
      <Overline color={colors.purple}>Nineteen stories from the Quran</Overline>
      <Small color={colors.inkMuted} style={styles.note}>
        Ibn Kathir’s Stories of the Quran — the narratives the Book itself tells, in the
        order of the bundled English edition. Tap to read — listening is incoming.
      </Small>
      <View style={styles.rail}>
        {timelineGroups().map((group) => {
          const era = QURAN_STORY_ERA_LABELS[group.era];
          return (
            <View key={group.era} style={styles.eraBlock}>
              <Row justify="space-between" align="center" style={styles.era}>
                <Overline color={colors.purple}>{era.en}</Overline>
                <Caption color={colors.inkSubtle}>{era.ar}</Caption>
              </Row>
              {group.slugs.map((slug) => {
                const chapter = getQuranStory(slug);
                const number = chapter?.sortOrder ?? 0;
                return (
                  <Pressable
                    key={slug}
                    onPress={() => onSelect?.(slug)}
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${chapter?.titleEn ?? slug}`}
                    style={({ pressed }) => [
                      styles.row,
                      {
                        backgroundColor: isDark ? alpha(colors.purple, 0.12) : colors.cardAlt,
                        borderColor: colors.border,
                        opacity: pressed ? 0.85 : 1,
                      },
                    ]}
                  >
                    <View style={[styles.num, { backgroundColor: alpha(colors.purple, 0.2) }]}>
                      <BodyStrong color={colors.purple} style={styles.numText}>
                        {number}
                      </BodyStrong>
                    </View>
                    <View style={styles.copy}>
                      <BodyStrong numberOfLines={1} style={styles.title}>
                        {chapter?.titleEn ?? slug}
                      </BodyStrong>
                      <Caption color={colors.inkMuted} numberOfLines={2}>
                        {chapter?.titleAr} · pp. {chapter?.pdfPageStart}–{chapter?.pdfPageEnd}
                      </Caption>
                    </View>
                  </Pressable>
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
  copy: { flex: 1, gap: 2 },
  title: { fontSize: 14 },
});
