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
  /** Distance from the bottom of the screen content (above the tab bar). */
  bottomOffset?: number;
};

/** Compact floating deck above the tab bar for the selected Name. */
export default function BottomStickyCard({
  name,
  mode,
  onListen,
  onReadNarrations,
  bottomOffset = 10,
}: BottomStickyCardProps) {
  const { isDark } = useTheme();
  const episode = audioForName(name.number);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.anchor, { bottom: bottomOffset }, shadow('lg', isDark)]}
    >
      <LinearGradient
        colors={brandGradients.night[isDark ? 'dark' : 'light']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.deck}
      >
        <Row justify="space-between" align="center" gap={8}>
          <View style={styles.copy}>
            <Overline color="#FDE68A">
              {name.number}/99 · {name.transliteration}
            </Overline>
            <BodyStrong color="#FFFFFF" numberOfLines={1} style={styles.meaning}>
              {name.meaning}
            </BodyStrong>
          </View>
          <ArabicInline color="#FDE68A" style={styles.arabic}>
            {name.arabic}
          </ArabicInline>
        </Row>

        <Row gap={8} style={styles.ctaRow}>
          <Pressable
            onPress={onListen}
            accessibilityRole="button"
            accessibilityLabel={`Listen to ${name.transliteration}`}
            style={({ pressed }) => [
              styles.cta,
              {
                backgroundColor: mode === 'listen' ? '#FDE68A' : alpha('#FDE68A', 0.16),
              },
              pressed && styles.pressed,
            ]}
          >
            <Headphones size={13} color={mode === 'listen' ? '#0F172A' : '#FDE68A'} />
            <Text style={[styles.ctaLabel, { color: mode === 'listen' ? '#0F172A' : '#FDE68A' }]}>
              Listen
            </Text>
          </Pressable>

          <Pressable
            onPress={onReadNarrations}
            accessibilityRole="button"
            accessibilityLabel={`Read narrations for ${name.transliteration}`}
            style={({ pressed }) => [
              styles.cta,
              {
                borderWidth: 1,
                borderColor: mode === 'read' ? '#6EE7B7' : 'rgba(255,255,255,0.2)',
                backgroundColor:
                  mode === 'read' ? alpha('#34D399', 0.18) : 'rgba(255,255,255,0.05)',
              },
              pressed && styles.pressed,
            ]}
          >
            <BookOpen size={13} color={mode === 'read' ? '#6EE7B7' : '#E2E8F0'} />
            <Text style={[styles.ctaLabel, { color: mode === 'read' ? '#6EE7B7' : '#E2E8F0' }]}>
              Narrations
            </Text>
          </Pressable>
        </Row>

        {mode === 'listen' ? (
          <View style={styles.expand}>
            <NamesAudioPlayer name={name} episode={episode} />
          </View>
        ) : null}

        {mode === 'read' ? (
          <View style={styles.narrationPanel}>
            <Caption color="#FDE68A">Significance</Caption>
            <Body color="#E2E8F0" style={styles.narrationBody} numberOfLines={4}>
              {name.reflection}
            </Body>
          </View>
        ) : null}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 40,
  },
  deck: {
    borderRadius: radius['2xl'],
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(253,230,138,0.2)',
  },
  copy: { flex: 1, minWidth: 0, paddingRight: 8 },
  meaning: { marginTop: 2, fontSize: 14, lineHeight: 20 },
  arabic: { fontSize: 22, lineHeight: 32, flexShrink: 0 },
  ctaRow: { marginTop: 10 },
  cta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    borderRadius: radius.pill,
  },
  ctaLabel: {
    fontFamily: BODY_FONT_FAMILY,
    fontSize: 13,
    fontWeight: '800',
  },
  pressed: { opacity: 0.82 },
  expand: { marginTop: 8 },
  narrationPanel: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(253,230,138,0.22)',
    borderRadius: radius.lg,
    padding: 10,
    gap: 4,
    backgroundColor: 'rgba(15,23,42,0.4)',
  },
  narrationBody: { lineHeight: 19 },
});
