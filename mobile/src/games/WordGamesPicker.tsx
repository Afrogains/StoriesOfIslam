import { ChevronRight, CircleDot, Grid3x3 } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { BodyStrong, Caption, Row, Small, useTheme } from '../components/ui';
import { alpha, radius, shadow } from '../theme/tokens';
import { bubbleLevels, wordscapesChapters, wordscapesLevels } from './shared/levels';

export type WordGameKey = 'bubbles' | 'wordscapes';

const GAMES = [
  {
    key: 'bubbles' as const,
    title: 'Prophetic Word Bubbles',
    blurb: 'Pop letter bubbles to spell the words of each Prophet’s story.',
    meta: `${bubbleLevels.length} stories · Adam to Muhammad ﷺ`,
    icon: CircleDot,
  },
  {
    key: 'wordscapes' as const,
    title: 'Prophetic Wordscapes',
    blurb: 'Swipe the letter wheel to fill a crossword and unlock chapter takeaways.',
    meta: `${wordscapesChapters.length} chapters · ${wordscapesLevels.length} levels`,
    icon: Grid3x3,
  },
];

export default function WordGamesPicker({ onSelect }: { onSelect: (game: WordGameKey) => void }) {
  const { colors, isDark } = useTheme();
  return (
    <View style={styles.list}>
      {GAMES.map((game, index) => {
        const tint = index === 0 ? colors.emerald : colors.gold;
        const Icon = game.icon;
        return (
          <Pressable
            key={game.key}
            onPress={() => onSelect(game.key)}
            accessibilityRole="button"
            accessibilityLabel={`Play ${game.title}`}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: alpha(tint, 0.35), opacity: pressed ? 0.85 : 1 },
              shadow('sm', isDark),
            ]}
          >
            <Row gap={12} align="center">
              <View style={[styles.icon, { backgroundColor: alpha(tint, 0.14) }]}>
                <Icon size={22} color={tint} />
              </View>
              <View style={styles.flex}>
                <BodyStrong>{game.title}</BodyStrong>
                <Small>{game.blurb}</Small>
                <Caption color={tint} style={styles.meta}>
                  {game.meta}
                </Caption>
              </View>
              <ChevronRight size={18} color={colors.inkSubtle} />
            </Row>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  card: { borderRadius: radius.lg, borderWidth: 1, padding: 14 },
  icon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, gap: 2 },
  meta: { fontWeight: '700', marginTop: 2 },
});
