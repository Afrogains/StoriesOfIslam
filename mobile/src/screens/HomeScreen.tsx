import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { BookOpen, ChevronRight, Headphones } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { RootTabParamList } from '../../App';
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
  DISPLAY_FONT_FAMILY,
  alpha,
  brandGradients,
  radius,
  sectionAccent,
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

function preferredMode(story: StoryItem): Exclude<StorySessionMode, null> {
  return story.hasAudio || Boolean(story.audioUrl) ? 'listen' : 'read';
}

/**
 * Home — brand, one resume action, a short story list, and two clear paths
 * out to Explore / The Names. Browse and search stay on Explore.
 */
export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
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

  const hasProgress = Boolean(
    lastActive.storyId && continueStory && (audioMs > 0 || readY > 0 || lastActive.mode),
  );

  const suggested = useMemo(
    () =>
      pickCrossCategorySuggestions(stories, {
        excludeId: continueStory?.id,
        limit: 3,
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

  const divider = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)';

  return (
    <View style={[styles.screen, { backgroundColor: colors.paper }]}>
      <LinearGradient
        colors={
          isDark
            ? ['#0B3B32', '#0F172A', '#0F172A']
            : ['#D1FAE5', '#FCFBF7', '#FCFBF7']
        }
        locations={[0, 0.38, 1]}
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
            <Text style={[styles.brandTitle, { color: colors.ink }]}>Stories of Islam</Text>
            <Body color={colors.inkMuted} style={styles.tagline}>
              Classical stories to read or listen — simply.
            </Body>
            <ArabicInline color={colors.emerald} style={styles.brandArabic}>
              السلام عليكم ورحمة الله
            </ArabicInline>
          </View>
          <ModeToggle />
        </Row>

        {continueStory ? (
          <Pressable
            onPress={openResume}
            accessibilityRole="button"
            accessibilityLabel={
              hasProgress
                ? resumeMode === 'listen'
                  ? `Continue listening to ${continueStory.title}`
                  : `Continue reading ${continueStory.title}`
                : `Start ${continueStory.title}`
            }
            style={({ pressed }) => [styles.primaryBlock, pressed && styles.pressed]}
          >
            <LinearGradient
              colors={brandGradients.night[isDark ? 'dark' : 'light']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryInner}
            >
              <Overline color="#FDE68A">{hasProgress ? 'Continue' : 'Start here'}</Overline>
              <Text style={styles.primaryTitle} numberOfLines={2}>
                {continueStory.title}
              </Text>
              <Caption color="#94A3B8" numberOfLines={1}>
                {sectionsMeta[continueStory.sectionSlug]?.title}
                {' · '}
                {continueStory.figureName}
                {resumeMode === 'listen' && hasProgress
                  ? ` · ${formatClock(audioMs)} / ${continueStory.durationLabel}`
                  : ''}
              </Caption>

              {hasProgress && resumeMode === 'listen' ? (
                <ProgressBar
                  value={audioProgress}
                  gradient={brandGradients.gold[isDark ? 'dark' : 'light']}
                  trackColor="rgba(255,255,255,0.14)"
                  height={3}
                />
              ) : null}

              <View style={styles.primaryCta}>
                {resumeMode === 'listen' ? (
                  <Headphones size={15} color="#0F172A" />
                ) : (
                  <BookOpen size={15} color="#0F172A" />
                )}
                <Text style={styles.primaryCtaLabel}>
                  {hasProgress
                    ? resumeMode === 'listen'
                      ? 'Continue listening'
                      : 'Continue reading'
                    : resumeMode === 'listen'
                      ? 'Listen now'
                      : 'Read now'}
                </Text>
              </View>
            </LinearGradient>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => navigation.navigate('Explore')}
            accessibilityRole="button"
            accessibilityLabel="Browse stories in Explore"
            style={({ pressed }) => [
              styles.emptyBlock,
              { borderColor: colors.border, backgroundColor: alpha(colors.emerald, isDark ? 0.12 : 0.08) },
              pressed && styles.pressed,
            ]}
          >
            <BodyStrong color={colors.ink}>Browse stories</BodyStrong>
            <Small color={colors.inkMuted}>Explore opens the full catalog.</Small>
          </Pressable>
        )}

        <View style={styles.section}>
          <Overline color={colors.inkSubtle}>More stories</Overline>
          <View style={[styles.list, { borderColor: divider }]}>
            {suggested.length === 0 ? (
              <Caption color={colors.inkMuted} style={styles.listEmpty}>
                No stories yet.
              </Caption>
            ) : (
              suggested.map((story, index) => {
                const accent = sectionAccent(story.sectionSlug, isDark);
                const mode = preferredMode(story);
                const canListen = Boolean(story.hasAudio || story.audioUrl || story.content);
                return (
                  <View key={story.id}>
                    {index > 0 ? <View style={[styles.rule, { backgroundColor: divider }]} /> : null}
                    <Pressable
                      onPress={() => openStory(story, mode)}
                      accessibilityRole="button"
                      accessibilityLabel={`${mode === 'listen' ? 'Listen to' : 'Read'} ${story.title}`}
                      style={({ pressed }) => [styles.storyRow, pressed && styles.pressed]}
                    >
                      <View style={[styles.dot, { backgroundColor: accent.primary }]} />
                      <View style={styles.storyCopy}>
                        <Caption color={accent.primary} numberOfLines={1}>
                          {sectionsMeta[story.sectionSlug]?.title}
                        </Caption>
                        <BodyStrong numberOfLines={2} style={styles.storyTitle}>
                          {story.title}
                        </BodyStrong>
                        <Small color={colors.inkMuted} numberOfLines={1}>
                          {story.figureName}
                          {story.hasAudio ? ` · ${story.durationLabel}` : ''}
                        </Small>
                      </View>
                      {canListen ? (
                        <Headphones size={16} color={accent.primary} />
                      ) : (
                        <BookOpen size={16} color={accent.primary} />
                      )}
                    </Pressable>
                  </View>
                );
              })
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Overline color={colors.inkSubtle}>Go to</Overline>
          <View style={styles.shortcuts}>
            <Pressable
              onPress={() => navigation.navigate('Explore')}
              accessibilityRole="button"
              accessibilityLabel="Go to Explore"
              style={({ pressed }) => [
                styles.shortcut,
                { borderBottomColor: divider },
                pressed && styles.pressed,
              ]}
            >
              <View>
                <BodyStrong color={colors.ink}>Explore</BodyStrong>
                <Small color={colors.inkMuted}>Browse every story</Small>
              </View>
              <ChevronRight size={18} color={colors.inkSubtle} />
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate('Names')}
              accessibilityRole="button"
              accessibilityLabel="Go to The Names"
              style={({ pressed }) => [styles.shortcut, pressed && styles.pressed]}
            >
              <View>
                <BodyStrong color={colors.ink}>The Names</BodyStrong>
                <Small color={colors.inkMuted}>Asma’ul Husna</Small>
              </View>
              <ChevronRight size={18} color={colors.inkSubtle} />
            </Pressable>
          </View>
        </View>
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
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 140,
  },
  top: { marginBottom: 22 },
  brand: { flex: 1, paddingRight: 12 },
  brandTitle: {
    fontFamily: DISPLAY_FONT_FAMILY,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.7,
    lineHeight: 36,
  },
  tagline: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 280,
  },
  brandArabic: { marginTop: 8, fontSize: 17, lineHeight: 28 },
  primaryBlock: {
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    marginBottom: 28,
  },
  primaryInner: {
    paddingHorizontal: 18,
    paddingVertical: 18,
    gap: 8,
  },
  primaryTitle: {
    fontFamily: DISPLAY_FONT_FAMILY,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  primaryCta: {
    marginTop: 8,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FDE68A',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: radius.md,
  },
  primaryCtaLabel: {
    fontFamily: BODY_FONT_FAMILY,
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptyBlock: {
    borderWidth: 1,
    borderRadius: radius['2xl'],
    padding: 18,
    gap: 4,
    marginBottom: 28,
  },
  section: { marginBottom: 28, gap: 10 },
  list: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  listEmpty: { paddingVertical: 16 },
  rule: { height: StyleSheet.hairlineWidth },
  storyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  storyCopy: { flex: 1, minWidth: 0, gap: 2 },
  storyTitle: { fontSize: 15, lineHeight: 20 },
  shortcuts: { gap: 0 },
  shortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pressed: { opacity: 0.78 },
});
