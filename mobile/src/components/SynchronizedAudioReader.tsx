import { Audio, AVPlaybackStatus } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Gauge,
  Download,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  ShieldCheck,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  NativeSyntheticEvent,
  NativeTouchEvent,
  Pressable,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  cueIndexAt,
  formatClock,
  mockStory,
  type MockStory,
  type StoryCue,
} from '../data/mockStory';
import { usePlaybackProgress } from '../hooks/usePlaybackProgress';
import { audioDownloads } from '../services/audioDownloads';
import {
  alpha,
  brandGradients,
  radius,
  sectionAccent,
  shadow,
  type SectionSlug,
} from '../theme/tokens';
import {
  ArabicBody,
  ArabicInline,
  Badge,
  Body,
  Caption,
  Display,
  Mono,
  Overline,
  PlayButton,
  Row,
  Title,
  useTheme,
} from './ui';

type PlaybackRate = 1 | 1.25 | 1.5;

type SynchronizedAudioReaderProps = {
  story?: MockStory;
  sectionSlug?: SectionSlug;
  initiallyExpanded?: boolean;
  onExpandChange?: (expanded: boolean) => void;
  onClose?: () => void;
};

const RATES: PlaybackRate[] = [1, 1.25, 1.5];

export default function SynchronizedAudioReader({
  story = mockStory,
  sectionSlug = 'qisas-al-anbiya',
  initiallyExpanded = true,
  onExpandChange,
  onClose,
}: SynchronizedAudioReaderProps) {
  const { colors, isDark } = useTheme();

  const soundRef = useRef<Audio.Sound | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const cueY = useRef<number[]>([]);
  const barWidth = useRef(1);
  const positionRef = useRef(0);
  const lastSavedRef = useRef(0);
  const { load: loadProgress, save: saveProgress } = usePlaybackProgress(story.id);

  const [expanded, setExpanded] = useState(initiallyExpanded);
  const [playing, setPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(story.durationMs);
  const [rate, setRate] = useState<PlaybackRate>(1);
  const [citationOpen, setCitationOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const accent = sectionAccent(sectionSlug, isDark);

  const activeIndex = useMemo(() => cueIndexAt(positionMs, story.cues), [positionMs, story.cues]);

  const onStatus = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    setPositionMs(status.positionMillis);
    positionRef.current = status.positionMillis;
    if (status.durationMillis) setDurationMs(status.durationMillis);
    setPlaying(status.isPlaying);
    if (status.didJustFinish) {
      void saveProgress(0, true).catch(() => undefined);
    } else if (Math.abs(status.positionMillis - lastSavedRef.current) >= 5_000) {
      lastSavedRef.current = status.positionMillis;
      void saveProgress(status.positionMillis).catch(() => undefined);
    }
  }, [saveProgress]);

  useEffect(() => {
    let alive = true;
    setAudioError(null);

    if (!story.audioUrl) {
      setReady(false);
      setAudioError('Audio is not available for this story yet. You can still read the complete text.');
      return () => {
        alive = false;
      };
    }

    (async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });

        const resumeAt = await loadProgress();
        const localUri = await audioDownloads.localUri(story.id, story.audioUrl);
        if (alive) setDownloaded(Boolean(localUri));
        const { sound } = await Audio.Sound.createAsync(
          { uri: localUri ?? story.audioUrl },
          {
            shouldPlay: false,
            positionMillis: Math.min(resumeAt, story.durationMs),
            progressUpdateIntervalMillis: 250,
            rate: 1,
            shouldCorrectPitch: true,
          },
          onStatus,
        );

        if (!alive) {
          await sound.unloadAsync();
          return;
        }

        soundRef.current = sound;
        setReady(true);
      } catch {
        if (alive) {
          setReady(false);
          setAudioError('Audio could not be loaded. Check your connection and try again.');
        }
      }
    })();

    return () => {
      alive = false;
      setReady(false);
      void saveProgress(positionRef.current).catch(() => undefined);
      soundRef.current?.unloadAsync();
      soundRef.current = null;
    };
  }, [story.id, story.audioUrl, story.durationMs, loadProgress, saveProgress, onStatus]);

  useEffect(() => {
    if (!ready) return;
    soundRef.current?.setRateAsync(rate, true);
  }, [rate, ready]);

  useEffect(() => {
    if (!expanded) return;
    const y = cueY.current[activeIndex];
    if (y == null) return;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 24), animated: true });
  }, [activeIndex, expanded]);

  const setExpandedState = (next: boolean) => {
    setExpanded(next);
    onExpandChange?.(next);
  };

  const togglePlay = async () => {
    const sound = soundRef.current;
    if (!sound || !ready) return;
    const status = await sound.getStatusAsync();
    if (!status.isLoaded) return;
    if (status.isPlaying) await sound.pauseAsync();
    else await sound.playAsync();
  };

  const seekTo = async (ms: number) => {
    const clamped = Math.max(0, Math.min(ms, durationMs));
    await soundRef.current?.setPositionAsync(clamped);
    setPositionMs(clamped);
  };

  const onScrub = (event: NativeSyntheticEvent<NativeTouchEvent>) => {
    const ratio = Math.max(0, Math.min(1, event.nativeEvent.locationX / barWidth.current));
    void seekTo(ratio * durationMs);
  };

  const downloadAudio = async () => {
    if (!story.audioUrl || downloading) return;
    setDownloading(true);
    try {
      await audioDownloads.download(story.id, story.audioUrl);
      setDownloaded(true);
    } catch (error) {
      setAudioError(error instanceof Error ? error.message : 'Audio download failed');
    } finally {
      setDownloading(false);
    }
  };

  const progress = durationMs ? positionMs / durationMs : 0;

  return (
    <View style={[styles.shell, { backgroundColor: colors.paper }]} accessibilityLabel="Synchronized audio reader">
      {expanded ? (
        <View style={styles.reader}>
          {/* Header sits on the section gradient so the source is instantly legible. */}
          <LinearGradient
            colors={accent.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <Row justify="space-between" align="flex-start">
              <Badge
                label={`${story.authenticityGrade} · verified`}
                color="#FFFFFF"
                background="rgba(255,255,255,0.2)"
                icon={ShieldCheck}
              />
              {onClose ? (
                <Pressable
                  onPress={onClose}
                  hitSlop={10}
                  style={styles.closeButton}
                  accessibilityRole="button"
                  accessibilityLabel="Close reader"
                >
                  <X size={18} color="#FFFFFF" />
                </Pressable>
              ) : null}
            </Row>

            <Display color="#FFFFFF" style={styles.title}>
              {story.title}
            </Display>
            <ArabicInline color="#FDE68A" style={styles.titleArabic}>
              {story.titleAr}
            </ArabicInline>

            <Row justify="space-between" style={styles.figureRow}>
              <Caption color="#E7E5E4" style={styles.figure}>
                {story.figureName} · {story.honorific}
              </Caption>
              <ArabicInline color="rgba(255,255,255,0.75)">
                {story.figureNameAr} {story.honorificAr}
              </ArabicInline>
            </Row>

            {/* Transport controls */}
            <Row justify="space-between" style={styles.controls}>
              <Mono color="#E7E5E4">
                {formatClock(positionMs)} / {formatClock(durationMs)}
              </Mono>

              <Row gap={7}>
                <ControlChip
                  label="15"
                  icon={RotateCcw}
                  onPress={() => void seekTo(positionMs - 15000)}
                  accessibilityLabel="Rewind 15 seconds"
                />
                <ControlChip
                  label={`${rate}×`}
                  icon={Gauge}
                  onPress={() => setRate(RATES[(RATES.indexOf(rate) + 1) % RATES.length] as PlaybackRate)}
                  accessibilityLabel={`Playback speed ${rate} times`}
                />
                <ControlChip
                  label="15"
                  icon={RotateCw}
                  onPress={() => void seekTo(positionMs + 15000)}
                  accessibilityLabel="Forward 15 seconds"
                />
                <ControlChip
                  label="Source"
                  icon={BookOpen}
                  onPress={() => setCitationOpen(true)}
                  accessibilityLabel="Open source citation"
                />
                {Platform.OS !== 'web' ? (
                  <ControlChip
                    label={downloaded ? 'Saved' : downloading ? 'Saving' : 'Offline'}
                    icon={downloaded ? CheckCircle2 : Download}
                    onPress={() => void downloadAudio()}
                    accessibilityLabel="Save audio for offline listening"
                  />
                ) : null}
              </Row>
            </Row>
          </LinearGradient>

          {/* Cue list */}
          <ScrollView
            ref={scrollRef}
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            accessibilityLabel="Story text"
          >
            <Overline style={styles.transcriptLabel}>Follow along</Overline>
            {audioError ? (
              <View style={[styles.audioError, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
                <AlertCircle size={15} color={accent.primary} />
                <Caption color={colors.inkMuted} style={styles.audioErrorText}>
                  {audioError}
                </Caption>
              </View>
            ) : null}

            {story.cues.map((cue, index) => (
              <CueBlock
                key={`${cue.startMs}-${index}`}
                cue={cue}
                index={index}
                active={index === activeIndex}
                past={index < activeIndex}
                accent={accent.primary}
                activeBg={isDark ? colors.cardAlt : alpha(accent.primary, 0.08)}
                inkColor={colors.ink}
                mutedColor={colors.inkMuted}
                onLayoutY={(y) => {
                  cueY.current[index] = y;
                }}
                onPress={() => void seekTo(cue.startMs)}
              />
            ))}

            <Caption align="center" style={styles.endNote}>
              {story.sourceCitation}
            </Caption>
          </ScrollView>
        </View>
      ) : null}

      {/* Mini player */}
      <LinearGradient
        colors={brandGradients.night[isDark ? 'dark' : 'light']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.mini, shadow('lg', isDark)]}
        accessibilityLabel="Mini player"
      >
        <PlayButton
          playing={playing}
          onPress={() => void togglePlay()}
          gradient={accent.accentGradient}
          size={44}
          icons={{ play: Play, pause: Pause }}
        />

        <View style={styles.miniBody}>
          <Caption color="#FAFAF9" numberOfLines={1}>
            {story.title}
          </Caption>
          <Mono color="#A8A29E">
            {formatClock(positionMs)} / {formatClock(durationMs)} · {Math.round(progress * 100)}%
          </Mono>

          <Pressable
            onLayout={(event) => {
              barWidth.current = event.nativeEvent.layout.width || 1;
            }}
            onPress={onScrub}
            style={styles.scrubTrack}
            accessibilityRole="adjustable"
            accessibilityLabel="Playback progress"
            accessibilityValue={{
              now: Math.round(positionMs / 1000),
              min: 0,
              max: Math.round(durationMs / 1000),
            }}
          >
            <LinearGradient
              colors={accent.accentGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.scrubFill, { width: `${progress * 100}%` }]}
            />
          </Pressable>
        </View>

        <Pressable
          onPress={() => setExpandedState(!expanded)}
          hitSlop={8}
          style={styles.expandButton}
          accessibilityRole="button"
          accessibilityLabel={expanded ? 'Collapse reader' : 'Expand reader'}
        >
          {expanded ? <ChevronDown size={20} color="#FAFAF9" /> : <ChevronUp size={20} color="#FAFAF9" />}
        </Pressable>
      </LinearGradient>

      <CitationModal
        visible={citationOpen}
        story={story}
        accent={accent.primary}
        onClose={() => setCitationOpen(false)}
      />
    </View>
  );
}

function ControlChip({
  label,
  icon: Icon,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  icon: LucideIcon;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.controlChip, pressed && styles.pressed]}
    >
      <Icon size={12} color="#FFFFFF" />
      <Caption color="#FFFFFF">{label}</Caption>
    </Pressable>
  );
}

function CueBlock({
  cue,
  index,
  active,
  past,
  accent,
  activeBg,
  inkColor,
  mutedColor,
  onLayoutY,
  onPress,
}: {
  cue: StoryCue;
  index: number;
  active: boolean;
  past: boolean;
  accent: string;
  activeBg: string;
  inkColor: string;
  mutedColor: string;
  onLayoutY: (y: number) => void;
  onPress: () => void;
}) {
  return (
    <Pressable
      onLayout={(event) => onLayoutY(event.nativeEvent.layout.y)}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Sentence ${index + 1}`}
      accessibilityState={{ selected: active }}
      style={[
        styles.cue,
        active && { backgroundColor: activeBg, borderLeftColor: accent, borderLeftWidth: 3 },
        past && !active && styles.cuePast,
      ]}
    >
      <Body
        color={active ? accent : inkColor}
        style={[styles.cueText, active && styles.cueTextActive]}
      >
        {cue.text}
      </Body>
      <ArabicBody color={active ? accent : mutedColor} style={styles.cueArabic}>
        {cue.textAr}
      </ArabicBody>
    </Pressable>
  );
}

function CitationModal({
  visible,
  story,
  accent,
  onClose,
}: {
  visible: boolean;
  story: MockStory;
  accent: string;
  onClose: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={[styles.modalScrim, { backgroundColor: colors.scrim }]} onPress={onClose}>
        <Pressable
          style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => undefined}
        >
          <Row justify="space-between">
            <Row gap={8}>
              <ShieldCheck size={17} color={accent} />
              <Title>Source & authenticity</Title>
            </Row>
            <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Close citation">
              <X size={18} color={colors.inkMuted} />
            </Pressable>
          </Row>

          <Badge
            label={`Grade: ${story.authenticityGrade}`}
            color={accent}
            style={styles.modalBadge}
          />

          <Body color={colors.ink} style={styles.modalBody}>
            {story.sourceCitation}
          </Body>

          <Caption style={styles.modalNote}>
            Every narration in the app is traced to a named classical collection before publication.
          </Caption>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  reader: { flex: 1 },
  pressed: { opacity: 0.7 },

  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 18 },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { marginTop: 14 },
  titleArabic: { marginTop: 4 },
  figureRow: { marginTop: 12 },
  figure: { flex: 1, paddingRight: 10 },
  controls: { marginTop: 16 },
  controlChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 28 },
  transcriptLabel: { marginBottom: 12 },
  audioError: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 12,
  },
  audioErrorText: { flex: 1 },
  cue: {
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  cuePast: { opacity: 0.55 },
  cueText: { fontSize: 16, lineHeight: 27 },
  cueTextActive: { fontWeight: '700' },
  cueArabic: { marginTop: 8 },
  endNote: { marginTop: 18, paddingHorizontal: 12 },

  mini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
  },
  miniBody: { flex: 1 },
  scrubTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
    marginTop: 7,
  },
  scrubFill: { height: 5, borderRadius: 3 },
  expandButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },

  modalScrim: { flex: 1, justifyContent: 'center', padding: 24 },
  modalCard: { borderRadius: radius['2xl'], borderWidth: 1, padding: 20 },
  modalBadge: { marginTop: 14 },
  modalBody: { marginTop: 12 },
  modalNote: { marginTop: 14 },
});
