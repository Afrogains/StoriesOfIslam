import { BookOpen, Headphones } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ModeToggle from '../components/ModeToggle';
import StorySessionModal, { type StorySessionMode } from '../components/StorySessionModal';
import {
  ArabicInline,
  Body,
  BodyStrong,
  Caption,
  Overline,
  ProgressBar,
  Row,
  Small,
  useTheme,
} from '../components/ui';
import { useCatalog } from '../data/CatalogProvider';
import { pickCrossCategorySuggestions } from '../data/catalogBrowse';
import { sectionsMeta } from '../data/catalogMeta';
import {
  useLastActiveStory,
  type LastActiveMode,
} from '../hooks/useLastActiveStory';
import { usePlaybackProgress } from '../hooks/usePlaybackProgress';
import { useReadingBookmark } from '../hooks/useReadingBookmark';
import {
  BODY_FONT_FAMILY,
  alpha,
  brandGradients,
  radius,
  sectionAccent,
  shadow,
} from '../theme/tokens';
import type { StoryItem } from '../types/catalog';

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

function SuggestionRow({
  story,
  onRead,
  onListen,
}: {
  story: StoryItem;
  onRead: () => void;
  onListen: () => void;
}) {
  const { colors, isDark } = useTheme();
  const meta = sectionsMeta[story.sectionSlug];
  const accent = sectionAccent(story.sectionSlug, isDark);
  const canListen = Boolean(story.hasAudio || story.audioUrl || story.content);

  return (
    <View
      style={[
        styles.suggestRow,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={[styles.suggestAccent, { backgroundColor: accent.primary }]} />
      <View style={styles.suggestCopy}>
        <Caption color={accent.primary} numberOfLines={1}>
          {meta.title}
        </Caption>
        <BodyStrong numberOfLines={1} style={styles.suggestTitle}>
          {story.title}
        </BodyStrong>
        <Small color={colors.inkMuted} numberOfLines={1}>
          {story.figureName}
          {story.hasAudio ? ` · ${story.durationLabel}` : ''}
        </Small>
      </View>
      <Row gap={6}>
        <Pressable
          onPress={onRead}
          accessibilityRole="button"
          accessibilityLabel={`Read ${story.title}`}
          style={({ pressed }) => [
            styles.miniCta,
            {
              borderColor: accent.primary,
              backgroundColor: isDark ? alpha(accent.primary, 0.12) : accent.surface,
              opacity: pressed ? 0.75 : 1,
            },
          ]}
        >
          <BookOpen size={13} color={accent.primary} />
        </Pressable>
        <Pressable
          onPress={onListen}
          disabled={!canListen}
          accessibilityRole="button"
          accessibilityLabel={`Listen to ${story.title}`}
          style={({ pressed }) => [
            styles.miniCta,
            styles.miniCtaSolid,
            {
              backgroundColor: canListen ? accent.primary : colors.subtleBg,
              opacity: !canListen ? 0.4 : pressed ? 0.75 : 1,
            },
          ]}
        >
          <Headphones size={13} color="#FFFFFF" />
        </Pressable>
      </Row>
    </View>
  );
}

/**
 * Home — one calm composition: greeting, resume, and four cross-category
 * suggestions. Browse/search live on Explore.
 */
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
    ? resolveResumeMode(lastActive.mode, audioMs, readY, continueStory.hasAudio)
    : 'read';

  const audioProgress =
    continueStory && continueStory.durationMs > 0
      ? Math.min(1, audioMs / continueStory.durationMs)
      : 0;

  const suggested = useMemo(
    () =>
      pickCrossCategorySuggestions(stories, {
        excludeId: continueStory?.id,
      }),
    [stories, continueStory?.id],
  );

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

  const resumeSection = continueStory
    ? sectionsMeta[continueStory.sectionSlug]?.title
    : null;

  return (
    <View style={[styles.screen, { backgroundColor: colors.paper }]}>
      <LinearGradient
        colors={
          isDark
            ? ['#0B3B32', '#0F172A', '#0F172A']
            : ['#D1FAE5', '#FCFBF7', '#FCFBF7']
        }
        locations={[0, 0.42, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Row justify="space-between" align="flex-start" style={styles.top}>
          <View style={styles.brand}>
            <Overline color={colors.emerald}>Assalamu alaikum</Overline>
            <Text style={[styles.brandTitle, { color: colors.ink }]}>Stories of Islam</Text>
            <ArabicInline color={colors.gold} style={styles.brandArabic}>
              السلام عليكم ورحمة الله
            </ArabicInline>
          </View>
          <ModeToggle />
        </Row>

        {continueStory ? (
          <LinearGradient
            colors={brandGradients.night[isDark ? 'dark' : 'light']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.resume, shadow('md', isDark)]}
          >
            <Row justify="space-between" align="center">
              <Overline color="#FDE68A">Continue</Overline>
              {resumeSection ? (
                <Caption color="#94A3B8">{resumeSection}</Caption>
              ) : null}
            </Row>

            <BodyStrong color="#FFFFFF" style={styles.resumeTitle} numberOfLines={2}>
              {continueStory.title}
            </BodyStrong>
            <Caption color="#94A3B8" style={styles.resumeMeta} numberOfLines={1}>
              {continueStory.figureName}
              {resumeMode === 'listen'
                ? ` · ${formatClock(audioMs)} / ${continueStory.durationLabel}`
                : readY > 0
                  ? ' · reading bookmark'
                  : ''}
            </Caption>

            <ProgressBar
              value={resumeMode === 'listen' ? audioProgress : readY > 0 ? 0.28 : 0}
              gradient={brandGradients.gold[isDark ? 'dark' : 'light']}
              trackColor="rgba(255,255,255,0.14)"
              height={3}
            />

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
              Open a story from Explore — it will land here for quick resume.
            </Body>
          </View>
        )}

        <Row justify="space-between" align="center" style={styles.suggestHead}>
          <Overline>Today’s path</Overline>
          <Caption color={colors.inkSubtle}>One from each category</Caption>
        </Row>

        {suggested.length === 0 ? (
          <Caption color={colors.inkMuted}>No suggestions yet.</Caption>
        ) : (
          <View style={styles.suggestList}>
            {suggested.map((story) => (
              <SuggestionRow
                key={story.id}
                story={story}
                onRead={() => openStory(story, 'read')}
                onListen={() => openStory(story, 'listen')}
              />
            ))}
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
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120,
  },
  top: { marginBottom: 18 },
  brand: { flex: 1, paddingRight: 12 },
  brandTitle: {
    fontFamily: BODY_FONT_FAMILY,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginTop: 2,
  },
  brandArabic: { marginTop: 2, fontSize: 16, lineHeight: 26 },
  resume: {
    borderRadius: radius['2xl'],
    padding: 16,
    gap: 8,
    marginBottom: 22,
  },
  resumeTitle: { fontSize: 16, lineHeight: 22 },
  resumeMeta: { marginBottom: 4 },
  resumeCta: {
    marginTop: 6,
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
    marginBottom: 22,
  },
  suggestHead: { marginBottom: 10 },
  suggestList: { gap: 8 },
  suggestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: 10,
    paddingRight: 10,
    paddingLeft: 0,
    overflow: 'hidden',
  },
  suggestAccent: {
    width: 3,
    alignSelf: 'stretch',
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  suggestCopy: { flex: 1, minWidth: 0, paddingLeft: 10, gap: 1 },
  suggestTitle: { fontSize: 14 },
  miniCta: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniCtaSolid: { borderWidth: 0 },
});
