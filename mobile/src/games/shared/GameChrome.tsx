import { ChevronLeft, Coins, Lock, Star } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { BodyStrong, Caption, Overline, Row, Title, useTheme } from '../../components/ui';
import { alpha, radius } from '../../theme/tokens';

export function GameHeader({
  title,
  subtitle,
  coins,
  score,
  onBack,
}: {
  title: string;
  subtitle: string;
  coins: number;
  score?: number;
  onBack: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Row gap={10} align="center" style={styles.header}>
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Back to games"
        hitSlop={10}
        style={[styles.back, { borderColor: colors.border, backgroundColor: colors.card }]}
      >
        <ChevronLeft size={18} color={colors.ink} />
      </Pressable>
      <View style={styles.flex}>
        <Overline numberOfLines={1}>{subtitle}</Overline>
        <Title numberOfLines={1} style={styles.title}>
          {title}
        </Title>
      </View>
      {score !== undefined ? (
        <View style={[styles.chip, { backgroundColor: alpha(colors.emerald, 0.12) }]}>
          <Star size={13} color={colors.emerald} />
          <BodyStrong color={colors.emerald}>{score}</BodyStrong>
        </View>
      ) : null}
      <View
        style={[styles.chip, { backgroundColor: alpha(colors.gold, 0.14) }]}
        accessibilityLabel={`${coins} hint coins`}
      >
        <Coins size={13} color={colors.gold} />
        <BodyStrong color={colors.gold}>{coins}</BodyStrong>
      </View>
    </Row>
  );
}

export type LevelChip = { id: string; label: string; done: boolean; locked: boolean };

export function LevelStrip({
  levels,
  activeId,
  onSelect,
}: {
  levels: LevelChip[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const { colors, isDark } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
      {levels.map((level, index) => {
        const active = level.id === activeId;
        const tint = level.done ? colors.emerald : colors.gold;
        return (
          <Pressable
            key={level.id}
            disabled={level.locked}
            onPress={() => onSelect(level.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: active, disabled: level.locked }}
            accessibilityLabel={`Level ${index + 1}, ${level.label}${level.locked ? ', locked' : level.done ? ', solved' : ''}`}
            style={[
              styles.levelChip,
              {
                borderColor: active ? tint : colors.border,
                backgroundColor: active ? alpha(tint, isDark ? 0.24 : 0.12) : colors.card,
                opacity: level.locked ? 0.5 : 1,
              },
            ]}
          >
            {level.locked ? <Lock size={12} color={colors.inkSubtle} /> : null}
            <Caption color={active ? tint : colors.inkMuted} style={styles.levelText}>
              {index + 1}. {level.label}
            </Caption>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function GameCard({ children, tint }: { children: ReactNode; tint?: string }) {
  const { colors, isDark } = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? colors.card : '#FFFFFF',
          borderColor: tint ? alpha(tint, 0.35) : colors.border,
        },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 4 },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1, minWidth: 0 },
  title: { fontSize: 19, lineHeight: 24 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  strip: { gap: 8, paddingVertical: 2, paddingRight: 8 },
  levelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  levelText: { fontWeight: '700' },
  card: { borderRadius: radius.lg, borderWidth: 1, padding: 14, gap: 6 },
});
