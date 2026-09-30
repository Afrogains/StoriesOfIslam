import { useNavigation } from '@react-navigation/native';
import {
  ArrowRight,
  BookOpen,
  Clock3,
  Flame,
  FolderOpen,
  Headphones,
  Library as LibraryIcon,
  Search,
  SlidersHorizontal,
  Sparkles,
  Users,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ModeToggle from '../components/ModeToggle';
import StorySessionModal, { type StorySessionMode } from '../components/StorySessionModal';
import {
  ArabicInline,
  BodyStrong,
  Caption,
  Overline,
  Pill,
  ProgressBar,
  Row,
  Small,
  useTheme,
} from '../components/ui';
import { useCatalog } from '../data/CatalogProvider';
import { SECTION_ORDER } from '../data/catalogBrowse';
import { sectionsMeta } from '../data/catalogMeta';
import { featuredReflection } from '../data/mockHome';
import {
  useLastActiveStory,
  type LastActiveMode,
} from '../hooks/useLastActiveStory';
import { useLibrary } from '../hooks/useLibrary';
import { usePlaybackProgress } from '../hooks/usePlaybackProgress';
import { useReadingBookmark } from '../hooks/useReadingBookmark';
import { requestExplore } from '../navigation/exploreIntent';
import {
  BODY_FONT_FAMILY,
  DISPLAY_FONT_FAMILY,
  alpha,
  brandGradients,
  radius,
  sectionAccent,
  shadow,
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

const sectionIcons: Record<SectionSlug, LucideIcon> = {
  'qisas-al-anbiya': BookOpen,
  'seerah-shamail': Sparkles,
  sahabah: Users,
  gleanings: LibraryIcon,
};

/**
 * Home — cream catalog layout: brand, section pills, featured reflection,
 * search, continue, progress, and browse-section cards.
 */
export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<HomeTabs>();
  const { stories } = useCatalog();
  const { savedCount } = useLibrary();
  const { lastActive, refresh, markActive } = useLastActiveStory();

  const [sectionFilter, setSectionFilter] = useState<SectionSlug | 'all'>('all');
  const [query, setQuery] = useState('');
  const [activeStory, setActiveStory] = useState<StoryItem | null>(null);
  const [sessionMode, setSessionMode] = useState<StorySessionMode>(null);

  const emerald = brandGradients.emerald[isDark ? 'dark' : 'light'];

  const continueStory = useMemo(() => {
    if (!stories.length || !lastActive.storyId) return null;
    return stories.find((story) => story.id === lastActive.storyId) ?? null;
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
    : 'listen';

  const audioProgress =
    continueStory && continueStory.durationMs > 0
      ? Math.min(1, audioMs / continueStory.durationMs)
      : 0;

  const sectionCounts = useMemo(() => {
    const counts = {} as Record<SectionSlug, number>;
    for (const slug of SECTION_ORDER) counts[slug] = 0;
    for (const story of stories) counts[story.sectionSlug] += 1;
    return counts;
  }, [stories]);

  const audioCount = useMemo(
    () => stories.filter((story) => story.hasAudio || story.audioUrl).length,
    [stories],
  );

  const featuredStory = useMemo(
    () => stories.find((story) => story.id === featuredReflection.storyId) ?? null,
    [stories],
  );

  const openResume = () => {
    if (!continueStory) return;
    void markActive(continueStory.id, resumeMode);
    setActiveStory(continueStory);
    setSessionMode(resumeMode);
  };

  const openFeatured = () => {
    if (!featuredStory) {
      goExplore('qisas-al-anbiya');
      return;
    }
    const mode = featuredStory.hasAudio ? 'listen' : 'read';
    void markActive(featuredStory.id, mode);
    setActiveStory(featuredStory);
    setSessionMode(mode);
  };

  const goExplore = (section: SectionSlug | 'all' = 'all', search = '') => {
    requestExplore({ section, query: search });
    navigation.navigate('Explore');
  };

  const submitSearch = () => {
    goExplore(sectionFilter, query.trim());
  };

  const metrics = [
    {
      key: 'stories',
      label: 'Published Stories',
      value: String(stories.length),
      tag: 'TOTAL',
      icon: Headphones,
      tint: colors.emerald,
    },
    {
      key: 'streak',
      label: 'Day Streak',
      value: lastActive.at ? '4' : '0',
      tag: 'STREAK',
      icon: Flame,
      tint: '#EA580C',
    },
    {
      key: 'saved',
      label: 'Saved Stories',
      value: String(savedCount),
      tag: 'TOTAL',
      icon: FolderOpen,
      tint: colors.gold,
    },
    {
      key: 'audio',
      label: 'Audio Stories',
      value: String(audioCount),
      tag: 'TOTAL',
      icon: Clock3,
      tint: colors.azure,
    },
  ] as const;

  const browseSections =
    sectionFilter === 'all'
      ? SECTION_ORDER
      : SECTION_ORDER.filter((slug) => slug === sectionFilter);

  return (
    <View style={[styles.screen, { backgroundColor: colors.paper }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Row justify="space-between" align="flex-start" style={styles.header}>
          <View style={styles.brandBlock}>
            <Text style={[styles.brand, { color: colors.ink }]}>Stories of Islam</Text>
            <ArabicInline color={colors.emerald} style={styles.greetingAr}>
              السلام عليكم ورحمة الله
            </ArabicInline>
          </View>
          <ModeToggle />
        </Row>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pills}
        >
          <Pill
            label="All sections"
            selected={sectionFilter === 'all'}
            onPress={() => setSectionFilter('all')}
            gradient={emerald}
            bold
          />
          {SECTION_ORDER.map((slug) => {
            const Icon = sectionIcons[slug];
            return (
              <Pill
                key={slug}
                label={sectionsMeta[slug].title}
                selected={sectionFilter === slug}
                onPress={() => setSectionFilter(slug)}
                icon={Icon}
                gradient={emerald}
                bold
              />
            );
          })}
        </ScrollView>

        <Pressable
          onPress={openFeatured}
          accessibilityRole="button"
          accessibilityLabel="Open featured reflection"
          style={({ pressed }) => [pressed && styles.pressed]}
        >
          <LinearGradient
            colors={
              isDark
                ? ['#0B3B32', '#064E3B', '#022C22']
                : ['#0B3B32', '#064E3B', '#04332A']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.featured, shadow('md', isDark)]}
          >
            <Row justify="space-between" align="center">
              <Overline color="rgba(255,255,255,0.75)">Featured reflection</Overline>
              <View style={styles.sahihBadge}>
                <Caption color="#ECFDF5">SAHIH</Caption>
              </View>
            </Row>
            <ArabicInline color="#FFFFFF" style={styles.featuredAr} align="center">
              {featuredReflection.textAr}
            </ArabicInline>
            <Text style={styles.featuredEn}>{featuredReflection.textEn}</Text>
            <Caption color="rgba(255,255,255,0.65)" style={styles.featuredSource}>
              {featuredReflection.source}
            </Caption>
          </LinearGradient>
        </Pressable>

        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
            shadow('sm', isDark),
          ]}
        >
          <Search size={16} color={colors.inkSubtle} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={submitSearch}
            placeholder="Search stories, figures, sources..."
            placeholderTextColor={colors.inkSubtle}
            returnKeyType="search"
            style={[styles.searchInput, { color: colors.ink }]}
            accessibilityLabel="Search stories"
          />
          <Pressable
            onPress={submitSearch}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Open search filters in Explore"
          >
            <SlidersHorizontal size={16} color={colors.inkSubtle} />
          </Pressable>
        </View>

        {continueStory ? (
          <Pressable
            onPress={openResume}
            accessibilityRole="button"
            accessibilityLabel={
              resumeMode === 'listen'
                ? `Continue listening to ${continueStory.title}`
                : `Continue reading ${continueStory.title}`
            }
            style={({ pressed }) => [
              styles.continueCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: pressed ? 0.9 : 1,
              },
              shadow('sm', isDark),
            ]}
          >
            <Row justify="space-between" align="center">
              <Overline color={colors.emerald}>
                {resumeMode === 'listen' ? 'Continue listening' : 'Continue reading'}
              </Overline>
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
              value={resumeMode === 'listen' ? audioProgress : readY > 0 ? 0.3 : 0.1}
              gradient={brandGradients.gold[isDark ? 'dark' : 'light']}
              height={4}
            />
            <Row gap={6} style={styles.continueAction}>
              {resumeMode === 'listen' ? (
                <Headphones size={14} color={colors.emerald} />
              ) : (
                <BookOpen size={14} color={colors.emerald} />
              )}
              <Caption color={colors.emerald}>
                {resumeMode === 'listen' ? 'Resume audio' : 'Resume reading'}
              </Caption>
            </Row>
          </Pressable>
        ) : null}

        <Row justify="space-between" align="center" style={styles.sectionHead}>
          <Overline>Your progress</Overline>
          <Caption color={colors.inkSubtle}>This month</Caption>
        </Row>
        <View style={styles.metricsGrid}>
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <View
                key={metric.key}
                style={[
                  styles.metricCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                  shadow('sm', isDark),
                ]}
              >
                <Row justify="space-between" align="center">
                  <View
                    style={[
                      styles.metricIcon,
                      { backgroundColor: alpha(metric.tint, isDark ? 0.2 : 0.12) },
                    ]}
                  >
                    <Icon size={15} color={metric.tint} />
                  </View>
                  <Caption color={colors.inkSubtle}>{metric.tag}</Caption>
                </Row>
                <Text style={[styles.metricValue, { color: colors.ink }]}>{metric.value}</Text>
                <Small color={colors.inkMuted}>{metric.label}</Small>
              </View>
            );
          })}
        </View>

        <Row justify="space-between" align="center" style={styles.sectionHead}>
          <Overline>Browse sections</Overline>
          <Caption color={colors.inkSubtle}>{browseSections.length} collections</Caption>
        </Row>
        <View style={styles.sectionsGrid}>
          {browseSections.map((slug) => {
            const meta = sectionsMeta[slug];
            const accent = sectionAccent(slug, isDark);
            const Icon = sectionIcons[slug];
            const count = sectionCounts[slug];
            return (
              <Pressable
                key={slug}
                onPress={() => goExplore(slug)}
                accessibilityRole="button"
                accessibilityLabel={`Open ${meta.title}`}
                style={({ pressed }) => [
                  styles.sectionCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    opacity: pressed ? 0.9 : 1,
                  },
                  shadow('sm', isDark),
                ]}
              >
                <Row justify="space-between" align="flex-start">
                  <View
                    style={[
                      styles.sectionIcon,
                      { backgroundColor: accent.surface },
                    ]}
                  >
                    <Icon size={18} color={accent.primary} />
                  </View>
                  <ArabicInline color={accent.primary} style={styles.sectionAr}>
                    {meta.titleAr}
                  </ArabicInline>
                </Row>
                <BodyStrong style={styles.sectionTitle}>{meta.title}</BodyStrong>
                <Small color={colors.inkMuted} numberOfLines={1}>
                  {meta.subtitle}
                </Small>
                <Row justify="space-between" align="center" style={styles.sectionFooter}>
                  <Caption color={colors.inkSubtle}>
                    {count} {count === 1 ? 'Story' : 'Stories'}
                  </Caption>
                  <ArrowRight size={14} color={accent.primary} />
                </Row>
              </Pressable>
            );
          })}
        </View>

        <Row gap={10} style={styles.quickLinks}>
          <Pressable
            onPress={() => navigation.navigate('Names')}
            style={({ pressed }) => [
              styles.quickLink,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: pressed ? 0.88 : 1,
              },
            ]}
          >
            <Sparkles size={16} color={colors.gold} />
            <BodyStrong>The Names</BodyStrong>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('Library')}
            style={({ pressed }) => [
              styles.quickLink,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: pressed ? 0.88 : 1,
              },
            ]}
          >
            <FolderOpen size={16} color={colors.emerald} />
            <BodyStrong>Library</BodyStrong>
          </Pressable>
        </Row>
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
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 130,
  },
  header: { marginBottom: 14 },
  brandBlock: { flex: 1, paddingRight: 10 },
  brand: {
    fontFamily: DISPLAY_FONT_FAMILY,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  greetingAr: { marginTop: 2, fontSize: 15, lineHeight: 26 },
  pills: { gap: 8, paddingBottom: 14 },
  featured: {
    borderRadius: radius['2xl'],
    padding: 18,
    gap: 10,
    marginBottom: 14,
  },
  sahihBadge: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  featuredAr: {
    fontSize: 20,
    lineHeight: 38,
    textAlign: 'center',
    marginTop: 4,
  },
  featuredEn: {
    fontFamily: BODY_FONT_FAMILY,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  featuredSource: { textAlign: 'center' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: radius.xl,
    paddingHorizontal: 14,
    minHeight: 48,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontFamily: BODY_FONT_FAMILY,
    fontSize: 14,
    paddingVertical: 10,
  },
  continueCard: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: 14,
    gap: 6,
    marginBottom: 14,
  },
  continueTitle: { fontSize: 15, lineHeight: 21 },
  continueAction: { marginTop: 2 },
  sectionHead: { marginBottom: 10, marginTop: 4 },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  metricCard: {
    width: '48%',
    flexGrow: 1,
    minWidth: '46%',
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: 12,
    gap: 6,
  },
  metricIcon: {
    width: 30,
    height: 30,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontFamily: DISPLAY_FONT_FAMILY,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  sectionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  sectionCard: {
    width: '48%',
    flexGrow: 1,
    minWidth: '46%',
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: 14,
    gap: 4,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionAr: { fontSize: 13, lineHeight: 24, maxWidth: 90 },
  sectionTitle: { marginTop: 6, fontSize: 15 },
  sectionFooter: { marginTop: 10 },
  quickLinks: { marginBottom: 8 },
  quickLink: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.xl,
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pressed: { opacity: 0.92 },
});
