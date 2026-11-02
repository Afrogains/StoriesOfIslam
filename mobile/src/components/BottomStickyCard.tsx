import { BookOpen, ChevronDown, ChevronUp, Headphones, PlayCircle, Share2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { THE_NAMES_SERIES, type DivineName } from '../data/theNames';
import { toParagraphs } from '../data/text';
import { audioForName } from '../data/theNamesAudio';
import {
  episodeForName,
  type ApprovedNameMedia,
  type NamesMediaStatus,
} from '../services/namesMedia';
import { alpha, brandGradients, radius, shadow } from '../theme/tokens';
import { formatNameShare } from '../services/share';
import NamesAudioPlayer from './NamesAudioPlayer';
import { useShareSheet } from './ShareSheet';
import {
  ArabicInline,
  Body,
  BodyStrong,
  Caption,
  Overline,
  Row,
  useTheme,
} from './ui';

export type BottomStickyDeckMode = 'idle' | 'listen' | 'mini' | 'read';

export type BottomStickyCardProps = {
  name: DivineName;
  mode: BottomStickyDeckMode;
  onListen: () => void;
  onReadNarrations: () => void;
  onMinimizePlayer?: () => void;
  onExpandPlayer?: () => void;
  /** Distance from the bottom of the screen content (above the tab bar). */
  bottomOffset?: number;
  /** Reviewer-approved lesson media for this Name, if any. */
  approved?: ApprovedNameMedia;
  mediaStatus?: NamesMediaStatus;
};

/** Compact floating deck above the tab bar for the selected Name. */
export default function BottomStickyCard({
  name,
  mode,
  onListen,
  onReadNarrations,
  onMinimizePlayer,
  onExpandPlayer,
  bottomOffset = 10,
  approved,
  mediaStatus = 'unavailable',
}: BottomStickyCardProps) {
  const { isDark } = useTheme();
  const { openShare } = useShareSheet();
  const episode = episodeForName(approved, audioForName(name.number));
  const listenOpen = mode === 'listen' || mode === 'mini';
  const watchClass = approved
    ? () => void Linking.openURL(approved.watchUrl).catch(() => undefined)
    : null;

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
            <BodyStrong color="#FFFFFF" numberOfLines={2} style={styles.meaning}>
              {name.meaning}
            </BodyStrong>
          </View>
          <ArabicInline color="#FDE68A" style={styles.arabic} numberOfLines={1}>
            {name.arabic}
          </ArabicInline>
        </Row>

        <Row justify="flex-end" align="center" gap={8} style={styles.actions}>
          <Pressable
            onPress={() => openShare(formatNameShare(name))}
            accessibilityRole="button"
            accessibilityLabel={`Share ${name.transliteration}`}
            hitSlop={6}
            style={({ pressed }) => [
              styles.iconCta,
              { backgroundColor: 'rgba(255,255,255,0.08)' },
              pressed && styles.pressed,
            ]}
          >
            <Share2 size={15} color="#E2E8F0" />
          </Pressable>

          {listenOpen ? (
            <Pressable
              onPress={mode === 'listen' ? onMinimizePlayer : onExpandPlayer}
              accessibilityRole="button"
              accessibilityLabel={mode === 'listen' ? 'Minimize player' : 'Expand player'}
              hitSlop={6}
              style={({ pressed }) => [
                styles.iconCta,
                { backgroundColor: 'rgba(255,255,255,0.08)' },
                pressed && styles.pressed,
              ]}
            >
              {mode === 'listen' ? (
                <ChevronDown size={16} color="#E2E8F0" />
              ) : (
                <ChevronUp size={16} color="#E2E8F0" />
              )}
            </Pressable>
          ) : null}

          <Pressable
            onPress={onListen}
            accessibilityRole="button"
            accessibilityState={{ selected: listenOpen }}
            accessibilityLabel={`Listen to ${name.transliteration}`}
            hitSlop={6}
            style={({ pressed }) => [
              styles.iconCta,
              {
                backgroundColor: listenOpen ? '#FDE68A' : alpha('#FDE68A', 0.16),
              },
              pressed && styles.pressed,
            ]}
          >
            <Headphones size={16} color={listenOpen ? '#0F172A' : '#FDE68A'} />
          </Pressable>

          <Pressable
            onPress={onReadNarrations}
            accessibilityRole="button"
            accessibilityState={{ selected: mode === 'read' }}
            accessibilityLabel={`Read narrations for ${name.transliteration}`}
            hitSlop={6}
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
            <BookOpen size={16} color={mode === 'read' ? '#6EE7B7' : '#E2E8F0'} />
          </Pressable>
        </Row>

        {listenOpen ? (
          <View style={mode === 'mini' ? styles.miniExpand : styles.expand}>
            {episode ? (
              <NamesAudioPlayer name={name} episode={episode} compact={mode === 'mini'} />
            ) : mediaStatus === 'loading' ? (
              <View style={styles.narrationPanel}>
                <Caption color="#CBD5E1">Checking for reviewed audio…</Caption>
              </View>
            ) : (
              <NamesAudioPlayer name={name} episode={null} compact={mode === 'mini'} />
            )}
            {watchClass && !episode && mode === 'listen' ? (
              <WatchClassLink onPress={watchClass} classNumber={approved?.classNumber ?? null} />
            ) : null}
          </View>
        ) : null}

        {mode === 'read' ? (
          <View style={styles.narrationPanel}>
            {approved ? (
              <>
                <Caption color="#FDE68A">
                  Reviewed lesson notes
                  {approved.classNumber != null ? ` · Class ${approved.classNumber}` : ''}
                </Caption>
                <ScrollView
                  style={styles.notesScroll}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={false}
                >
                  {toParagraphs(approved.description).map((paragraph, index) => (
                    <Body key={index} color="#E2E8F0" style={styles.notesParagraph}>
                      {paragraph}
                    </Body>
                  ))}
                </ScrollView>
                <Caption color="#94A3B8" numberOfLines={1}>
                  From {THE_NAMES_SERIES.credit}
                </Caption>
                {watchClass ? (
                  <WatchClassLink onPress={watchClass} classNumber={approved.classNumber} />
                ) : null}
              </>
            ) : (
              <>
                <Caption color="#FDE68A">Significance</Caption>
                <Body color="#E2E8F0" style={styles.narrationBody} numberOfLines={4}>
                  {name.reflection}
                </Body>
                {mediaStatus === 'loading' ? (
                  <Caption color="#94A3B8">Checking for reviewed lesson notes…</Caption>
                ) : null}
              </>
            )}
          </View>
        ) : null}
      </LinearGradient>
    </View>
  );
}

function WatchClassLink({
  onPress,
  classNumber,
}: {
  onPress: () => void;
  classNumber: number | null;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={`Watch class ${classNumber ?? ''} on YouTube`}
      hitSlop={6}
      style={({ pressed }) => [styles.watchLink, pressed && styles.pressed]}
    >
      <PlayCircle size={14} color="#FDE68A" />
      <Caption color="#FDE68A">
        Watch {classNumber != null ? `class ${classNumber}` : 'the class'} on YouTube
      </Caption>
    </Pressable>
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
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(253,230,138,0.2)',
    gap: 10,
  },
  copy: { flex: 1, minWidth: 0 },
  meaning: { marginTop: 2, fontSize: 14, lineHeight: 20 },
  arabic: { fontSize: 22, lineHeight: 32, flexShrink: 0, maxWidth: 120 },
  actions: { marginTop: 0 },
  iconCta: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  pressed: { opacity: 0.82 },
  expand: { marginTop: 8 },
  miniExpand: { marginTop: 4 },
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
  notesScroll: { maxHeight: 200 },
  notesParagraph: { lineHeight: 20, marginBottom: 8 },
  watchLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
});
