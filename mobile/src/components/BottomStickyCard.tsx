import { BookOpen, Headphones } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { DivineName } from '../data/theNames';
import { audioForName } from '../data/theNamesAudio';
import { BODY_FONT_FAMILY, alpha, brandGradients, radius, shadow } from '../theme/tokens';
import NamesAudioPlayer from './NamesAudioPlayer';
import {
  ArabicInline,
  Body,
  BodyStrong,
  Caption,
  Overline,
  Row,
  useTheme,
} from './ui';

export type BottomStickyDeckMode = 'idle' | 'listen' | 'read';

export type BottomStickyCardProps = {
  name: DivineName;
  mode: BottomStickyDeckMode;
  onListen: () => void;
  onReadNarrations: () => void;
};

/**
 * Compact floating sticky deck above the tab bar — shows the selected name’s
 * core attributes and Listen / Read Narrations actions.
 */
export default function BottomStickyCard({
  name,
  mode,
  onListen,
  onReadNarrations,
}: BottomStickyCardProps) {
  const { colors, isDark } = useTheme();
  const episode = audioForName(name.number);
  const goldGradient = brandGradients.gold[isDark ? 'dark' : 'light'];

  return (
    <View
      pointerEvents="box-none"
      style={[styles.anchor, shadow('lg', isDark)]}
    >
      <LinearGradient
        colors={brandGradients.night[isDark ? 'dark' : 'light']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.deck}
      >
        <Row justify="space-between" align="center">
          <Overline color="#FDE68A">Name {name.number} of 99</Overline>
          <ArabicInline color="#FDE68A" style={styles.arabic}>
            {name.arabic}
          </ArabicInline>
        </Row>

        <BodyStrong color="#FFFFFF" style={styles.translit} numberOfLines={1}>
          {name.transliteration}
        </BodyStrong>
        <Caption color="#6EE7B7" style={styles.meaning} numberOfLines={1}>
          {name.meaning}
        </Caption>

        <Row gap={8} style={styles.ctaRow}>
          <Pressable
            onPress={onListen}
            accessibilityRole="button"
            accessibilityLabel={`Listen to ${name.transliteration}`}
            style={({ pressed }) => [
              styles.cta,
              styles.listenCta,
              { backgroundColor: mode === 'listen' ? '#FDE68A' : alpha('#FDE68A', 0.18) },
              pressed && styles.pressed,
            ]}
          >
            <Headphones size={14} color={mode === 'listen' ? '#0F172A' : '#FDE68A'} />
            <Text
              style={[
                styles.ctaLabel,
                { color: mode === 'listen' ? '#0F172A' : '#FDE68A' },
              ]}
            >
              Listen
            </Text>
          </Pressable>

          <Pressable
            onPress={onReadNarrations}
            accessibilityRole="button"
            accessibilityLabel={`Read narrations for ${name.transliteration}`}
            style={({ pressed }) => [
              styles.cta,
              styles.readCta,
              {
                borderColor:
                  mode === 'read' ? '#6EE7B7' : 'rgba(255,255,255,0.22)',
                backgroundColor:
                  mode === 'read' ? alpha('#34D399', 0.2) : 'rgba(255,255,255,0.06)',
              },
              pressed && styles.pressed,
            ]}
          >
            <BookOpen size={14} color={mode === 'read' ? '#6EE7B7' : '#E2E8F0'} />
            <Text
              style={[
                styles.ctaLabel,
                { color: mode === 'read' ? '#6EE7B7' : '#E2E8F0' },
              ]}
            >
              Read Narrations
            </Text>
          </Pressable>
        </Row>

        {mode === 'listen' ? (
          <View style={styles.expand}>
            <NamesAudioPlayer name={name} episode={episode} />
          </View>
        ) : null}

        {mode === 'read' ? (
          <View
            style={[
              styles.narrationPanel,
              { backgroundColor: alpha('#0F172A', 0.45), borderColor: alpha('#FBBF24', 0.28) },
            ]}
          >
            <Overline color="#FDE68A">Detailed significance</Overline>
            <Body color="#E2E8F0" style={styles.narrationBody}>
              {name.reflection}
            </Body>
            <LinearGradient colors={goldGradient} style={styles.narrationChip}>
              <Caption color="#0F172A">Classical narration · teaching note</Caption>
            </LinearGradient>
          </View>
        ) : null}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 10,
    zIndex: 40,
  },
  deck: {
    borderRadius: radius['2xl'],
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 2,
    borderWidth: 1,
    borderColor: 'rgba(253,230,138,0.22)',
  },
  arabic: { fontSize: 22, lineHeight: 34 },
  translit: { marginTop: 4, fontSize: 17 },
  meaning: { marginTop: 2 },
  ctaRow: { marginTop: 12 },
  cta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  listenCta: {},
  readCta: { borderWidth: 1 },
  ctaLabel: {
    fontFamily: BODY_FONT_FAMILY,
    fontSize: 12,
    fontWeight: '800',
  },
  pressed: { opacity: 0.82 },
  expand: { marginTop: 10 },
  narrationPanel: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 12,
    gap: 6,
  },
  narrationBody: { lineHeight: 20 },
  narrationChip: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
});
