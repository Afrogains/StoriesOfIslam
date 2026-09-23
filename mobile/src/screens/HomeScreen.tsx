import { BookOpen, Headphones } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenHeader from '../components/ScreenHeader';
import StorySessionModal, { type StorySessionMode } from '../components/StorySessionModal';
import {
  ArabicInline,
  Body,
  Caption,
  Heading,
  Overline,
  ProgressBar,
  Row,
  SectionHeading,
  useTheme,
} from '../components/ui';
import { useCatalog } from '../data/CatalogProvider';
import {
  useLastActiveStory,
  type LastActiveMode,
} from '../hooks/useLastActiveStory';
import { usePlaybackProgress } from '../hooks/usePlaybackProgress';
import { useReadingBookmark } from '../hooks/useReadingBookmark';
import { BODY_FONT_FAMILY, brandGradients, radius, shadow } from '../theme/tokens';
import type { StoryItem } from '../types/catalog';

function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Infer whether the user should resume reading or listening when the stored
 * mode is missing — prefer the progress type that actually has saved state.
 */
function resolveResumeMode(
  stored: LastActiveMode | null,
  audioMs: number,
  readY: number,
  hasAudio: boolean,
): Exclude<StorySessionMode, null> {
  if (stored === 'read' || stored === 'listen') return stored;
  if (audioMs > 0 && readY <= 0) return 'listen';
  if (readY > 0 && audioMs <= 0) return 'read';
  if (audioMs > 0 && readY > 0) return audioMs >= 5_000 ? 'listen' : 'read';
  return hasAudio ? 'listen' : 'read';
}

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { stories } = useCatalog();
  const { lastActive, refresh, markActive } = useLastActiveStory();

  const [activeStory, setActiveStory] = useState<StoryItem | null>(null);
  const [sessionMode, setSessionMode] = useState<StorySessionMode>(null);

  const continueStory = useMemo(() => {
    if (!stories.length) return null;
    if (lastActive.storyId) {
      const match = stories.find((story) => story.id === lastActive.storyId);
      if (match) return match;
    }
    return stories.find((story) => story.hasAudio) ?? stories[0] ?? null;
  }, [stories, lastActive.storyId]);

  const storyId = continueStory?.id ?? '';
  const { load: loadAudioProgress } = usePlaybackProgress(storyId || 'none');
  const { load: loadReadBookmark } = useReadingBookmark(storyId || 'none');
  const [audioMs, setAudioMs] = useState(0);
  const [readY, setReadY] = useState(0);

  useEffect(() => {
    void refresh();
  }, [refresh, stories.length]);

  useEffect(() => {
    if (!continueStory) {
      setAudioMs(0);
      setReadY(0);
      return;
    }
    void loadAudioProgress().then(setAudioMs);
    void loadReadBookmark().then(setReadY);
  }, [continueStory, loadAudioProgress, loadReadBookmark]);

  const resumeMode = continueStory
    ? resolveResumeMode(
        lastActive.mode,
        audioMs,
        readY,
        continueStory.hasAudio,
      )
    : 'read';

  const audioProgress =
    continueStory && continueStory.durationMs > 0
      ? Math.min(1, audioMs / continueStory.durationMs)
      : 0;

  const openResume = () => {
    if (!continueStory) return;
    void markActive(continueStory.id, resumeMode);
    setActiveStory(continueStory);
    setSessionMode(resumeMode);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.paper }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          eyebrow="Assalamu alaikum"
          title="Stories of Islam"
          arabic="السلام عليكم ورحمة الله"
        />

        <SectionHeading label="Resume Learning" trailing="Pick up where you left off" />

        {continueStory ? (
          <LinearGradient
            colors={brandGradients.night[isDark ? 'dark' : 'light']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.continueBar, shadow('lg', isDark)]}
          >
            <Overline color="#FDE68A">Last active story</Overline>
            <Heading color="#FFFFFF" style={styles.continueTitle} numberOfLines={2}>
              {continueStory.title}
            </Heading>
            <ArabicInline color="#FDE68A" style={styles.continueArabic}>
              {continueStory.titleAr}
            </ArabicInline>
            <Caption color="#CBD5E1" style={styles.continueFigure}>
              {continueStory.figureName} · {continueStory.honorific}
            </Caption>

            <View style={styles.progressBlock}>
              <ProgressBar
                value={resumeMode === 'listen' ? audioProgress : readY > 0 ? 0.35 : 0}
                gradient={brandGradients.gold[isDark ? 'dark' : 'light']}
                trackColor="rgba(255,255,255,0.14)"
                height={5}
              />
              <Caption color="#94A3B8" style={styles.progressMeta}>
                {resumeMode === 'listen'
                  ? `Listening ${formatClock(audioMs)} / ${continueStory.durationLabel}`
                  : readY > 0
                    ? 'Reading bookmark saved'
                    : 'Start reading from the beginning'}
              </Caption>
            </View>

            <Pressable
              onPress={openResume}
              accessibilityRole="button"
              accessibilityLabel={
                resumeMode === 'listen'
                  ? `Resume listening to ${continueStory.title}`
                  : `Resume reading ${continueStory.title}`
              }
              style={({ pressed }) => [
                styles.resumeCta,
                resumeMode === 'listen' ? styles.resumeListen : styles.resumeRead,
                pressed && styles.pressed,
              ]}
            >
              {resumeMode === 'listen' ? (
                <Headphones size={15} color="#0F172A" />
              ) : (
                <BookOpen size={15} color="#FFFFFF" />
              )}
              <Text
                style={
                  resumeMode === 'listen' ? styles.resumeListenLabel : styles.resumeReadLabel
                }
              >
                {resumeMode === 'listen' ? 'Resume Listening' : 'Resume Reading'}
              </Text>
            </Pressable>
          </LinearGradient>
        ) : (
          <View
            style={[
              styles.emptyContinue,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Body color={colors.inkMuted}>
              Open a story from Explore to begin. Your last active story will
              appear here for quick resume.
            </Body>
            <Caption color={colors.emerald}>Browse Explore to start learning</Caption>
          </View>
        )}
      </ScrollView>

      <StorySessionModal
        story={activeStory}
        mode={sessionMode}
        onChangeMode={(mode) => {
          setSessionMode(mode);
          if (!mode) {
            setActiveStory(null);
            void refresh();
          } else if (activeStory) {
            void markActive(activeStory.id, mode);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 130 },
  continueBar: {
    borderRadius: radius['3xl'],
    padding: 20,
    marginTop: 4,
    gap: 4,
  },
  continueTitle: { marginTop: 8 },
  continueArabic: { marginTop: 2 },
  continueFigure: { marginTop: 6 },
  progressBlock: { marginTop: 16, gap: 8 },
  progressMeta: { marginTop: 2 },
  resumeCta: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: radius.md,
  },
  resumeRead: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  resumeListen: {
    backgroundColor: '#FDE68A',
  },
  resumeReadLabel: {
    fontFamily: BODY_FONT_FAMILY,
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  resumeListenLabel: {
    fontFamily: BODY_FONT_FAMILY,
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  pressed: { opacity: 0.82 },
  emptyContinue: {
    borderWidth: 1,
    borderRadius: radius['2xl'],
    padding: 18,
    gap: 10,
  },
});
