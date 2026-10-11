import { BookOpen } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { SEERAH_PARTS, SEERAH_SERIES } from '../data/seerahParts';
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

type SeerahPathProps = {
  onSelect?: (slug: string) => void;
};

/** Compact ordered path for the seven Seerah parts — not one chip per PDF heading. */
export default function SeerahPath({ onSelect }: SeerahPathProps) {
  const { colors, isDark } = useTheme();

  return (
    <Card style={styles.card} padding={16}>
      <Row gap={8} align="center">
        <BookOpen size={14} color={colors.gold} />
        <Overline color={colors.gold}>{SEERAH_SERIES.credit}</Overline>
      </Row>
      <Small color={colors.inkMuted} style={styles.note}>
        {SEERAH_SERIES.description} Tap a part to read or listen.
      </Small>
      <View style={styles.list}>
        {SEERAH_PARTS.map((part) => (
          <Pressable
            key={part.slug}
            onPress={() => onSelect?.(part.slug)}
            accessibilityRole="button"
            accessibilityLabel={`Open Seerah part ${part.sortOrder}: ${part.titleEn}`}
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
              <BodyStrong color={colors.gold}>{part.sortOrder}</BodyStrong>
            </View>
            <View style={styles.copy}>
              <Row justify="space-between" align="center">
                <BodyStrong numberOfLines={1} style={styles.title}>
                  {part.titleEn}
                </BodyStrong>
                <ArabicInline color={colors.gold} style={styles.arabic} numberOfLines={1}>
                  {part.titleAr}
                </ArabicInline>
              </Row>
              <Caption color={colors.inkMuted} numberOfLines={2}>
                {part.summaryEn}
              </Caption>
            </View>
          </Pressable>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
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
