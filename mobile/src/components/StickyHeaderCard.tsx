import { BookOpen, ChevronLeft, ChevronRight, Headphones } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';
import NamesAudioPlayer from './NamesAudioPlayer';
import {
  ArabicInline,
  Badge,
  Body,
  BodyStrong,
  Caption,
  Display,
  IconBubble,
  Overline,
  Row,
  useTheme,
} from './ui';
import type { DivineName } from '../data/theNames';
import { THE_NAMES_SERIES } from '../data/theNames';
import { audioForName } from '../data/theNamesAudio';
import { alpha, brandGradients, radius, shadow } from '../theme/tokens';

export type StickyHeaderCardProps = {
  name: DivineName;
  narrationsCount: number;
  onPrevious?: () => void;
  onNext?: () => void;
  canPrevious?: boolean;
  canNext?: boolean;
};

/**
 * Sticky hero for The Names — shows the currently selected name’s full
 * attributes while the lower grid scrolls underneath.
 */
export default function StickyHeaderCard({
  name,
  narrationsCount,
  onPrevious,
  onNext,
  canPrevious = true,
  canNext = true,
}: StickyHeaderCardProps) {
  const { colors, isDark } = useTheme();
  const episode = audioForName(name.number);

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: colors.paper,
          borderBottomColor: colors.border,
        },
        shadow('md', isDark),
      ]}
    >
      <LinearGradient
        colors={brandGradients.night[isDark ? 'dark' : 'light']}
        style={styles.hero}
      >
        <Row justify="space-between" align="center">
          <Badge label={`Name ${name.number} of 99`} color="#FDE68A" background="rgba(253,230,138,0.14)" />
          <Row gap={8}>
            <Pressable
              onPress={onPrevious}
              disabled={!canPrevious}
              accessibilityRole="button"
              accessibilityLabel="Previous name"
              style={({ pressed }) => [
                styles.navChip,
                {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  opacity: !canPrevious ? 0.35 : pressed ? 0.7 : 1,
                },
              ]}
            >
              <ChevronLeft size={16} color="#FFFFFF" />
            </Pressable>
            <Pressable
              onPress={onNext}
              disabled={!canNext}
              accessibilityRole="button"
              accessibilityLabel="Next name"
              style={({ pressed }) => [
                styles.navChip,
                {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  opacity: !canNext ? 0.35 : pressed ? 0.7 : 1,
                },
              ]}
            >
              <ChevronRight size={16} color="#FFFFFF" />
            </Pressable>
          </Row>
        </Row>

        <ArabicInline color="#FDE68A" style={styles.arabic}>
          {name.arabic}
        </ArabicInline>
        <Display color="#FFFFFF" style={styles.translit}>
          {name.transliteration}
        </Display>
        <BodyStrong color="#6EE7B7" style={styles.meaning}>
          {name.meaning}
        </BodyStrong>

        <Overline color="#94A3B8" style={styles.sigLabel}>
          Detailed significance
        </Overline>
        <Body color="#E2E8F0" style={styles.significance}>
          {name.reflection}
        </Body>

        <Row gap={10} style={styles.metaRow}>
          <View style={[styles.metaChip, { backgroundColor: alpha('#FBBF24', 0.16) }]}>
            <BookOpen size={13} color="#FDE68A" />
            <Caption color="#FDE68A">
              {narrationsCount} classical narration{narrationsCount === 1 ? '' : 's'}
            </Caption>
          </View>
          {episode ? (
            <View style={[styles.metaChip, { backgroundColor: alpha('#34D399', 0.16) }]}>
              <Headphones size={13} color="#6EE7B7" />
              <Caption color="#6EE7B7">Podcast available</Caption>
            </View>
          ) : null}
        </Row>

        <NamesAudioPlayer name={name} episode={episode} />

        <Row gap={8} style={styles.creditRow}>
          <IconBubble icon={BookOpen} color="#FDE68A" size={26} rounded={radius.sm} />
          <Caption color="#CBD5E1" style={styles.creditText}>
            Companion study: {THE_NAMES_SERIES.credit}
          </Caption>
        </Row>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderBottomWidth: 1,
    zIndex: 20,
  },
  hero: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 10,
    borderRadius: radius['2xl'],
    padding: 16,
    gap: 4,
  },
  navChip: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arabic: { marginTop: 10, fontSize: 34, lineHeight: 52 },
  translit: { marginTop: 2 },
  meaning: { marginTop: 4 },
  sigLabel: { marginTop: 12 },
  significance: { marginTop: 4, lineHeight: 22 },
  metaRow: { marginTop: 12, flexWrap: 'wrap' },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  creditRow: { marginTop: 10, alignItems: 'center' },
  creditText: { flex: 1, lineHeight: 18 },
});
