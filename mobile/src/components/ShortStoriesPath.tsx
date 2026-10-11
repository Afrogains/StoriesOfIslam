import { Sparkles } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { SHORT_STORIES, SHORT_STORIES_SERIES } from '../data/shortStoriesFromTheLife';
import { alpha, radius, shadow } from '../theme/tokens';
import {
  ArabicInline,
  BodyStrong,
  Caption,
  Card,
  Overline,
  Row,
  Small,
  useTheme,
} from './ui';

type ShortStoriesPathProps = {
  onSelect?: (slug: string) => void;
};

/** Compact Shama’il shelf for the twelve Iqra teaching stories. */
export default function ShortStoriesPath({ onSelect }: ShortStoriesPathProps) {
  const { colors, isDark } = useTheme();

  return (
    <Card style={styles.card} padding={16}>
      <Row gap={8} align="center">
        <Sparkles size={14} color={colors.gold} />
        <Overline color={colors.gold}>{SHORT_STORIES_SERIES.credit}</Overline>
      </Row>
      <Small color={colors.inkMuted} style={styles.note}>
        {SHORT_STORIES_SERIES.description} Tap a story to read or listen.
      </Small>
      <View style={styles.list}>
        {SHORT_STORIES.map((story) => (
          <Pressable
            key={story.slug}
            onPress={() => onSelect?.(story.slug)}
            accessibilityRole="button"
            accessibilityLabel={`Open short story ${story.sortOrder}: ${story.titleEn}`}
            style={({ pressed }) => [
              styles.row,
              {
                backgroundColor: isDark ? alpha(colors.gold, 0.1) : colors.cardAlt,
                borderColor: colors.border,
                opacity: pressed ? 0.85 : 1,
              },
              shadow('sm', isDark),
            ]}
          >
            <View style={[styles.num, { backgroundColor: alpha(colors.gold, 0.18) }]}>
              <BodyStrong color={colors.gold}>{story.sortOrder}</BodyStrong>
            </View>
            <View style={styles.copy}>
              <Row justify="space-between" align="center">
                <BodyStrong numberOfLines={1} style={styles.title}>
                  {story.titleEn}
                </BodyStrong>
                <ArabicInline color={colors.gold} style={styles.arabic} numberOfLines={1}>
                  {story.titleAr}
                </ArabicInline>
              </Row>
              <Caption color={colors.inkMuted} numberOfLines={2}>
                {story.summaryEn}
              </Caption>
            </View>
          </Pressable>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12, marginTop: 12 },
  note: { lineHeight: 18 },
  list: { gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 10,
  },
  num: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  title: { flex: 1, marginRight: 8, fontSize: 14 },
  arabic: { fontSize: 16, lineHeight: 24, maxWidth: 120 },
});
