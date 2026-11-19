import { useNavigation } from '@react-navigation/native';
import {
  ArrowRight,
  BookMarked,
  BookOpen,
  ClipboardCheck,
  FolderOpen,
  TrendingUp,
  Headphones,
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
import CollapsiblePanel from '../components/CollapsiblePanel';
import FeaturedHadithCard from '../components/FeaturedHadithCard';
import ModeToggle from '../components/ModeToggle';
import StorySessionModal, { type StorySessionMode } from '../components/StorySessionModal';
import {
  ArabicInline,
  Body,
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
import { getStoryChapters } from '../data/chapters';
import { useLastActiveStory } from '../hooks/useLastActiveStory';
import { useLibrary } from '../hooks/useLibrary';
import { useMobileLayout } from '../hooks/useMobileLayout';
import { useQuizResults } from '../hooks/useQuizResults';
import {
  EMPTY_READING_BOOKMARK,
  formatReadingPercent,
  type ReadingBookmark,
} from '../hooks/readingBookmark';
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

type HomeTabs = {
  navigate: (screen: 'Explore' | 'Names' | 'Library' | 'Home') => void;
};

const sectionIcons: Record<SectionSlug, LucideIcon> = {
  'qisas-al-anbiya': BookOpen,
  'qisas-al-quran': BookMarked,
  'seerah-shamail': Sparkles,
  sahabah: Users,
};

/**
 * Home — cream catalog layout: brand, section pills, daily featured hadith,
 * search, continue, progress, and browse-section cards.
 */
export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { padX, pillEndPad, screenContent } = useMobileLayout();
  const navigation = useNavigation<HomeTabs>();
  const { stories } = useCatalog();
  const { savedCount } = useLibrary();
  const { lastActive, refresh, markActive } = useLastActiveStory();
  const { summary: quizSummary } = useQuizResults();

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
  const { load: loadReadBookmark } = useReadingBookmark(storyId || 'none');
  const [bookmark, setBookmark] = useState<ReadingBookmark>(EMPTY_READING_BOOKMARK);

  useEffect(() => {
    void refresh();
  }, [refresh, stories.length]);

  useEffect(() => {
    if (!continueStory) {
      setBookmark(EMPTY_READING_BOOKMARK);
      return;
    }
    void loadReadBookmark().then(setBookmark);
  }, [continueStory, loadReadBookmark]);

  const sectionCounts = useMemo(() => {
    const counts = {} as Record<SectionSlug, number>;
    for (const slug of SECTION_ORDER) counts[slug] = 0;
    for (const story of stories) counts[story.sectionSlug] += 1;
    return counts;
  }, [stories]);

  const openResume = () => {
    if (!continueStory) return;
    void markActive(continueStory.id, 'read');
    setActiveStory(continueStory);
    setSessionMode('read');
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
      label: 'Listen',
      value: 'Soon',
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
      key: 'checks',
      label: 'Chapter checks',
      value: String(quizSummary.chapters),
      icon: ClipboardCheck,
      tint: '#EA580C',
    },
  ] as const;

  const filteredStories = useMemo(
    () => (sectionFilter === 'all' ? [] : stories.filter((story) => story.sectionSlug === sectionFilter)),
    [stories, sectionFilter],
  );

  const openStory = (story: StoryItem) => {
    void markActive(story.id, 'read');
    setActiveStory(story);
    setSessionMode('read');
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.paper }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, screenContent]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Row justify="space-between" align="center" style={styles.header}>
          <View style={styles.brandBlock}>
            <Text style={[styles.brand, { color: colors.ink }]} numberOfLines={1}>
              Stories of Islam
            </Text>
            <ArabicInline color={colors.emerald} style={styles.greetingAr} align="left">
              السلام عليكم ورحمة الله
            </ArabicInline>
          </View>
          <ModeToggle />
        </Row>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -padX }}
          contentContainerStyle={[
            styles.pills,
            { paddingLeft: padX, paddingRight: padX + pillEndPad },
          ]}
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
                label={sectionsMeta[slug].shortTitle}
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

        <FeaturedHadithCard />

        {sectionFilter === 'all' ? (
          <>
            <Row justify="space-between" align="center" style={styles.sectionHead}>
              <Overline>Browse sections</Overline>
              <Caption color={colors.inkSubtle}>{SECTION_ORDER.length} collections</Caption>
            </Row>
            <View style={styles.sectionsList}>
              {SECTION_ORDER.map((slug) => {
                const meta = sectionsMeta[slug];
                const accent = sectionAccent(slug, isDark);
                const Icon = sectionIcons[slug];
                const count = sectionCounts[slug];
                return (
                  <Pressable
                    key={slug}
                    onPress={() => setSectionFilter(slug)}
                    accessibilityRole="button"
                    accessibilityLabel={`Show ${meta.title}`}
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
          </>
        ) : (
          <View testID="home-section-results">
            <Row justify="space-between" align="center" style={styles.sectionHead}>
              <Overline color={sectionAccent(sectionFilter, isDark).primary}>
                {sectionsMeta[sectionFilter].title}
              </Overline>
              <Caption color={colors.inkSubtle}>
                {filteredStories.length} {filteredStories.length === 1 ? 'story' : 'stories'}
              </Caption>
            </Row>
            <View style={styles.sectionsList}>
              {filteredStories.slice(0, 6).map((story) => {
                const accent = sectionAccent(story.sectionSlug, isDark);
                const storyChapters = getStoryChapters(story);
                const chapterCount = storyChapters.length;
                const minutes = Math.max(1, Math.round(storyChapters.reduce((sum, item) => sum + item.words, 0) / 200));
                return (
                  <Pressable
                    key={story.id}
                    onPress={() => openStory(story)}
                    accessibilityRole="button"
                    accessibilityLabel={`Read ${story.title}`}
                    style={({ pressed }) => [
                      styles.storyRow,
                      { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
                      shadow('sm', isDark),
                    ]}
                  >
                    <View style={[styles.storyDot, { backgroundColor: accent.primary }]} />
                    <View style={styles.sectionCopy}>
                      <BodyStrong numberOfLines={1}>{story.title}</BodyStrong>
                      <Small color={colors.inkMuted} numberOfLines={1}>
                        {chapterCount} {chapterCount === 1 ? 'chapter' : 'chapters'} · {minutes} min read
                      </Small>
                    </View>
                    <BookOpen size={16} color={accent.primary} />
                  </Pressable>
                );
              })}
            </View>
            <Pressable
              onPress={() => goExplore(sectionFilter)}
              accessibilityRole="button"
              style={styles.viewAll}
            >
              <BodyStrong color={sectionAccent(sectionFilter, isDark).primary}>
                View all {filteredStories.length} in Explore
              </BodyStrong>
              <ArrowRight size={16} color={sectionAccent(sectionFilter, isDark).primary} />
            </Pressable>
          </View>
        )}

        {continueStory ? (
          <Pressable
            onPress={openResume}
            accessibilityRole="button"
            accessibilityLabel={`Continue reading ${continueStory.title}, ${formatReadingPercent(bookmark.percent)}${bookmark.heading ? `, last section ${bookmark.heading}` : ''}${bookmark.line ? `, last line ${bookmark.line}` : ''}`}
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
              <Overline color={colors.emerald}>Continue reading</Overline>
              <Caption color={colors.emerald} style={styles.continuePercent}>
                {formatReadingPercent(bookmark.percent)}
              </Caption>
            </Row>
            <BodyStrong style={styles.continueTitle} numberOfLines={2}>
              {continueStory.title}
            </BodyStrong>
            <Small color={colors.inkMuted} numberOfLines={1}>
              {bookmark.heading
                ? `Last section · ${bookmark.heading}`
                : `${continueStory.figureName}${bookmark.y > 0 ? ' · in progress' : ''}`}
            </Small>
            {bookmark.line ? (
              <View
                style={[
                  styles.lastLineBox,
                  {
                    backgroundColor: isDark ? colors.cardAlt : colors.subtleBg,
                    borderLeftColor: colors.gold,
                  },
                ]}
                accessibilityLabel={`Last line read: ${bookmark.line}`}
              >
                <Caption color={colors.gold} style={styles.lastLineLabel}>
                  Last line read
                </Caption>
                <Body numberOfLines={3} style={styles.lastLineText}>
                  {bookmark.line}
                </Body>
              </View>
            ) : (
              <Caption color={colors.inkSubtle} numberOfLines={1}>
                {sectionsMeta[continueStory.sectionSlug]?.title}
              </Caption>
            )}
            <Row align="center" gap={10}>
              <View style={styles.continueBar}>
                <ProgressBar
                  value={bookmark.percent}
                  gradient={brandGradients.gold[isDark ? 'dark' : 'light']}
                  height={5}
                />
              </View>
              <Caption color={colors.inkMuted} style={styles.continuePercentTick}>
                {formatReadingPercent(bookmark.percent)}
              </Caption>
            </Row>
            <Row gap={7} style={styles.continueAction} align="center">
              <BookOpen size={16} color={colors.emerald} strokeWidth={2.25} />
              <BodyStrong color={colors.emerald} style={styles.continueActionLabel}>
                Resume reading
              </BodyStrong>
            </Row>
          </Pressable>
        ) : null}


        <CollapsiblePanel
          storageKey="progress"
          title="Your progress"
          summary={`${savedCount} saved · ${quizSummary.chapters} chapter ${quizSummary.chapters === 1 ? 'check' : 'checks'}${quizSummary.chapters ? ` · ${Math.round(quizSummary.accuracy * 100)}% correct` : ''}`}
          icon={TrendingUp}
          tint={colors.gold}
        >
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
                    <Text style={[styles.metricValue, { color: colors.ink }]} numberOfLines={1}>
                      {metric.value}
                    </Text>
                    <Small color={colors.inkMuted} numberOfLines={1}>
                      {metric.label}
                    </Small>
                  </View>
                </View>
              );
            })}
          </View>
        </CollapsiblePanel>
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
  header: { marginBottom: 14 },
  brandBlock: { flex: 1, minWidth: 0, paddingRight: 8 },
  brand: {
    fontFamily: DISPLAY_FONT_FAMILY,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  greetingAr: { marginTop: 2, fontSize: 14, lineHeight: 26 },
  pills: { gap: 8, paddingBottom: 14 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: radius.xl,
    paddingLeft: 14,
    paddingRight: 6,
    minHeight: 48,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    fontFamily: BODY_FONT_FAMILY,
    fontSize: 14,
    paddingVertical: 10,
    ...(({ outlineStyle: 'none' } as unknown) as object),
  },
  searchGo: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueCard: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: 16,
    gap: 8,
    marginBottom: 14,
  },
  continueTitle: { fontSize: 15, lineHeight: 21 },
  continuePercent: { fontWeight: '800' },
  continueBar: { flex: 1, minWidth: 0 },
  continuePercentTick: { fontVariant: ['tabular-nums'], fontWeight: '700' },
  lastLineBox: {
    borderLeftWidth: 3,
    borderRadius: radius.md,
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 3,
  },
  lastLineLabel: { fontWeight: '800', letterSpacing: 0.3 },
  lastLineText: { fontSize: 14, lineHeight: 20, fontStyle: 'italic' },
  continueAction: { marginTop: 6 },
  continueActionLabel: { fontSize: 13, lineHeight: 18 },
  sectionHead: { marginBottom: 10, marginTop: 8 },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricCard: {
    flexGrow: 1,
    flexBasis: '47%',
    maxWidth: '48.5%',
    borderWidth: 1,
    borderRadius: radius.xl,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
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
    lineHeight: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  sectionsList: { gap: 8, marginBottom: 4 },
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
  storyRow: {
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  storyDot: { width: 8, height: 8, borderRadius: 4 },
  viewAll: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 10, marginBottom: 6 },
  pressed: { opacity: 0.92 },
});
