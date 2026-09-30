import { Users } from 'lucide-react-native';
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
  SAHABAH_SERIES,
  theSahabah,
  type SahabahFigure,
} from '../data/theSahabah';
import { alpha, radius, shadow } from '../theme/tokens';

type SahabahRosterProps = {
  onSelect?: (companion: SahabahFigure) => void;
  compact?: boolean;
};

export default function SahabahRoster({ onSelect, compact = false }: SahabahRosterProps) {
  const { colors, isDark } = useTheme();
  const [selected, setSelected] = useState<SahabahFigure>(theSahabah[0]);

  const choose = (item: SahabahFigure) => {
    setSelected(item);
    onSelect?.(item);
  };

  return (
    <Card style={styles.card} padding={16}>
      <Row gap={8} align="center">
        <Users size={14} color={colors.emerald} />
        <Overline color={colors.emerald}>{SAHABAH_SERIES.credit}</Overline>
      </Row>
      <Small color={colors.inkMuted} style={styles.seriesNote}>
        {SAHABAH_SERIES.description} Tap a companion’s name to open the full
        biography{compact ? '' : ' (read or listen)'} from the PDF.
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
            Open full biography
          </Caption>
        </Pressable>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {theSahabah.map((item) => {
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
                      : '#E0F2FE'
                    : colors.cardAlt,
                  borderColor: active ? '#0284C7' : colors.border,
                  opacity: pressed ? 0.85 : 1,
                },
                active ? shadow('sm', isDark) : null,
              ]}
            >
              <Caption color={active ? '#0284C7' : colors.inkMuted}>
                {item.sortOrder}
              </Caption>
              <BodyStrong style={styles.chipName} numberOfLines={2}>
                {item.nameEn}
              </BodyStrong>
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
  detailArabic: { fontSize: 20, lineHeight: 30 },
  summary: { marginTop: 4, lineHeight: 20 },
  openHint: { marginTop: 8, fontWeight: '700' },
  chipRow: { gap: 8, paddingVertical: 2 },
  chip: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 96,
    maxWidth: 140,
    gap: 2,
  },
  chipName: { fontSize: 13 },
});
