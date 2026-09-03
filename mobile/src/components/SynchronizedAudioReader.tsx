import { Audio, AVPlaybackStatus } from 'expo-av';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Gauge,
  Pause,
  Play,
  X,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  NativeSyntheticEvent,
  NativeTouchEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  cueIndexAt,
  formatClock,
  mockStory,
  type MockStory,
  type StoryCue,
} from '../data/mockStory';

type PlaybackRate = 1 | 1.25 | 1.5;

type SynchronizedAudioReaderProps = {
  story?: MockStory;
  initiallyExpanded?: boolean;
  onExpandChange?: (expanded: boolean) => void;
};

const RATES: PlaybackRate[] = [1, 1.25, 1.5];

export default function SynchronizedAudioReader({
  story = mockStory,
  initiallyExpanded = true,
  onExpandChange,
}: SynchronizedAudioReaderProps) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const cueY = useRef<number[]>([]);
  const barWidth = useRef(1);

  const [expanded, setExpanded] = useState(initiallyExpanded);
  const [playing, setPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(story.durationMs);
  const [rate, setRate] = useState<PlaybackRate>(1);
  const [citationOpen, setCitationOpen] = useState(false);
  const [ready, setReady] = useState(false);

  const activeIndex = useMemo(
    () => cueIndexAt(positionMs, story.cues),
    [positionMs, story.cues],
  );

  const onStatus = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    setPositionMs(status.positionMillis);
    if (status.durationMillis) setDurationMs(status.durationMillis);
    setPlaying(status.isPlaying);
  }, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });

        const { sound } = await Audio.Sound.createAsync(
          { uri: story.audioUrl },
          {
            shouldPlay: false,
            progressUpdateIntervalMillis: 100,
            rate,
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
        if (alive) setReady(false);
      }
    })();

    return () => {
      alive = false;
      setReady(false);
      soundRef.current?.unloadAsync();
      soundRef.current = null;
    };
  }, [story.audioUrl, onStatus]);

  useEffect(() => {
    if (!ready) return;
    soundRef.current?.setRateAsync(rate, true);
  }, [rate, ready]);

  useEffect(() => {
    if (!expanded) return;
    const y = cueY.current[activeIndex];
    if (y == null) return;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 16), animated: true });
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

  const onBarGrant = (evt: NativeSyntheticEvent<NativeTouchEvent>) => {
    const ratio = Math.max(0, Math.min(1, evt.nativeEvent.locationX / barWidth.current));
    void seekTo(ratio * durationMs);
  };

  const cycleRate = () => {
    const i = RATES.indexOf(rate);
    setRate(RATES[(i + 1) % RATES.length] as PlaybackRate);
  };

  return (
    <View style={styles.shell} accessibilityLabel="Synchronized audio reader">
      {expanded ? (
        <View style={styles.reader}>
          <View style={styles.header}>
            <Text style={styles.title} accessibilityRole="header">
              {story.title}
            </Text>
            <Text style={styles.titleAr} accessibilityLanguage="ar">
              {story.titleAr}
            </Text>
            <Text style={styles.figure}>
              {story.figureName} · {story.honorific}
            </Text>
            <Text style={styles.figureAr} accessibilityLanguage="ar">
              {story.figureNameAr} {story.honorificAr}
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.duration}>{formatClock(durationMs)}</Text>
              <Pressable
                onPress={cycleRate}
                style={styles.chip}
                accessibilityRole="button"
                accessibilityLabel={`Playback speed ${rate} times`}
              >
                <Gauge size={14} color={theme.gold} />
                <Text style={styles.chipText}>{rate}x</Text>
              </Pressable>
              <Pressable
                onPress={() => setCitationOpen(true)}
                style={styles.chip}
                accessibilityRole="button"
                accessibilityLabel="Open source citation"
              >
                <BookOpen size={14} color={theme.gold} />
                <Text style={styles.chipText}>Source</Text>
              </Pressable>
            </View>
          </View>

          <ScrollView
            ref={scrollRef}
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            accessibilityLabel="Story text"
          >
            {story.cues.map((cue, index) => (
              <CueBlock
                key={`${cue.startMs}-${index}`}
                cue={cue}
                index={index}
                active={index === activeIndex}
                past={index < activeIndex}
                onLayoutY={(y) => {
                  cueY.current[index] = y;
                }}
                onPress={() => void seekTo(cue.startMs)}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.mini} accessibilityLabel="Mini player">
        <Pressable
          onPress={togglePlay}
          style={styles.playBtn}
          accessibilityRole="button"
          accessibilityLabel={playing ? 'Pause' : 'Play'}
        >
          {playing ? (
            <Pause size={22} color={theme.barText} fill={theme.barText} />
          ) : (
            <Play size={22} color={theme.barText} fill={theme.barText} />
          )}
        </Pressable>

        <View style={styles.miniBody}>
          <Text style={styles.miniTitle} numberOfLines={1}>
            {story.title}
          </Text>
          <Text style={styles.miniSub} numberOfLines={1}>
            {story.figureName} · {formatClock(positionMs)} / {formatClock(durationMs)}
          </Text>
          <Pressable
            onLayout={(e) => {
              barWidth.current = e.nativeEvent.layout.width || 1;
            }}
            onPress={onBarGrant}
            style={styles.barTrack}
            accessibilityRole="adjustable"
            accessibilityLabel="Playback progress"
            accessibilityValue={{
              now: Math.round(positionMs / 1000),
              min: 0,
              max: Math.round(durationMs / 1000),
            }}
          >
            <View
              style={[
                styles.barFill,
                { width: `${durationMs ? (positionMs / durationMs) * 100 : 0}%` },
              ]}
            />
          </Pressable>
        </View>

        <Pressable
          onPress={() => setExpandedState(!expanded)}
          style={styles.expandBtn}
          accessibilityRole="button"
          accessibilityLabel={expanded ? 'Collapse reader' : 'Expand reader'}
        >
          {expanded ? (
            <ChevronDown size={22} color={theme.barText} />
          ) : (
            <ChevronUp size={22} color={theme.barText} />
          )}
        </Pressable>
      </View>

      <CitationModal
        visible={citationOpen}
        story={story}
        onClose={() => setCitationOpen(false)}
      />
    </View>
  );
}

function CueBlock({
  cue,
  index,
  active,
  past,
  onLayoutY,
  onPress,
}: {
  cue: StoryCue;
  index: number;
  active: boolean;
  past: boolean;
  onLayoutY: (y: number) => void;
  onPress: () => void;
}) {
  return (
    <Pressable
      onLayout={(e) => onLayoutY(e.nativeEvent.layout.y)}
      onPress={onPress}
      style={[
        styles.cue,
        active && styles.cueActive,
        past && !active && styles.cuePast,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Sentence ${index + 1}`}
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.cueEn, active && styles.cueEnActive]}>{cue.text}</Text>
      <Text
        style={[styles.cueAr, active && styles.cueArActive]}
        accessibilityLanguage="ar"
      >
        {cue.textAr}
      </Text>
    </Pressable>
  );
}

function CitationModal({
  visible,
  story,
  onClose,
}: {
  visible: boolean;
  story: MockStory;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.modalScrim} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={() => undefined}>
          <View style={styles.modalHead}>
            <Text style={styles.modalTitle}>Source citation</Text>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close citation"
            >
              <X size={20} color={theme.ink} />
            </Pressable>
          </View>
          <Text style={styles.modalGrade}>
            Authenticity: {story.authenticityGrade}
          </Text>
          <Text style={styles.modalBody}>{story.sourceCitation}</Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const theme = {
  paper: '#F6F0E4',
  ink: '#1C1917',
  muted: '#57534E',
  gold: '#B45309',
  goldSoft: 'rgba(180, 83, 9, 0.16)',
  bar: '#1C1917',
  barText: '#FAFAF9',
  accent: '#0F766E',
};

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: theme.paper },
  reader: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  title: { fontSize: 26, fontWeight: '700', color: theme.ink },
  titleAr: {
    marginTop: 4,
    fontSize: 22,
    color: theme.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  figure: { marginTop: 10, fontSize: 15, color: theme.muted },
  figureAr: {
    marginTop: 2,
    fontSize: 14,
    color: theme.muted,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  duration: { fontSize: 13, color: theme.muted, marginRight: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: theme.goldSoft,
  },
  chipText: { fontSize: 13, fontWeight: '600', color: theme.gold },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 24 },
  cue: { paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10, marginBottom: 6 },
  cueActive: { backgroundColor: theme.goldSoft },
  cuePast: { opacity: 0.55 },
  cueEn: { fontSize: 18, lineHeight: 30, color: theme.ink },
  cueEnActive: { fontWeight: '600' },
  cueAr: {
    marginTop: 6,
    fontSize: 20,
    lineHeight: 34,
    color: theme.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  cueArActive: { fontWeight: '600' },
  mini: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.bar,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniBody: { flex: 1 },
  miniTitle: { color: theme.barText, fontSize: 14, fontWeight: '600' },
  miniSub: { color: '#A8A29E', fontSize: 12, marginTop: 2, marginBottom: 8 },
  barTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#44403C',
    overflow: 'hidden',
  },
  barFill: { height: 4, backgroundColor: theme.gold },
  expandBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  modalScrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: { backgroundColor: theme.paper, borderRadius: 16, padding: 20 },
  modalHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: theme.ink },
  modalGrade: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.accent,
    textTransform: 'capitalize',
    marginBottom: 10,
  },
  modalBody: { fontSize: 16, lineHeight: 26, color: theme.ink },
});
