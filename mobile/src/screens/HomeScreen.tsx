import { useNavigation } from '@react-navigation/native';
import {
  BookOpen,
  Bookmark,
  Compass,
  Headphones,
  Library as LibraryIcon,
  Sparkles,
  User,
  Users,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import ModeToggle from '../components/ModeToggle';
import StorySessionModal, { type StorySessionMode } from '../components/StorySessionModal';
import {
  ArabicInline,
  BodyStrong,
  Caption,
  ProgressBar,
  Row,
  Small,
  useTheme,
} from '../components/ui';
import { useCatalog } from '../data/CatalogProvider';
import { sectionsMeta } from '../data/catalogMeta';
import { dailyVerse } from '../data/mockHome';
import {
  useLastActiveStory,
  type LastActiveMode,
} from '../hooks/useLastActiveStory';
import { usePlaybackProgress } from '../hooks/usePlaybackProgress';
import { useReadingBookmark } from '../hooks/useReadingBookmark';
import { requestExploreSection } from '../navigation/exploreIntent';
import {
  BODY_FONT_FAMILY,
  DISPLAY_FONT_FAMILY,
  alpha,
  radius,
} from '../theme/tokens';
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

type HomeTabs = {
  navigate: (screen: 'Explore' | 'Names' | 'Library' | 'Home') => void;
};

type AppTile = {
  key: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  wide?: boolean;
  onPress: () => void;
};

/**
 * Home — sage hero with verse + continue CTA, then a soft sheet of app
 * destinations (Explore, categories, Names, Library).
 */
export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<HomeTabs>();
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
    return null;
  }, [stories, lastActive.storyId]);

  const fallbackStart = useMemo(
    () => stories.find((story) => story.hasAudio) ?? stories[0] ?? null,
    [stories],
  );

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

  const hasContinue = Boolean(continueStory);
  const audioProgress =
    continueStory && continueStory.durationMs > 0
      ? Math.min(1, audioMs / continueStory.durationMs)
      : 0;

  const heroGreen = isDark ? '#0F3D36' : '#6F9088';
  const heroGreenDeep = isDark ? '#0A2A25' : '#5A7A73';
  const sheetBg = isDark ? colors.paper : '#F3F1EC';
  const tileBg = isDark ? colors.card : '#FFFFFF';
  const tileBorder = isDark ? colors.border : 'rgba(90, 122, 115, 0.16)';

  const openResume = () => {
    if (!continueStory) return;
    void markActive(continueStory.id, resumeMode);
    setActiveStory(continueStory);
    setSessionMode(resumeMode);
  };

  const openStart = () => {
    if (continueStory) {
      openResume();
      return;
    }
    if (fallbackStart) {
      const mode = fallbackStart.hasAudio ? 'listen' : 'read';
      void markActive(fallbackStart.id, mode);
      setActiveStory(fallbackStart);
      setSessionMode(mode);
      return;
    }
    requestExploreSection('all');
    navigation.navigate('Explore');
  };

  const goExplore = (section: SectionSlug | 'all' = 'all') => {
    requestExploreSection(section);
    navigation.navigate('Explore');
  };

  const tiles: AppTile[] = [
    {
      key: 'explore',
      label: 'Explore stories',
      hint: 'Browse the full catalog',
      icon: Compass,
      wide: true,
      onPress: () => goExplore('all'),
    },
    {
      key: 'prophets',
      label: 'Prophets',
      hint: sectionsMeta['qisas-al-anbiya'].subtitle,
      icon: User,
      onPress: () => goExplore('qisas-al-anbiya'),
    },
    {
      key: 'seerah',
      label: 'Seerah',
      hint: 'Life & character',
      icon: BookOpen,
      onPress: () => goExplore('seerah-shamail'),
    },
    {
      key: 'sahabah',
      label: 'Sahabah',
      hint: 'The Companions',
      icon: Users,
      onPress: () => goExplore('sahabah'),
    },
    {
      key: 'narratives',
      label: 'Narratives',
      hint: 'Successors & athar',
      icon: LibraryIcon,
      onPress: () => goExplore('gleanings'),
    },
    {
      key: 'names',
      label: 'The Names',
      hint: 'Asma’ul Husna',
      icon: Sparkles,
      onPress: () => navigation.navigate('Names'),
    },
    {
      key: 'library',
      label: 'Library',
      hint: 'Saved stories',
      icon: Bookmark,
      onPress: () => navigation.navigate('Library'),
    },
  ];

  const ctaLabel = hasContinue
    ? resumeMode === 'listen'
      ? 'Continue listening'
      : 'Continue reading'
    : 'Start a story';

  return (
    <View style={[styles.screen, { backgroundColor: heroGreen }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { backgroundColor: heroGreen }]}>
          <Row justify="space-between" align="center" style={styles.heroTop}>
            <Text style={styles.brand}>Stories of Islam</Text>
            <ModeToggle />
          </Row>

          <ArabicInline color="#FFFFFF" style={styles.verseAr} align="center">
            {dailyVerse.textAr}
          </ArabicInline>
          <Text style={styles.verseEn}>{dailyVerse.textEn}</Text>
          <Caption color="rgba(255,255,255,0.72)" style={styles.verseSource}>
            {dailyVerse.source}
          </Caption>

          <Pressable
            onPress={openStart}
            accessibilityRole="button"
            accessibilityLabel={ctaLabel}
            style={({ pressed }) => [
              styles.heroCta,
              { backgroundColor: alpha('#FFFFFF', pressed ? 0.16 : 0.2) },
            ]}
          >
            {hasContinue && resumeMode === 'listen' ? (
              <Headphones size={16} color="#FFFFFF" />
            ) : (
              <BookOpen size={16} color="#FFFFFF" />
            )}
            <Text style={styles.heroCtaLabel}>{ctaLabel}</Text>
          </Pressable>
        </View>

        <View style={[styles.sheet, { backgroundColor: sheetBg }]}>
          {continueStory ? (
            <Pressable
              onPress={openResume}
              accessibilityRole="button"
              accessibilityLabel={`${ctaLabel}: ${continueStory.title}`}
              style={({ pressed }) => [
                styles.continueCard,
                {
                  backgroundColor: tileBg,
                  borderColor: tileBorder,
                  opacity: pressed ? 0.88 : 1,
                },
              ]}
            >
              <Row justify="space-between" align="center">
                <Caption color={heroGreenDeep}>
                  {resumeMode === 'listen' ? 'Continue listening' : 'Continue reading'}
                </Caption>
                <Caption color={colors.inkSubtle}>
                  {sectionsMeta[continueStory.sectionSlug]?.title}
                </Caption>
              </Row>
              <BodyStrong style={styles.continueTitle} numberOfLines={2}>
                {continueStory.title}
              </BodyStrong>
              <Small color={colors.inkMuted} numberOfLines={1}>
                {continueStory.figureName}
                {resumeMode === 'listen'
                  ? ` · ${formatClock(audioMs)} / ${continueStory.durationLabel}`
                  : readY > 0
                    ? ' · bookmark saved'
                    : ''}
              </Small>
              <ProgressBar
                value={resumeMode === 'listen' ? audioProgress : readY > 0 ? 0.3 : 0.08}
                trackColor={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(90,122,115,0.15)'}
                height={4}
              />
            </Pressable>
          ) : (
            <View
              style={[
                styles.continueCard,
                { backgroundColor: tileBg, borderColor: tileBorder },
              ]}
            >
              <BodyStrong>Pick up anytime</BodyStrong>
              <Small color={colors.inkMuted}>
                Stories you open will appear here for quick continue listening or reading.
              </Small>
            </View>
          )}

          <Text style={[styles.sheetHeading, { color: colors.ink }]}>Open a section</Text>

          <View style={styles.grid}>
            {tiles.map((tile) => {
              const Icon = tile.icon;
              return (
                <Pressable
                  key={tile.key}
                  onPress={tile.onPress}
                  accessibilityRole="button"
                  accessibilityLabel={tile.label}
                  style={({ pressed }) => [
                    styles.tile,
                    tile.wide && styles.tileWide,
                    {
                      backgroundColor: tileBg,
                      borderColor: tileBorder,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.tileIcon,
                      { backgroundColor: alpha(heroGreen, isDark ? 0.28 : 0.12) },
                    ]}
                  >
                    <Icon size={18} color={isDark ? colors.emeraldLight : heroGreenDeep} />
                  </View>
                  <View style={styles.tileCopy}>
                    <BodyStrong numberOfLines={1}>{tile.label}</BodyStrong>
                    <Small color={colors.inkMuted} numberOfLines={1}>
                      {tile.hint}
                    </Small>
                  </View>
                </Pressable>
              );
            })}
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
  content: { paddingBottom: 120 },
  hero: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 36,
  },
  heroTop: { marginBottom: 22 },
  brand: {
    fontFamily: DISPLAY_FONT_FAMILY,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: '#FFFFFF',
  },
  verseAr: {
    fontSize: 22,
    lineHeight: 40,
    textAlign: 'center',
    marginBottom: 10,
  },
  verseEn: {
    fontFamily: BODY_FONT_FAMILY,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  verseSource: {
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 18,
  },
  heroCta: {
    alignSelf: 'stretch',
    minHeight: 48,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  heroCtaLabel: {
    fontFamily: BODY_FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sheet: {
    marginTop: -18,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 28,
    minHeight: 520,
  },
  continueCard: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: 14,
    gap: 6,
    marginBottom: 20,
  },
  continueTitle: { fontSize: 15, lineHeight: 21 },
  sheetHeading: {
    fontFamily: DISPLAY_FONT_FAMILY,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tile: {
    width: '48%',
    flexGrow: 1,
    minWidth: '46%',
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tileWide: {
    width: '100%',
    minWidth: '100%',
  },
  tileIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileCopy: { flex: 1, minWidth: 0, gap: 1 },
});
