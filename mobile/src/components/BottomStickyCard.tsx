import { BookOpen, Headphones } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';
import type { DivineName } from '../data/theNames';
import { audioForName } from '../data/theNamesAudio';
import { alpha, brandGradients, radius, shadow } from '../theme/tokens';
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
        <Row align="center" gap={10}>
          <View style={styles.copy}>
            <Overline color="#FDE68A" numberOfLines={1}>
              {name.number}/99 · {name.transliteration}
            </Overline>
            <BodyStrong color="#FFFFFF" numberOfLines={1} style={styles.meaning}>
              {name.meaning}
            </BodyStrong>
          </View>
          <ArabicInline color="#FDE68A" style={styles.arabic} numberOfLines={1}>
            {name.arabic}
          </ArabicInline>

          <Pressable
            onPress={onListen}
            accessibilityRole="button"
            accessibilityState={{ selected: mode === 'listen' }}
            accessibilityLabel={`Listen to ${name.transliteration}`}
            hitSlop={4}
            style={({ pressed }) => [
              styles.iconCta,
              {
                backgroundColor: mode === 'listen' ? '#FDE68A' : alpha('#FDE68A', 0.16),
              },
              pressed && styles.pressed,
            ]}
          >
            <Headphones size={17} color={mode === 'listen' ? '#0F172A' : '#FDE68A'} />
          </Pressable>

          <Pressable
            onPress={onReadNarrations}
            accessibilityRole="button"
            accessibilityState={{ selected: mode === 'read' }}
            accessibilityLabel={`Read narrations for ${name.transliteration}`}
            hitSlop={4}
            style={({ pressed }) => [
              styles.iconCta,
              {
                borderWidth: 1,
                borderColor: mode === 'read' ? '#6EE7B7' : 'rgba(255,255,255,0.2)',
                backgroundColor:
                  mode === 'read' ? alpha('#34D399', 0.18) : 'rgba(255,255,255,0.05)',
              },
              pressed && styles.pressed,
            ]}
          >
            <BookOpen size={17} color={mode === 'read' ? '#6EE7B7' : '#E2E8F0'} />
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
    borderRadius: radius.xl,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(253,230,138,0.2)',
  },
  copy: { flex: 1, minWidth: 0 },
  meaning: { marginTop: 1, fontSize: 14, lineHeight: 19 },
  arabic: { fontSize: 20, lineHeight: 30, flexShrink: 0, maxWidth: 110 },
  iconCta: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
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
