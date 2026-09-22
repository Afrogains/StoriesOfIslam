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
import { useLastActiveStoryId } from '../hooks/useLastActiveStory';
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

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { stories } = useCatalog();
  const { lastStoryId, refresh, markActive } = useLastActiveStoryId();

  const [activeStory, setActiveStory] = useState<StoryItem | null>(null);
  const [sessionMode, setSessionMode] = useState<StorySessionMode>(null);

  const continueStory = useMemo(() => {
    if (!stories.length) return null;
    if (lastStoryId) {
      const match = stories.find((story) => story.id === lastStoryId);
      if (match) return match;
    }
    return stories.find((story) => story.hasAudio) ?? stories[0] ?? null;
  }, [stories, lastStoryId]);

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

  const audioProgress =
    continueStory && continueStory.durationMs > 0
      ? Math.min(1, audioMs / continueStory.durationMs)
      : 0;

  const openSession = (story: StoryItem, mode: Exclude<StorySessionMode, null>) => {
    void markActive(story.id);
    setActiveStory(story);
    setSessionMode(mode);
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

        <SectionHeading label="Continue Learning" trailing="Resume progress" />

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
                value={audioProgress}
                gradient={brandGradients.gold[isDark ? 'dark' : 'light']}
                trackColor="rgba(255,255,255,0.14)"
                height={5}
              />
              <Row justify="space-between" style={styles.progressMeta}>
                <Caption color="#94A3B8">
                  Listening {formatClock(audioMs)} / {continueStory.durationLabel}
                </Caption>
                <Caption color="#FDE68A">
                  {readY > 0 ? 'Reading bookmark saved' : 'Fresh reading position'}
                </Caption>
              </Row>
            </View>

            <Row gap={10} style={styles.ctaRow}>
              <Pressable
                onPress={() => openSession(continueStory, 'read')}
                accessibilityRole="button"
                accessibilityLabel={`Resume reading ${continueStory.title}`}
                style={({ pressed }) => [styles.resumeRead, pressed && styles.pressed]}
              >
                <BookOpen size={14} color="#FFFFFF" />
                <Text style={styles.resumeLabel}>Resume Reading</Text>
              </Pressable>
              <Pressable
                onPress={() => openSession(continueStory, 'listen')}
                accessibilityRole="button"
                accessibilityLabel={`Resume listening to ${continueStory.title}`}
                style={({ pressed }) => [styles.resumeListen, pressed && styles.pressed]}
              >
                <Headphones size={14} color="#0F172A" />
                <Text style={styles.resumeListenLabel}>Resume Listening</Text>
              </Pressable>
            </Row>
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
            void markActive(activeStory.id);
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
  progressBlock: { marginTop: 16 },
  progressMeta: { marginTop: 8 },
  ctaRow: { marginTop: 16 },
  resumeRead: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  resumeListen: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: '#FDE68A',
  },
  resumeLabel: {
    fontFamily: BODY_FONT_FAMILY,
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  resumeListenLabel: {
    fontFamily: BODY_FONT_FAMILY,
    fontSize: 12,
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
