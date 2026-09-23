import { BookOpen, Headphones } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenHeader from '../components/ScreenHeader';
import StoryCard, { sectionIcons } from '../components/StoryCard';
import StorySessionModal, { type StorySessionMode } from '../components/StorySessionModal';
import {
  Body,
  Caption,
  Heading,
  Overline,
  Pill,
  ProgressBar,
  Row,
  SectionHeading,
  useTheme,
} from '../components/ui';
import { useCatalog } from '../data/CatalogProvider';
import { SECTION_ORDER, pickCrossCategorySuggestions } from '../data/catalogBrowse';
import { sectionsMeta } from '../data/catalogMeta';
import {
  useLastActiveStory,
  type LastActiveMode,
} from '../hooks/useLastActiveStory';
import { usePlaybackProgress } from '../hooks/usePlaybackProgress';
import { useReadingBookmark } from '../hooks/useReadingBookmark';
import { BODY_FONT_FAMILY, brandGradients, radius, sectionAccent, shadow } from '../theme/tokens';
import type { SectionSlug, StoryItem } from '../types/catalog';

function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

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

const SECTION_PREVIEW_LIMIT = 3;

/** Lean home: resume + section chips + cross-category suggested picks. */
export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { stories } = useCatalog();
  const { lastActive, refresh, markActive } = useLastActiveStory();

  const [spotlight, setSpotlight] = useState<SectionSlug | 'all'>('all');
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
    ? resolveResumeMode(lastActive.mode, audioMs, readY, continueStory.hasAudio)
    : 'read';

  const audioProgress =
    continueStory && continueStory.durationMs > 0
      ? Math.min(1, audioMs / continueStory.durationMs)
      : 0;

  const suggested = useMemo(() => {
    if (spotlight === 'all') {
      return pickCrossCategorySuggestions(stories, {
        excludeId: continueStory?.id,
        limit: SECTION_ORDER.length,
      });
    }
    return stories
      .filter((story) => story.sectionSlug === spotlight && story.id !== continueStory?.id)
      .slice(0, SECTION_PREVIEW_LIMIT);
  }, [stories, spotlight, continueStory?.id]);

  const emeraldGradient = brandGradients.emerald[isDark ? 'dark' : 'light'];

  const openResume = () => {
    if (!continueStory) return;
    void markActive(continueStory.id, resumeMode);
    setActiveStory(continueStory);
    setSessionMode(resumeMode);
  };

  const openStory = (story: StoryItem, mode: Exclude<StorySessionMode, null>) => {
    void markActive(story.id, mode);
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

        <SectionHeading label="Resume" trailing="Pick up where you left off" />

        {continueStory ? (
          <LinearGradient
            colors={brandGradients.night[isDark ? 'dark' : 'light']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.resumeBar, shadow('md', isDark)]}
          >
            <Overline color="#FDE68A">Last active</Overline>
            <Heading color="#FFFFFF" style={styles.resumeTitle} numberOfLines={2}>
              {continueStory.title}
            </Heading>
            <Caption color="#94A3B8" style={styles.resumeMeta}>
              {continueStory.figureName}
              {resumeMode === 'listen'
                ? ` · ${formatClock(audioMs)} / ${continueStory.durationLabel}`
                : readY > 0
                  ? ' · bookmark saved'
                  : ''}
            </Caption>
            <View style={styles.resumeProgress}>
              <ProgressBar
                value={resumeMode === 'listen' ? audioProgress : readY > 0 ? 0.28 : 0}
                gradient={brandGradients.gold[isDark ? 'dark' : 'light']}
                trackColor="rgba(255,255,255,0.14)"
                height={4}
              />
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
                <Headphones size={14} color="#0F172A" />
              ) : (
                <BookOpen size={14} color="#FFFFFF" />
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
              styles.emptyResume,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Body color={colors.inkMuted}>
              Browse Explore to start a story. It will appear here next time.
            </Body>
          </View>
        )}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.pills}
          contentContainerStyle={styles.pillsContent}
        >
          <Pill
            label="Across categories"
            selected={spotlight === 'all'}
            onPress={() => setSpotlight('all')}
            gradient={emeraldGradient}
          />
          {SECTION_ORDER.map((slug) => (
            <Pill
              key={slug}
              label={sectionsMeta[slug].title}
              icon={sectionIcons[slug]}
              selected={spotlight === slug}
              onPress={() => setSpotlight(slug)}
              gradient={sectionAccent(slug, isDark).accentGradient}
            />
          ))}
        </ScrollView>

        <SectionHeading
          label={spotlight === 'all' ? 'Suggested for you' : sectionsMeta[spotlight].title}
          trailing={
            spotlight === 'all'
              ? 'One from each category'
              : `${suggested.length} picks`
          }
        />

        {suggested.length === 0 ? (
          <Caption color={colors.inkMuted}>No other stories in this collection yet.</Caption>
        ) : (
          <View style={styles.list}>
            {suggested.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                variant="compact"
                onRead={() => openStory(story, 'read')}
                onListen={() => openStory(story, 'listen')}
              />
            ))}
          </View>
        )}

        <Caption color={colors.inkSubtle} style={styles.exploreHint}>
          Full catalog, search, and filters live on Explore.
        </Caption>
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
  content: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 120 },
  resumeBar: {
    borderRadius: radius['2xl'],
    padding: 16,
    marginTop: 2,
    marginBottom: 14,
  },
  resumeTitle: { marginTop: 6 },
  resumeMeta: { marginTop: 4 },
  resumeProgress: { marginTop: 12 },
  resumeCta: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 11,
    borderRadius: radius.md,
  },
  resumeRead: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  resumeListen: { backgroundColor: '#FDE68A' },
  resumeReadLabel: {
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
  emptyResume: {
    borderWidth: 1,
    borderRadius: radius['2xl'],
    padding: 16,
    marginBottom: 14,
  },
  pills: { marginBottom: 12, overflow: 'visible' },
  pillsContent: { gap: 8, paddingRight: 4 },
  list: { gap: 10 },
  exploreHint: { marginTop: 16, textAlign: 'center' },
});
