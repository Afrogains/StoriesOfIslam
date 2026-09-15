import { Audio } from 'expo-av';
import {
  CheckCircle2,
  ChevronRight,
  Gauge,
  HelpCircle,
  MessageSquare,
  Mic,
  Pause,
  Play,
  Radio,
  RotateCcw,
  RotateCw,
  Sparkles,
  User,
  Volume2,
  X,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  NativeSyntheticEvent,
  NativeTouchEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  abdullahIbnMasudGleaning,
  type PodcastEpisode,
  type PodcastTimestampSegment,
} from '../data/gleaningsData';
import { useAppMode } from '../hooks/useAppMode';
import { ARABIC_FONT_FAMILY, getColors, palette } from '../theme/tokens';

export type AudioTrackMode = 'notebooklm' | 'original';
export type PlaybackSpeed = 1 | 1.25 | 1.5;

const SPEEDS: PlaybackSpeed[] = [1, 1.25, 1.5];

interface NotebookAudioPlayerProps {
  episode?: PodcastEpisode;
  onClose?: () => void;
}

export default function NotebookAudioPlayer({
  episode = abdullahIbnMasudGleaning,
  onClose,
}: NotebookAudioPlayerProps) {
  const { isDark, isKids } = useAppMode();
  const themeColors = getColors(isDark, isKids);

  const [trackMode, setTrackMode] = useState<AudioTrackMode>('notebooklm');
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(episode.durationMs);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);

  // Q&A Drawer State
  const [qaOpen, setQaOpen] = useState(false);
  const [userQuery, setUserQuery] = useState('');
  const [qaHistory, setQaHistory] = useState<
    Array<{ question: string; answer: string; time: string }>
  >([
    {
      question: 'Why does Ibn Mas’ud place intention before action?',
      answer:
        'Ibn Mas’ud draws directly from the Hadith "Actions are according to intentions". Intention is the spiritual foundation that determines if an act is accepted by Allah.',
      time: '0:12',
    },
  ]);
  const [isThinking, setIsThinking] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const segmentY = useRef<number[]>([]);
  const barWidth = useRef(1);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Web Speech Synthesis Engine
  const speakSegment = useCallback(
    (seg: PodcastTimestampSegment) => {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(seg.textEn);
        u.rate = speed;
        u.pitch = seg.speaker === 'Host A' ? 0.95 : 1.15;
        window.speechSynthesis.speak(u);
      }
    },
    [speed],
  );

  const stopSpeech = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const activeIndex = useMemo(() => {
    const idx = episode.timestamps.findIndex(
      (seg) => positionMs >= seg.startMs && positionMs < seg.endMs,
    );
    return idx >= 0 ? idx : 0;
  }, [positionMs, episode.timestamps]);

  const activeSegment = episode.timestamps[activeIndex];

  useEffect(() => {
    if (isPlaying) {
      if (trackMode === 'notebooklm' && activeSegment) {
        speakSegment(activeSegment);
      }
      timerRef.current = setInterval(() => {
        setPositionMs((prev) => {
          if (prev >= durationMs) {
            setIsPlaying(false);
            stopSpeech();
            return 0;
          }
          return prev + 1000 * speed;
        });
      }, 1000);
    } else {
      stopSpeech();
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      stopSpeech();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, durationMs, speed, trackMode, activeSegment, speakSegment]);

  useEffect(() => {
    if (!scrollRef.current) return;
    const y = segmentY.current[activeIndex];
    if (y != null) {
      scrollRef.current.scrollTo({ y: Math.max(0, y - 20), animated: true });
    }
  }, [activeIndex]);

  const togglePlay = () => {
    const next = !isPlaying;
    setIsPlaying(next);
    if (!next) stopSpeech();
  };

  const seekTo = (ms: number) => {
    const clamped = Math.max(0, Math.min(ms, durationMs));
    setPositionMs(clamped);
    if (isPlaying && trackMode === 'notebooklm') {
      const idx = episode.timestamps.findIndex(
        (s) => clamped >= s.startMs && clamped < s.endMs,
      );
      const seg = episode.timestamps[idx >= 0 ? idx : 0];
      if (seg) speakSegment(seg);
    }
  };

  const cycleSpeed = () => {
    const idx = SPEEDS.indexOf(speed);
    const nextSpeed = SPEEDS[(idx + 1) % SPEEDS.length] as PlaybackSpeed;
    setSpeed(nextSpeed);
  };

  const handleAskQuestion = () => {
    if (!userQuery.trim()) return;
    const q = userQuery.trim();
    setUserQuery('');
    setIsThinking(true);

    setTimeout(() => {
      const timeStr = formatClock(positionMs);
      let a = `In this narration, ${episode.title}, Abdullah ibn Mas’ud emphasizes that knowledge is verified through practice and sincere intention (Niyyah).`;
      if (q.toLowerCase().includes('who') || q.toLowerCase().includes('masud')) {
        a = `Abdullah ibn Mas’ud was one of the earliest converts to Islam, a close Companion of Prophet Muhammad ﷺ, and a master scholar of Quranic tafsir.`;
      } else if (q.toLowerCase().includes('action') || q.toLowerCase().includes('work')) {
        a = `Ibn Mas’ud teaches that learning without acting creates intellectual pride. True Islamic knowledge manifests in humility, worship, and service to others.`;
      }

      setQaHistory((prev) => [{ question: q, answer: a, time: timeStr }, ...prev]);
      setIsThinking(false);

      if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance(a);
        u.rate = 1.05;
        window.speechSynthesis.speak(u);
      }
    }, 750);
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.paper }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.badgeRow}>
            <View style={[styles.notebookBadge, { backgroundColor: isDark ? '#78350F' : '#FEF3C7' }]}>
              <Radio size={12} color={isDark ? '#FDE68A' : '#92400E'} />
              <Text style={[styles.notebookBadgeText, { color: isDark ? '#FDE68A' : '#92400E' }]}>
                NotebookLM Audio Engine
              </Text>
            </View>
            <View style={[styles.gradeBadge, { backgroundColor: isDark ? '#115E59' : '#CCFBF1' }]}>
              <CheckCircle2 size={11} color={isDark ? '#5EEAD4' : '#0F766E'} />
              <Text style={[styles.gradeBadgeText, { color: isDark ? '#5EEAD4' : '#0F766E' }]}>
                {episode.authenticityGrade.toUpperCase()}
              </Text>
            </View>
          </View>

          <Text style={[styles.title, { color: themeColors.ink }]}>{episode.title}</Text>
          <Text style={[styles.titleAr, { color: themeColors.gold, fontFamily: ARABIC_FONT_FAMILY }]}>
            {episode.titleAr}
          </Text>
        </View>

        {onClose ? (
          <Pressable onPress={onClose} style={styles.closeBtn} accessibilityRole="button">
            <X size={20} color={themeColors.ink} />
          </Pressable>
        ) : null}
      </View>

      {/* Dual Track Mode Selector */}
      <View style={styles.trackToggleBar}>
        <Pressable
          onPress={() => {
            setTrackMode('notebooklm');
            stopSpeech();
          }}
          style={[
            styles.trackPill,
            { backgroundColor: themeColors.card, borderColor: themeColors.border },
            trackMode === 'notebooklm' && styles.trackPillActiveNotebook,
          ]}
          accessibilityRole="tab"
          accessibilityState={{ selected: trackMode === 'notebooklm' }}
        >
          <Sparkles
            size={14}
            color={trackMode === 'notebooklm' ? '#FFFFFF' : themeColors.gold}
          />
          <Text
            style={[
              styles.trackPillText,
              { color: themeColors.ink },
              trackMode === 'notebooklm' && styles.trackPillTextActive,
            ]}
          >
            2-Host AI Podcast
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            setTrackMode('original');
            stopSpeech();
          }}
          style={[
            styles.trackPill,
            { backgroundColor: themeColors.card, borderColor: themeColors.border },
            trackMode === 'original' && styles.trackPillActiveOriginal,
          ]}
          accessibilityRole="tab"
          accessibilityState={{ selected: trackMode === 'original' }}
        >
          <Volume2
            size={14}
            color={trackMode === 'original' ? '#FFFFFF' : themeColors.emerald}
          />
          <Text
            style={[
              styles.trackPillText,
              { color: themeColors.ink },
              trackMode === 'original' && styles.trackPillTextActive,
            ]}
          >
            Original Stream
          </Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {trackMode === 'original' ? (
          <View style={[styles.videoCard, { backgroundColor: isDark ? '#0F172A' : '#1C1917' }]}>
            <Text style={styles.videoTitle}>
              Shaykh Saleh Ale ash-Shaykh Narration Stream
            </Text>
            {Platform.OS === 'web' ? (
              <iframe
                width="100%"
                height="210"
                src="https://www.youtube-nocookie.com/embed/kexPDupLh0Y?autoplay=1"
                title={episode.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ borderRadius: 16, marginTop: 8 }}
              />
            ) : (
              <View style={styles.fallbackBox}>
                <Volume2 size={28} color={themeColors.emerald} />
                <Text style={styles.fallbackText}>Source: {episode.youtubeUrl}</Text>
              </View>
            )}

            <View style={styles.translationBox}>
              <Text style={styles.translationLabel}>Original Arabic Text & Translation</Text>
              <Text style={[styles.arabicText, { fontFamily: ARABIC_FONT_FAMILY }]}>
                {episode.originalArabicText}
              </Text>
              <Text style={styles.englishText}>{episode.translatedEnglishText}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.visualizerSection}>
            <View style={styles.avatarsRow}>
              <View
                style={[
                  styles.avatarCard,
                  { backgroundColor: themeColors.card, borderColor: themeColors.border },
                  styles.avatarCardA,
                  activeSegment?.speaker === 'Host A' && styles.avatarCardAActive,
                ]}
              >
                <View
                  style={[
                    styles.avatarIconCircle,
                    { backgroundColor: activeSegment?.speaker === 'Host A' ? '#B45309' : '#FEF3C7' },
                  ]}
                >
                  <User
                    size={16}
                    color={activeSegment?.speaker === 'Host A' ? '#FFFFFF' : '#92400E'}
                  />
                </View>
                <View style={styles.avatarInfo}>
                  <Text style={[styles.avatarTitle, { color: themeColors.ink }]}>
                    Host A (Scholar)
                  </Text>
                  <Text style={[styles.avatarRole, { color: themeColors.inkMuted }]}>
                    Context & Tafsir
                  </Text>
                </View>
                {activeSegment?.speaker === 'Host A' && isPlaying ? (
                  <View style={styles.speakingBadge}>
                    <Text style={styles.speakingBadgeText}>🔊 Speaking</Text>
                  </View>
                ) : null}
              </View>

              <View
                style={[
                  styles.avatarCard,
                  { backgroundColor: themeColors.card, borderColor: themeColors.border },
                  styles.avatarCardB,
                  activeSegment?.speaker === 'Host B' && styles.avatarCardBActive,
                ]}
              >
                <View
                  style={[
                    styles.avatarIconCircle,
                    { backgroundColor: activeSegment?.speaker === 'Host B' ? '#0284C7' : '#E0F2FE' },
                  ]}
                >
                  <User
                    size={16}
                    color={activeSegment?.speaker === 'Host B' ? '#FFFFFF' : '#0369A1'}
                  />
                </View>
                <View style={styles.avatarInfo}>
                  <Text style={[styles.avatarTitle, { color: themeColors.ink }]}>
                    Host B (Learner)
                  </Text>
                  <Text style={[styles.avatarRole, { color: themeColors.inkMuted }]}>
                    Questions & Insights
                  </Text>
                </View>
                {activeSegment?.speaker === 'Host B' && isPlaying ? (
                  <View style={[styles.speakingBadge, { backgroundColor: '#0284C7' }]}>
                    <Text style={styles.speakingBadgeText}>🔊 Speaking</Text>
                  </View>
                ) : null}
              </View>
            </View>

            <Text style={[styles.transcriptHeader, { color: themeColors.ink }]}>
              Synchronized Live Transcript
            </Text>

            {episode.timestamps.map((seg, index) => {
              const active = index === activeIndex;
              const isA = seg.speaker === 'Host A';

              return (
                <Pressable
                  key={seg.id}
                  onLayout={(e) => {
                    segmentY.current[index] = e.nativeEvent.layout.y;
                  }}
                  onPress={() => {
                    seekTo(seg.startMs);
                    if (!isPlaying) setIsPlaying(true);
                  }}
                  style={[
                    styles.segCard,
                    { backgroundColor: themeColors.card, borderColor: themeColors.border },
                    isA ? styles.segCardA : styles.segCardB,
                    active && (isDark ? styles.segCardActiveDark : styles.segCardActive),
                  ]}
                  accessibilityRole="button"
                >
                  <View style={styles.segTop}>
                    <Text style={[styles.segSpeaker, isA ? styles.speakerAText : styles.speakerBText]}>
                      {seg.speaker}
                    </Text>
                    <Text style={[styles.segTime, { color: themeColors.inkSubtle }]}>
                      {formatClock(seg.startMs)}
                    </Text>
                  </View>
                  <Text style={[styles.segTextEn, { color: themeColors.ink }, active && styles.segTextEnActive]}>
                    {seg.textEn}
                  </Text>
                  {seg.textAr ? (
                    <Text
                      style={[
                        styles.segTextAr,
                        { color: isDark ? '#5EEAD4' : palette.standard.emerald, fontFamily: ARABIC_FONT_FAMILY },
                      ]}
                    >
                      {seg.textAr}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        )}

        <View
          style={[
            styles.metaCard,
            { backgroundColor: themeColors.card, borderColor: themeColors.border },
          ]}
        >
          <Text style={[styles.metaCardTitle, { color: themeColors.ink }]}>
            Summary & Core Takeaways
          </Text>
          <Text style={[styles.summaryBody, { color: themeColors.inkMuted }]}>
            {episode.summary}
          </Text>

          <View style={styles.takeawaysList}>
            {episode.keyTakeaways.map((point, idx) => (
              <View key={idx} style={styles.takeawayItem}>
                <Sparkles size={12} color={themeColors.gold} />
                <Text style={[styles.takeawayText, { color: themeColors.ink }]}>{point}</Text>
              </View>
            ))}
          </View>

          <Text style={[styles.citation, { color: themeColors.inkSubtle }]}>
            Source: {episode.sourceCitation}
          </Text>
        </View>
      </ScrollView>

      {/* Floating Bottom Waveform Player Bar */}
      <View style={styles.bottomBar}>
        <Pressable
          onLayout={(e) => {
            barWidth.current = e.nativeEvent.layout.width || 1;
          }}
          onPress={(e) => {
            const ratio = Math.max(0, Math.min(1, e.nativeEvent.locationX / barWidth.current));
            seekTo(ratio * durationMs);
          }}
          style={styles.waveTrack}
        >
          <View
            style={[
              styles.waveFill,
              { width: `${durationMs ? (positionMs / durationMs) * 100 : 0}%` },
            ]}
          />
        </Pressable>

        <View style={styles.controlsRow}>
          <Pressable
            onPress={togglePlay}
            style={styles.playBtn}
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause size={20} color="#FFFFFF" fill="#FFFFFF" />
            ) : (
              <Play size={20} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 2 }} />
            )}
          </Pressable>

          <View style={styles.playerMeta}>
            <Text style={styles.playerTitle} numberOfLines={1}>
              {trackMode === 'notebooklm' ? '2-Host AI: ' : 'Narration: '}
              {episode.title}
            </Text>
            <Text style={styles.playerSub}>
              {formatClock(positionMs)} / {formatClock(durationMs)} · {speed}x
            </Text>
          </View>

          <View style={styles.rightGroup}>
            <Pressable onPress={cycleSpeed} style={styles.speedChip} accessibilityRole="button">
              <Gauge size={12} color="#FDE68A" />
              <Text style={styles.speedText}>{speed}x</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setQaOpen(true);
                stopSpeech();
                setIsPlaying(false);
              }}
              style={styles.qaBtn}
              accessibilityRole="button"
            >
              <HelpCircle size={14} color="#FFFFFF" />
              <Text style={styles.qaBtnText}>Ask AI</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <Modal visible={qaOpen} animationType="slide" transparent onRequestClose={() => setQaOpen(false)}>
        <View style={styles.modalScrim}>
          <View style={[styles.drawerCard, { backgroundColor: themeColors.card }]}>
            <View style={styles.drawerHead}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Sparkles size={18} color={themeColors.gold} />
                <Text style={[styles.drawerTitle, { color: themeColors.ink }]}>
                  NotebookLM Story Q&A
                </Text>
              </View>
              <Pressable onPress={() => setQaOpen(false)} style={{ padding: 4 }}>
                <X size={20} color={themeColors.ink} />
              </Pressable>
            </View>

            <Text style={[styles.drawerSub, { color: themeColors.inkMuted }]}>
              Ask contextual questions about {episode.title} and receive AI explanations.
            </Text>

            <ScrollView style={{ maxHeight: 260, marginBottom: 12 }} contentContainerStyle={{ gap: 10 }}>
              {qaHistory.map((item, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.qaItem,
                    { backgroundColor: themeColors.paper, borderColor: themeColors.border },
                  ]}
                >
                  <View style={styles.qHeader}>
                    <MessageSquare size={12} color={themeColors.emerald} />
                    <Text style={[styles.qText, { color: themeColors.ink }]}>"{item.question}"</Text>
                    <Text style={styles.qTime}>{item.time}</Text>
                  </View>
                  <Text style={[styles.aText, { color: themeColors.inkMuted }]}>{item.answer}</Text>
                </View>
              ))}

              {isThinking ? (
                <View style={styles.thinkingBox}>
                  <Sparkles size={14} color={themeColors.gold} />
                  <Text style={styles.thinkingText}>Generating spoken answer...</Text>
                </View>
              ) : null}
            </ScrollView>

            <View style={styles.inputRow}>
              <TextInput
                value={userQuery}
                onChangeText={setUserQuery}
                placeholder="Ask about Ibn Mas'ud or intention..."
                placeholderTextColor={themeColors.inkSubtle}
                style={[
                  styles.input,
                  {
                    backgroundColor: themeColors.paper,
                    color: themeColors.ink,
                    borderColor: themeColors.border,
                  },
                ]}
                onSubmitEditing={handleAskQuestion}
              />
              <Pressable onPress={handleAskQuestion} style={styles.sendBtn}>
                <ChevronRight size={18} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 10,
  },
  headerLeft: { flex: 1, paddingRight: 8 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  notebookBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  notebookBadgeText: { fontSize: 10, fontWeight: '800' },
  gradeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  gradeBadgeText: { fontSize: 10, fontWeight: '800' },
  title: { fontSize: 22, fontWeight: '900' },
  titleAr: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'right',
    marginTop: 2,
  },
  closeBtn: { padding: 4 },

  trackToggleBar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 18,
    marginBottom: 12,
  },
  trackPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
  },
  trackPillActiveNotebook: { backgroundColor: '#B45309', borderColor: '#B45309' },
  trackPillActiveOriginal: { backgroundColor: '#0F766E', borderColor: '#0F766E' },
  trackPillText: { fontSize: 11, fontWeight: '800' },
  trackPillTextActive: { color: '#FFFFFF' },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 18, paddingBottom: 110 },

  videoCard: {
    borderRadius: 20,
    padding: 14,
    marginBottom: 16,
  },
  videoTitle: { fontSize: 13, fontWeight: '800', color: '#FEF3C7', marginBottom: 4 },
  fallbackBox: { padding: 20, alignItems: 'center' },
  fallbackText: { fontSize: 12, color: '#A8A29E', marginTop: 8, textAlign: 'center' },
  translationBox: {
    backgroundColor: '#292524',
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
  },
  translationLabel: { fontSize: 10, fontWeight: '800', color: '#FDE68A', textTransform: 'uppercase' },
  arabicText: { fontSize: 16, color: '#FFFFFF', textAlign: 'right', marginTop: 6, lineHeight: 28 },
  englishText: { fontSize: 13, color: '#D6D3D1', marginTop: 6, lineHeight: 20 },

  visualizerSection: { marginBottom: 16 },
  avatarsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  avatarCard: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarCardA: { borderLeftWidth: 4, borderLeftColor: '#B45309' },
  avatarCardB: { borderLeftWidth: 4, borderLeftColor: '#0284C7' },
  avatarCardAActive: { backgroundColor: '#FEF8E8', borderColor: '#B45309' },
  avatarCardBActive: { backgroundColor: '#F0F9FF', borderColor: '#0284C7' },
  avatarIconCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avatarInfo: { flex: 1 },
  avatarTitle: { fontSize: 11, fontWeight: '800' },
  avatarRole: { fontSize: 9 },
  speakingBadge: {
    backgroundColor: '#B45309',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  speakingBadgeText: { fontSize: 9, fontWeight: '800', color: '#FFFFFF' },

  transcriptHeader: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  segCard: {
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  segCardA: { borderLeftWidth: 3, borderLeftColor: '#B45309' },
  segCardB: { borderLeftWidth: 3, borderLeftColor: '#0284C7' },
  segCardActive: { backgroundColor: '#FEF8E8', borderColor: '#B45309' },
  segCardActiveDark: { backgroundColor: '#3A1D00', borderColor: '#F59E0B' },
  segTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  segSpeaker: { fontSize: 10, fontWeight: '800' },
  speakerAText: { color: '#B45309' },
  speakerBText: { color: '#0284C7' },
  segTime: { fontSize: 10, fontWeight: '600' },
  segTextEn: { fontSize: 13, lineHeight: 20 },
  segTextEnActive: { fontWeight: '700' },
  segTextAr: { fontSize: 13, textAlign: 'right', marginTop: 4 },

  metaCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
  },
  metaCardTitle: { fontSize: 14, fontWeight: '800', marginBottom: 6 },
  summaryBody: { fontSize: 13, lineHeight: 20 },
  takeawaysList: { marginTop: 10, gap: 6 },
  takeawayItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  takeawayText: { fontSize: 12, fontWeight: '600' },
  citation: { fontSize: 11, marginTop: 10 },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1C1917',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
  },
  waveTrack: { height: 4, backgroundColor: '#44403C', borderRadius: 2, marginBottom: 8 },
  waveFill: { height: 4, backgroundColor: '#B45309', borderRadius: 2 },
  controlsRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  playBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#B45309',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerMeta: { flex: 1 },
  playerTitle: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  playerSub: { color: '#A8A29E', fontSize: 11, marginTop: 2 },
  rightGroup: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  speedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(253, 230, 138, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 99,
  },
  speedText: { fontSize: 11, fontWeight: '800', color: '#FDE68A' },
  qaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0F766E',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 99,
  },
  qaBtnText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },

  modalScrim: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  drawerCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
  },
  drawerHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  drawerTitle: { fontSize: 16, fontWeight: '900' },
  drawerSub: { fontSize: 11, marginTop: 2, marginBottom: 12 },
  qaItem: {
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
  },
  qHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  qText: { flex: 1, fontSize: 11, fontWeight: '800' },
  qTime: { fontSize: 9, fontWeight: '700', color: '#92400E', backgroundColor: '#FEF3C7', paddingHorizontal: 4, borderRadius: 4 },
  aText: { fontSize: 12, lineHeight: 18 },
  thinkingBox: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, backgroundColor: '#FEF8E8', borderRadius: 10 },
  thinkingText: { fontSize: 11, fontWeight: '700', color: '#92400E' },
  inputRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  input: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    borderWidth: 1,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#0F766E',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
