import { BookOpen } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  ArabicInline,
  Body,
  BodyStrong,
  Caption,
  Card,
  Overline,
  Row,
  Small,
  useTheme,
} from './ui';
import {
  PROPHETS_SERIES,
  theProphets,
  type ProphetFigure,
} from '../data/theProphets';
import { alpha, radius, shadow } from '../theme/tokens';

type ProphetsRosterProps = {
  onSelect?: (prophet: ProphetFigure) => void;
  compact?: boolean;
};

export default function ProphetsRoster({ onSelect, compact = false }: ProphetsRosterProps) {
  const { colors, isDark } = useTheme();
  const [selected, setSelected] = useState<ProphetFigure>(theProphets[0]);

  const choose = (item: ProphetFigure) => {
    setSelected(item);
    onSelect?.(item);
  };

  return (
    <Card style={styles.card} padding={16}>
      <Row gap={8} align="center">
        <BookOpen size={14} color={colors.emerald} />
        <Overline color={colors.emerald}>{PROPHETS_SERIES.credit}</Overline>
      </Row>
      <Small color={colors.inkMuted} style={styles.seriesNote}>
        {PROPHETS_SERIES.description} Tap a prophet to open the full story to read
        {compact ? '' : ' or play'}. Muhammad ﷺ is covered under Seerah & Shama’il.
      </Small>

      {!compact ? (
        <Pressable
          onPress={() => onSelect?.(selected)}
          accessibilityRole="button"
          accessibilityLabel={`Open full story for ${selected.nameEn}`}
          style={[
            styles.detail,
            {
              backgroundColor: isDark ? alpha(colors.emerald, 0.12) : colors.cardAlt,
              borderColor: colors.border,
            },
          ]}
        >
          <Row justify="space-between" align="center">
            <BodyStrong>
              {selected.sortOrder}. {selected.nameEn}
            </BodyStrong>
            <ArabicInline color={colors.emerald} style={styles.detailArabic}>
              {selected.nameAr}
            </ArabicInline>
          </Row>
          <Caption color={colors.inkMuted}>{selected.honorificEn}</Caption>
          <Body style={styles.summary}>{selected.summaryEn}</Body>
          <Caption color={colors.emerald} style={styles.openHint}>
            Tap to read the full story
          </Caption>
        </Pressable>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {theProphets.map((item) => {
          const active = item.slug === selected.slug;
          return (
            <Pressable
              key={item.slug}
              onPress={() => choose(item)}
              accessibilityRole="button"
              accessibilityLabel={`Open full story for ${item.nameEn}`}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: active
                    ? isDark
                      ? alpha(colors.emerald, 0.22)
                      : '#CCFBF1'
                    : colors.cardAlt,
                  borderColor: active ? colors.emerald : colors.border,
                  opacity: pressed ? 0.85 : 1,
                },
                active ? shadow('sm', isDark) : null,
              ]}
            >
              <Caption color={active ? colors.emerald : colors.inkMuted}>
                {item.sortOrder}
              </Caption>
              <BodyStrong style={styles.chipName}>{item.nameEn}</BodyStrong>
            </Pressable>
          );
        })}
      </ScrollView>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  seriesNote: { lineHeight: 18 },
  detail: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 12,
    gap: 4,
  },
  detailArabic: { fontSize: 22, lineHeight: 32 },
  summary: { marginTop: 4, lineHeight: 20 },
  openHint: { marginTop: 8, fontWeight: '700' },
  chipRow: { gap: 8, paddingVertical: 2 },
  chip: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 72,
    gap: 2,
  },
  chipName: { fontSize: 14 },
});
