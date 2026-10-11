import { useNavigation } from '@react-navigation/native';
import {
  ArrowRight,
  BookOpen,
  Flame,
  FolderOpen,
  Headphones,
  Library as LibraryIcon,
  Search,
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
import { useMobileLayout } from '../hooks/useMobileLayout';
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
  const { topPad, padX, scrollPadBottom } = useMobileLayout();
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
      label: 'Stories',
      value: String(stories.length),
      icon: BookOpen,
      tint: colors.emerald,
    },
    {
      key: 'audio',
      label: 'With audio',
      value: String(audioCount),
      icon: Headphones,
      tint: colors.azure,
    },
    {
      key: 'saved',
      label: 'Saved',
      value: String(savedCount),
      icon: FolderOpen,
      tint: colors.gold,
    },
    {
      key: 'streak',
      label: 'Day streak',
      value: lastActive.at ? '4' : '0',
      icon: Flame,
      tint: '#EA580C',
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
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPad, paddingHorizontal: padX, paddingBottom: scrollPadBottom },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Row justify="space-between" align="center" style={styles.header}>
          <View style={styles.brandBlock}>
            <Text style={[styles.brand, { color: colors.ink }]}>Stories of Islam</Text>
            <ArabicInline color={colors.emerald} style={styles.greetingAr} align="left">
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
            label="All"
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
          <Search size={18} color={colors.inkSubtle} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={submitSearch}
            placeholder="Search stories or figures…"
            placeholderTextColor={colors.inkSubtle}
            returnKeyType="search"
            style={[styles.searchInput, { color: colors.ink }]}
            accessibilityLabel="Search stories"
          />
          <Pressable
            onPress={submitSearch}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Search in Explore"
            style={[styles.searchGo, { backgroundColor: colors.emerald }]}
          >
            <ArrowRight size={16} color="#FFFFFF" />
          </Pressable>
        </View>

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
              <Overline color="rgba(255,255,255,0.75)">Featured</Overline>
              <View style={styles.sahihBadge}>
                <Caption color="#ECFDF5">SAHIH</Caption>
              </View>
            </Row>
            <ArabicInline color="#FFFFFF" style={styles.featuredAr} align="center" numberOfLines={2}>
              {featuredReflection.textAr}
            </ArabicInline>
            <Text style={styles.featuredEn} numberOfLines={3}>
              {featuredReflection.textEn}
            </Text>
            <Caption color="rgba(255,255,255,0.65)" style={styles.featuredSource} numberOfLines={1}>
              {featuredReflection.source}
            </Caption>
          </LinearGradient>
        </Pressable>

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
                <View
                  style={[
                    styles.metricIcon,
                    { backgroundColor: alpha(metric.tint, isDark ? 0.2 : 0.12) },
                  ]}
                >
                  <Icon size={16} color={metric.tint} strokeWidth={2.25} />
                </View>
                <View style={styles.metricCopy}>
                  <Text style={[styles.metricValue, { color: colors.ink }]}>{metric.value}</Text>
                  <Small color={colors.inkMuted} numberOfLines={1}>
                    {metric.label}
                  </Small>
                </View>
              </View>
            );
          })}
        </View>

        <Row justify="space-between" align="center" style={styles.sectionHead}>
          <Overline>Browse sections</Overline>
          <Caption color={colors.inkSubtle}>{browseSections.length} collections</Caption>
        </Row>
        <View style={styles.sectionsList}>
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
                  styles.sectionRow,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    opacity: pressed ? 0.9 : 1,
                  },
                  shadow('sm', isDark),
                ]}
              >
                <View style={[styles.sectionIcon, { backgroundColor: accent.surface }]}>
                  <Icon size={20} color={accent.primary} strokeWidth={2.25} />
                </View>
                <View style={styles.sectionCopy}>
                  <BodyStrong numberOfLines={1}>{meta.title}</BodyStrong>
                  <Small color={colors.inkMuted} numberOfLines={1}>
                    {meta.subtitle} · {count} {count === 1 ? 'story' : 'stories'}
                  </Small>
                </View>
                <ArrowRight size={18} color={accent.primary} />
              </Pressable>
            );
          })}
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
  content: { gap: 0 },
  header: { marginBottom: 12 },
  brandBlock: { flex: 1, minWidth: 0, paddingRight: 8 },
  brand: {
    fontFamily: DISPLAY_FONT_FAMILY,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  greetingAr: { marginTop: 2, fontSize: 14, lineHeight: 26 },
  pills: { gap: 8, paddingBottom: 12, paddingRight: 4 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: radius.xl,
    paddingLeft: 14,
    paddingRight: 6,
    minHeight: 48,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: BODY_FONT_FAMILY,
    fontSize: 14,
    paddingVertical: 10,
  },
  searchGo: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featured: {
    borderRadius: radius['2xl'],
    padding: 14,
    gap: 8,
    marginBottom: 12,
  },
  sahihBadge: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  featuredAr: {
    fontSize: 18,
    lineHeight: 34,
    textAlign: 'center',
    marginTop: 2,
  },
  featuredEn: {
    fontFamily: BODY_FONT_FAMILY,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  featuredSource: { textAlign: 'center' },
  continueCard: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: 14,
    gap: 6,
    marginBottom: 12,
  },
  continueTitle: { fontSize: 15, lineHeight: 21 },
  continueAction: { marginTop: 2 },
  sectionHead: { marginBottom: 10, marginTop: 6 },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  metricCard: {
    width: '48%',
    flexGrow: 1,
    flexBasis: '47%',
    borderWidth: 1,
    borderRadius: radius.xl,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metricIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricCopy: { flex: 1, minWidth: 0, gap: 1 },
  metricValue: {
    fontFamily: DISPLAY_FONT_FAMILY,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  sectionsList: { gap: 8, marginBottom: 8 },
  sectionRow: {
    borderWidth: 1,
    borderRadius: radius.xl,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCopy: { flex: 1, minWidth: 0, gap: 2 },
  pressed: { opacity: 0.92 },
});
