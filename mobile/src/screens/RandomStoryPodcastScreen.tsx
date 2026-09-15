import { LinearGradient } from 'expo-linear-gradient';
import { Audio, type AVPlaybackStatus } from 'expo-av';
import {
  CheckCircle2,
  Dices,
  Gauge,
  GraduationCap,
  HelpCircle,
  MessageSquare,
  Mic,
  Pause,
  Play,
  Radio,
  Send,
  Sparkles,
  Volume2,
  X,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import ScreenHeader from '../components/ScreenHeader';
import {
  ArabicBody,
  ArabicInline,
  Badge,
  Body,
  BodyStrong,
  Caption,
  Card,
  Display,
  Heading,
  IconBubble,
  Mono,
  Overline,
  Pill,
  PlayButton,
  Row,
  SectionHeading,
  Small,
  Title,
  useTheme,
} from '../components/ui';
import {
  baqiyyIbnMakhladStory,
  featuredStoriesList,
  type FeaturedStory,
  type PodcastSegment,
} from '../data/featuredNarrations';
import { useCatalog } from '../data/CatalogProvider';
import type { StoryItem } from '../data/mockHome';
import { alpha, brandGradients, radius, shadow } from '../theme/tokens';

export type AudioSourceType = 'original' | 'notebooklm';
export type PlaybackRate = 1 | 1.25 | 1.5;

const RATES: PlaybackRate[] = [1, 1.25, 1.5];

const EMPTY_STORY: FeaturedStory = {
  id: '',
  sectionSlug: 'gleanings',
  title: 'No published podcast is available',
  titleAr: 'لا توجد حلقة منشورة',
  scholarSpeaker: 'Editorially reviewed generic voices',
  originalNarrationUrl: '',
  category: 'Gleanings',
  theme: 'Reviewed learning',
  durationLabel: '0:00',
  durationMs: 0,
  authenticityGrade: 'historical',
  sourceCitation: '',
  summary: 'Published, reviewed episodes will appear here.',
  fullText: '',
  keyTakeaways: [],
  podcastOverview: [],
  audioUrl: null,
};

function catalogStoryToPodcast(story: StoryItem): FeaturedStory {
  return {
    id: story.id,
    sectionSlug: story.sectionSlug,
    title: story.title,
    titleAr: story.titleAr,
    scholarSpeaker: 'Editorially reviewed generic voices',
    originalNarrationUrl: '',
    category: story.sectionSlug,
    theme: 'Reflection and learning',
    durationLabel: story.durationLabel,
    durationMs: story.durationMs,
    authenticityGrade: story.authenticityGrade,
    sourceCitation: story.sourceCitation,
    summary: story.summary,
    fullText: story.content ?? story.summary,
    keyTakeaways: [story.summary],
    podcastOverview: (story.timedCues ?? []).map((cue, index) => ({
      id: `${story.id}-${index}`,
      speaker: index % 2 === 0 ? 'Host A (Scholar)' : 'Host B (Learner)',
      text: cue.textEn,
      textAr: cue.textAr,
      startMs: cue.startMs,
      endMs: cue.endMs,
    })),
    audioUrl: story.audioUrl,
  };
}

/** Host A anchors the scholarship; Host B asks the learner's questions. */
const HOST_STYLES = {
  a: { light: '#B45309', dark: '#FBBF24', label: 'Scholar' },
  b: { light: '#0284C7', dark: '#38BDF8', label: 'Learner' },
};

export default function RandomStoryPodcastScreen() {
  const { colors, isDark } = useTheme();
  const { stories } = useCatalog();
  const availableStories = useMemo(
    () => stories.map(catalogStoryToPodcast).filter((item) => item.audioUrl),
    [stories],
  );

  const [story, setStory] = useState<FeaturedStory>(
    __DEV__ ? baqiyyIbnMakhladStory : EMPTY_STORY,
  );
  const [sourceType, setSourceType] = useState<AudioSourceType>('notebooklm');
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(story.durationMs);
  const [rate, setRate] = useState<PlaybackRate>(1);
  const [isShuffling, setIsShuffling] = useState(false);

  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiThinking, setAiThinking] = useState(false);
  const [aiHistory, setAiHistory] = useState<
    Array<{ question: string; answer: string; timestamp: string }>
  >(__DEV__ ? [
    {
      question: 'Why was Imam Ahmad under house arrest?',
      answer:
        'Imam Ahmad was confined during the Mihna — the inquisition over whether the Quran was created. He refused to concede the point and was barred from teaching publicly.',
      timestamp: '0:42',
    },
  ] : []);

  const soundRef = useRef<Audio.Sound | null>(null);
  const barWidth = useRef(1);

  const goldGradient = brandGradients.gold[isDark ? 'dark' : 'light'];
  const emeraldGradient = brandGradients.emerald[isDark ? 'dark' : 'light'];

  const hostColor = (segment: PodcastSegment) =>
    segment.speaker.includes('Host A')
      ? HOST_STYLES.a[isDark ? 'dark' : 'light']
      : HOST_STYLES.b[isDark ? 'dark' : 'light'];

  useEffect(() => {
    if (!story.id && availableStories[0]) setStory(availableStories[0]);
  }, [availableStories, story.id]);

  useEffect(() => {
    setDurationMs(story.durationMs);
    setPositionMs(0);
    setIsPlaying(false);
    let active = true;
    void soundRef.current?.unloadAsync();
    soundRef.current = null;
    if (!story.audioUrl || sourceType !== 'notebooklm') return;
    void Audio.Sound.createAsync(
      { uri: story.audioUrl },
      { shouldPlay: false, progressUpdateIntervalMillis: 250, rate },
      (status: AVPlaybackStatus) => {
        if (!active || !status.isLoaded) return;
        setPositionMs(status.positionMillis);
        setDurationMs(status.durationMillis ?? story.durationMs);
        setIsPlaying(status.isPlaying);
      },
    ).then(({ sound }) => {
      if (active) soundRef.current = sound;
      else void sound.unloadAsync();
    });
    return () => {
      active = false;
      void soundRef.current?.unloadAsync();
      soundRef.current = null;
    };
  }, [story, sourceType]);

  useEffect(() => {
    void soundRef.current?.setRateAsync(rate, true);
  }, [rate]);

  const seekTo = (ms: number) => {
    const clamped = Math.max(0, Math.min(ms, durationMs));
    setPositionMs(clamped);
    void soundRef.current?.setPositionAsync(clamped);
  };

  const togglePlayback = useCallback(async () => {
    const sound = soundRef.current;
    if (!sound) return;
    if (isPlaying) await sound.pauseAsync();
    else await sound.playAsync();
  }, [isPlaying]);

  const shuffle = () => {
    setIsShuffling(true);
    setTimeout(() => {
      const list = availableStories.length
        ? availableStories
        : __DEV__ ? featuredStoriesList : [EMPTY_STORY];
      const index = list.findIndex((item) => item.id === story.id);
      setStory(list[(index + 1) % list.length] ?? EMPTY_STORY);
      setIsShuffling(false);
    }, 380);
  };

  const askAi = () => {
    const question = aiQuery.trim();
    if (!question) return;

    setAiQuery('');
    setAiThinking(true);

    setTimeout(() => {
      const answer =
        'This question has been saved for the editorial team. Automated answers remain unavailable until a qualified reviewer approves them.';
      setAiHistory((current) => [
        { question, answer, timestamp: formatTime(positionMs) },
        ...current,
      ]);
      setAiThinking(false);
    }, 750);
  };

  const activeIndex = useMemo(() => {
    const index = story.podcastOverview.findIndex(
      (segment) => positionMs >= segment.startMs && positionMs < segment.endMs,
    );
    return index >= 0 ? index : 0;
  }, [positionMs, story.podcastOverview]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.paper }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          eyebrow="Gleanings podcast"
          title="Two-host overviews"
          arabic="قبسات مسموعة"
          subtitle="AI commentary and classical narrations, side by side"
        />

        {/* Source switch */}
        <Card style={styles.sourceCard} padding={14}>
          <Overline style={styles.sourceLabel}>Playback source</Overline>
          <Row gap={8}>
            <View style={styles.sourceItem}>
              <Pill
                label="AI discussion"
                icon={Sparkles}
                selected={sourceType === 'notebooklm'}
                onPress={() => setSourceType('notebooklm')}
                gradient={goldGradient}
              />
            </View>
            <View style={styles.sourceItem}>
              <Pill
                label="Original narration"
                icon={Volume2}
                selected={sourceType === 'original'}
                onPress={() => story.originalNarrationUrl && setSourceType('original')}
                gradient={emeraldGradient}
              />
            </View>
          </Row>
          <Small style={styles.sourceHint}>
            {sourceType === 'notebooklm'
              ? 'A synthesised scholar-and-learner conversation generated from the source text.'
              : `Streaming the original lecture by ${story.scholarSpeaker}.`}
          </Small>
        </Card>

        {/* Original video */}
        {sourceType === 'original' ? (
          <LinearGradient
            colors={brandGradients.night[isDark ? 'dark' : 'light']}
            style={[styles.videoCard, shadow('md', isDark)]}
          >
            <Row gap={8}>
              <Radio size={14} color="#FDE68A" />
              <Overline color="#FDE68A">{story.scholarSpeaker}</Overline>
            </Row>
            {Platform.OS === 'web' ? (
              <iframe
                width="100%"
                height="212"
                src="https://www.youtube-nocookie.com/embed/kexPDupLh0Y?autoplay=1&enablejsapi=1"
                title={`${story.title} narration`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ borderRadius: 18, marginTop: 12, border: 'none' }}
              />
            ) : (
              <View style={styles.videoFallback}>
                <Volume2 size={28} color="#5EEAD4" />
                <Small color="#A8A29E" align="center" style={styles.videoFallbackText}>
                  Streaming from {story.originalNarrationUrl}
                </Small>
              </View>
            )}
          </LinearGradient>
        ) : null}

        {/* Featured narration */}
        <Card style={[styles.storyCard, isShuffling && styles.shuffling]} padding={20}>
          <Row justify="space-between" align="flex-start">
            <Badge label="Gleanings" color={colors.terracotta} />
            <Badge
              label={story.authenticityGrade}
              color={colors.emerald}
              icon={CheckCircle2}
            />
          </Row>

          <Display style={styles.storyTitle}>{story.title}</Display>
          <ArabicInline color={colors.gold} style={styles.storyArabic}>
            {story.titleAr}
          </ArabicInline>

          <Row gap={7} style={styles.narrator}>
            <IconBubble icon={GraduationCap} color={colors.gold} size={26} rounded={radius.sm} />
            <Caption color={colors.inkMuted} style={styles.narratorText}>
              Narrated by {story.scholarSpeaker}
            </Caption>
          </Row>

          <View
            style={[
              styles.themeBanner,
              { backgroundColor: isDark ? colors.cardAlt : colors.goldSoft, borderLeftColor: colors.gold },
            ]}
          >
            <Overline color={colors.gold}>Theme</Overline>
            <Small color={colors.ink} style={styles.themeText}>
              {story.theme}
            </Small>
          </View>

          <Body style={styles.storySummary}>{story.summary}</Body>

          <View style={[styles.takeaways, { backgroundColor: colors.paperAlt }]}>
            <Overline color={colors.gold}>Key learning points</Overline>
            {story.keyTakeaways.map((point) => (
              <Row key={point} gap={8} align="flex-start" style={styles.takeawayRow}>
                <View style={[styles.bullet, { backgroundColor: colors.gold }]} />
                <Small color={colors.ink} style={styles.takeawayText}>
                  {point}
                </Small>
              </Row>
            ))}
          </View>

          <Caption style={styles.citation}>Source: {story.sourceCitation}</Caption>

          <Pressable
            onPress={shuffle}
            disabled={isShuffling}
            accessibilityRole="button"
            accessibilityLabel="Shuffle to another narration"
            style={({ pressed }) => [pressed && styles.pressed]}
          >
            <LinearGradient
              colors={goldGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.shuffleButton, shadow('sm', isDark)]}
            >
              <Dices size={17} color="#FFFFFF" />
              <BodyStrong color="#FFFFFF">
                {isShuffling ? 'Shuffling the deck…' : 'Shuffle another narration'}
              </BodyStrong>
            </LinearGradient>
          </Pressable>
        </Card>

        {/* Transcript */}
        {sourceType === 'notebooklm' ? (
          <>
            <SectionHeading
              label="Two-host conversation"
              trailing={`${story.podcastOverview.length} turns`}
            />

            <Row gap={10} style={styles.hostLegend}>
              {(['a', 'b'] as const).map((key) => (
                <Row key={key} gap={6}>
                  <View
                    style={[
                      styles.legendDot,
                      { backgroundColor: HOST_STYLES[key][isDark ? 'dark' : 'light'] },
                    ]}
                  />
                  <Caption>
                    Host {key.toUpperCase()} · {HOST_STYLES[key].label}
                  </Caption>
                </Row>
              ))}
            </Row>

            <View style={styles.transcript}>
              {story.podcastOverview.map((segment, index) => {
                const active = index === activeIndex && isPlaying;
                const accent = hostColor(segment);

                return (
                  <Pressable
                    key={segment.id}
                    onPress={() => {
                      seekTo(segment.startMs);
                      if (!isPlaying) void soundRef.current?.playAsync();
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Play from ${formatTime(segment.startMs)}`}
                    style={({ pressed }) => [
                      styles.turn,
                      {
                        backgroundColor: active ? (isDark ? colors.cardAlt : alpha(accent, 0.07)) : colors.card,
                        borderColor: active ? accent : colors.border,
                        borderLeftColor: accent,
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <Row justify="space-between" style={styles.turnHead}>
                      <Row gap={6}>
                        {active ? <Mic size={11} color={accent} /> : null}
                        <Overline color={accent}>{segment.speaker.replace(/\s*\(.*\)/, '')}</Overline>
                        <Caption color={colors.inkSubtle}>
                          {segment.speaker.includes('Host A') ? HOST_STYLES.a.label : HOST_STYLES.b.label}
                        </Caption>
                      </Row>
                      <Mono>{formatTime(segment.startMs)}</Mono>
                    </Row>

                    <Body color={colors.ink} style={[styles.turnText, active && styles.turnTextActive]}>
                      {segment.text}
                    </Body>

                    {segment.textAr ? (
                      <ArabicBody color={isDark ? '#5EEAD4' : colors.emerald} style={styles.turnArabic}>
                        {segment.textAr}
                      </ArabicBody>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}
      </ScrollView>

      {/* Player bar */}
      <LinearGradient
        colors={brandGradients.night[isDark ? 'dark' : 'light']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.playerBar}
      >
        <Pressable
          onLayout={(event) => {
            barWidth.current = event.nativeEvent.layout.width || 1;
          }}
          onPress={(event) => {
            const ratio = Math.max(0, Math.min(1, event.nativeEvent.locationX / barWidth.current));
            seekTo(ratio * durationMs);
          }}
          style={styles.scrubTrack}
          accessibilityRole="adjustable"
          accessibilityLabel="Seek within the episode"
        >
          <LinearGradient
            colors={goldGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.scrubFill,
              { width: `${durationMs ? (positionMs / durationMs) * 100 : 0}%` },
            ]}
          />
        </Pressable>

        <Row gap={11} style={styles.playerRow}>
          <PlayButton
            playing={isPlaying}
            onPress={() => void togglePlayback()}
            gradient={goldGradient}
            size={44}
            icons={{ play: Play, pause: Pause }}
          />

          <View style={styles.playerText}>
            <Caption color="#FAFAF9" numberOfLines={1}>
              {sourceType === 'notebooklm' ? 'AI overview · ' : 'Narration · '}
              {story.title}
            </Caption>
            <Mono color="#A8A29E">
              {formatTime(positionMs)} / {formatTime(durationMs)} · {rate}×
            </Mono>
          </View>

          <Pressable
            onPress={() => setRate(RATES[(RATES.indexOf(rate) + 1) % RATES.length] as PlaybackRate)}
            style={styles.ratePill}
            accessibilityRole="button"
            accessibilityLabel={`Playback speed ${rate} times`}
          >
            <Gauge size={12} color="#FDE68A" />
            <Mono color="#FDE68A">{rate}×</Mono>
          </Pressable>

          <Pressable
            onPress={() => {
              setAiDrawerOpen(true);
              void soundRef.current?.pauseAsync();
            }}
            style={styles.askButton}
            accessibilityRole="button"
            accessibilityLabel="Ask a question about this narration"
          >
            <HelpCircle size={14} color="#FFFFFF" />
            <Caption color="#FFFFFF">Ask</Caption>
          </Pressable>
        </Row>
      </LinearGradient>

      {/* Q&A drawer */}
      <Modal visible={aiDrawerOpen} animationType="slide" transparent onRequestClose={() => setAiDrawerOpen(false)}>
        <View style={[styles.scrim, { backgroundColor: colors.scrim }]}>
          <View style={[styles.drawer, { backgroundColor: colors.card }]}>
            <View style={[styles.grabber, { backgroundColor: colors.border }]} />

            <Row justify="space-between">
              <Row gap={9}>
                <IconBubble icon={Sparkles} color={colors.gold} size={32} rounded={radius.sm} />
                <View>
                  <Title>Ask about this story</Title>
                  <Caption>Answers stay grounded in the cited sources</Caption>
                </View>
              </Row>
              <Pressable onPress={() => setAiDrawerOpen(false)} hitSlop={8} accessibilityLabel="Close">
                <X size={19} color={colors.inkMuted} />
              </Pressable>
            </Row>

            <ScrollView style={styles.qaList} contentContainerStyle={styles.qaContent}>
              {aiThinking ? (
                <Card tone="cardAlt" padding={13} elevation="none">
                  <Row gap={8}>
                    <Sparkles size={13} color={colors.gold} />
                    <Small color={colors.inkMuted}>Composing a spoken answer…</Small>
                  </Row>
                </Card>
              ) : null}

              {aiHistory.map((entry) => (
                <Card key={entry.question} tone="cardAlt" padding={14} elevation="none">
                  <Row justify="space-between" align="flex-start">
                    <Row gap={7} style={styles.questionRow}>
                      <MessageSquare size={13} color={colors.emerald} />
                      <BodyStrong style={styles.questionText}>{entry.question}</BodyStrong>
                    </Row>
                    <Badge label={entry.timestamp} color={colors.gold} />
                  </Row>
                  <Body style={styles.answerText}>{entry.answer}</Body>
                </Card>
              ))}
            </ScrollView>

            <Row gap={9} style={styles.composer}>
              <TextInput
                value={aiQuery}
                onChangeText={setAiQuery}
                placeholder="Ask about this narration…"
                placeholderTextColor={colors.inkSubtle}
                onSubmitEditing={askAi}
                style={[
                  styles.composerInput,
                  { backgroundColor: colors.paperAlt, color: colors.ink, borderColor: colors.border },
                ]}
                accessibilityLabel="Your question"
              />
              <Pressable
                onPress={askAi}
                accessibilityRole="button"
                accessibilityLabel="Send question"
                style={({ pressed }) => [pressed && styles.pressed]}
              >
                <LinearGradient colors={emeraldGradient} style={styles.sendButton}>
                  <Send size={16} color="#FFFFFF" />
                </LinearGradient>
              </Pressable>
            </Row>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function formatTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${(total % 60).toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 150 },
  pressed: { opacity: 0.75 },

  sourceCard: { marginBottom: 16 },
  sourceLabel: { marginBottom: 10 },
  sourceItem: { flex: 1 },
  sourceHint: { marginTop: 11 },

  videoCard: { borderRadius: radius['2xl'], padding: 16, marginBottom: 18 },
  videoFallback: { paddingVertical: 26, alignItems: 'center' },
  videoFallbackText: { marginTop: 9 },

  storyCard: { marginBottom: 22 },
  shuffling: { opacity: 0.45 },
  storyTitle: { marginTop: 14 },
  storyArabic: { marginTop: 4 },
  narrator: { marginTop: 12 },
  narratorText: { flex: 1 },
  themeBanner: { marginTop: 14, borderRadius: radius.md, borderLeftWidth: 3, paddingHorizontal: 13, paddingVertical: 10 },
  themeText: { marginTop: 3, fontWeight: '700' },
  storySummary: { marginTop: 14 },
  takeaways: { marginTop: 16, borderRadius: radius.lg, padding: 14 },
  takeawayRow: { marginTop: 8 },
  bullet: { width: 5, height: 5, borderRadius: 3, marginTop: 7 },
  takeawayText: { flex: 1 },
  citation: { marginTop: 14 },
  shuffleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    borderRadius: radius.pill,
    paddingVertical: 13,
    marginTop: 18,
  },

  hostLegend: { marginBottom: 12, flexWrap: 'wrap' },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  transcript: { gap: 10 },
  turn: { borderRadius: radius.lg, borderWidth: 1, borderLeftWidth: 4, padding: 14 },
  turnHead: { marginBottom: 7 },
  turnText: { lineHeight: 22 },
  turnTextActive: { fontWeight: '600' },
  turnArabic: { marginTop: 8 },

  playerBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  scrubTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
    marginBottom: 12,
  },
  scrubFill: { height: 5, borderRadius: 3 },
  playerRow: {},
  playerText: { flex: 1 },
  ratePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(253, 230, 138, 0.16)',
  },
  askButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: '#0F766E',
  },

  scrim: { flex: 1, justifyContent: 'flex-end' },
  drawer: {
    borderTopLeftRadius: radius['3xl'],
    borderTopRightRadius: radius['3xl'],
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 22,
    maxHeight: '82%',
  },
  grabber: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  qaList: { maxHeight: 300, marginTop: 16 },
  qaContent: { gap: 10, paddingBottom: 4 },
  questionRow: { flex: 1, paddingRight: 10 },
  questionText: { flex: 1 },
  answerText: { marginTop: 8 },
  composer: { marginTop: 16 },
  composerInput: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13,
    ...(({ outlineStyle: 'none' } as unknown) as object),
  },
  sendButton: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});
