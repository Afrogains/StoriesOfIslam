import {
  ArrowRight,
  ChevronLeft,
  Filter,
  Headphones,
  Search,
  SearchX,
  Shuffle,
  SlidersHorizontal,
  X,
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import ModeToggle from '../components/ModeToggle';
import ProphetsRoster from '../components/ProphetsRoster';
import QuranStoriesPath from '../components/QuranStoriesPath';
import SahabahRoster from '../components/SahabahRoster';
import SeerahPath from '../components/SeerahPath';
import StoryCard, { sectionIcons } from '../components/StoryCard';
import StorySessionModal, { type StorySessionMode } from '../components/StorySessionModal';
import {
  Body,
  Caption,
  EmptyState,
  Overline,
  Pill,
  Row,
  Small,
  useTheme,
} from '../components/ui';
import { SECTION_ORDER } from '../data/catalogBrowse';
import { sectionsMeta } from '../data/catalogMeta';
import type { AuthenticityGrade, MediaFilter, SectionSlug, StoryItem } from '../types/catalog';
import { useCatalog } from '../data/CatalogProvider';
import { preferProphetCatalogStory, prophetChapterToStoryItem } from '../data/prophetChapters';
import { preferSahabahCatalogStory, sahabahChapterToStoryItem } from '../data/sahabahChapters';
import { quranStoryToStoryItem } from '../data/quranStories';
import { isSeerahTimelineStory, resolveSeerahTimelineStory } from '../data/seerahTimeline';
import { storiesForProphetSlug, storiesForSahabahSlug } from '../data/storyAdapters';
import { useMobileLayout } from '../hooks/useMobileLayout';
import { takeExploreIntent } from '../navigation/exploreIntent';
import {
  BODY_FONT_FAMILY,
  DISPLAY_FONT_FAMILY,
  alpha,
  brandGradients,
  radius,
  sectionAccent,
  shadow,
} from '../theme/tokens';
import type { ProphetFigure } from '../data/theProphets';
import { theProphets } from '../data/theProphets';
import type { SahabahFigure } from '../data/theSahabah';
import { theSahabah } from '../data/theSahabah';

type GradeFilter = 'all' | AuthenticityGrade;
type SortKey = 'default' | 'duration' | 'title';

const grades: { id: GradeFilter; label: string }[] = [
  { id: 'all', label: 'Any grade' },
  { id: 'sahih', label: 'Sahih' },
  { id: 'hasan', label: 'Hasan' },
  { id: 'historical', label: 'Historical' },
];

const formats: { id: MediaFilter; label: string }[] = [
  { id: 'all', label: 'Any format' },
  { id: 'audio', label: 'Incoming' },
  { id: 'text', label: 'Text only' },
];

const sorts: { id: SortKey; label: string }[] = [
  { id: 'default', label: 'Recommended' },
  { id: 'duration', label: 'Longest first' },
  { id: 'title', label: 'A → Z' },
];

function sortStories(list: StoryItem[], sortBy: SortKey): StoryItem[] {
  if (sortBy === 'duration') return [...list].sort((a, b) => b.durationMs - a.durationMs);
  if (sortBy === 'title') return [...list].sort((a, b) => a.title.localeCompare(b.title));
  return list;
}

function SectionGateway({
  slug,
  count,
  onOpen,
}: {
  slug: SectionSlug;
  count: number;
  onOpen: () => void;
}) {
  const { colors, isDark } = useTheme();
  const meta = sectionsMeta[slug];
  const accent = sectionAccent(slug, isDark);
  const Icon = sectionIcons[slug];
  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`Open ${meta.title}, ${count} stories`}
      style={({ pressed }) => [
        styles.gateway,
        {
          backgroundColor: isDark ? colors.card : colors.paper,
          borderColor: alpha(accent.primary, isDark ? 0.45 : 0.22),
          opacity: pressed ? 0.92 : 1,
        },
        shadow('sm', isDark),
      ]}
    >
      <View style={[styles.gatewayAccent, { backgroundColor: accent.primary }]} />
      <View style={[styles.gatewayIcon, { backgroundColor: isDark ? alpha(accent.primary, 0.18) : accent.surface }]}>
        <Icon size={22} color={accent.primary} strokeWidth={2.1} />
      </View>
      <View style={styles.gatewayCopy}>
        <Text style={[styles.gatewayTitle, { color: colors.ink }]} numberOfLines={1}>
          {meta.title}
        </Text>
        <Text style={[styles.gatewayArabic, { color: accent.primary }]} numberOfLines={1}>
          {meta.titleAr}
        </Text>
        <Small color={colors.inkMuted} numberOfLines={2} style={styles.gatewayBlurb}>
          {meta.conceptTagline}
        </Small>
        <Caption color={colors.inkSubtle} style={styles.gatewayCount}>
          {count} {meta.countLabel.toLowerCase()}
        </Caption>
      </View>
      <ArrowRight size={18} color={accent.primary} />
    </Pressable>
  );
}

/** Explore: calm category gateways, then a focused shelf for the section you open. */
export default function ExploreScreen() {
  const { colors, isDark } = useTheme();
  const { padX, pillEndPad, screenContent } = useMobileLayout();
  const { stories } = useCatalog();

  const [selectedSection, setSelectedSection] = useState<SectionSlug | 'all'>('all');
  const [query, setQuery] = useState('');
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>('all');
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>('all');
  const [sortBy, setSortBy] = useState<SortKey>('default');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeStory, setActiveStory] = useState<StoryItem | null>(null);
  const [sessionMode, setSessionMode] = useState<StorySessionMode>(null);

  useFocusEffect(
    useCallback(() => {
      const intent = takeExploreIntent();
      if (!intent) return;
      if (intent.section) setSelectedSection(intent.section);
      if (typeof intent.query === 'string') setQuery(intent.query);
    }, []),
  );

  const emeraldGradient = brandGradients.emerald[isDark ? 'dark' : 'light'];
  const activeFilterCount =
    (mediaFilter === 'all' ? 0 : 1) + (gradeFilter === 'all' ? 0 : 1) + (sortBy === 'default' ? 0 : 1);

  const sectionCounts = useMemo(() => {
    const counts = {} as Record<SectionSlug, number>;
    for (const slug of SECTION_ORDER) counts[slug] = 0;
    for (const story of stories) counts[story.sectionSlug] += 1;
    return counts;
  }, [stories]);

  const filteredStories = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = stories.filter((story) => {
      if (selectedSection !== 'all' && story.sectionSlug !== selectedSection) return false;
      if (selectedSection === 'seerah-shamail' && !needle && isSeerahTimelineStory(story.id)) return false;
      if (selectedSection === 'qisas-al-quran' && !needle) return false;
      if (mediaFilter === 'audio') return false;
      if (mediaFilter === 'text' && story.hasAudio) return false;
      if (gradeFilter !== 'all' && story.authenticityGrade !== gradeFilter) return false;
      if (!needle) return true;
      return (
        story.title.toLowerCase().includes(needle) ||
        story.titleAr.includes(needle) ||
        story.figureName.toLowerCase().includes(needle) ||
        story.summary.toLowerCase().includes(needle) ||
        story.sourceCitation.toLowerCase().includes(needle)
      );
    });
    return sortStories(list, sortBy);
  }, [stories, selectedSection, mediaFilter, gradeFilter, query, sortBy]);

  const searching = query.trim().length > 0;
  const showPathShelf =
    !searching && (selectedSection === 'seerah-shamail' || selectedSection === 'qisas-al-quran');
  const showGroupedBrowse = selectedSection === 'all' && !searching;
  const activeMeta = selectedSection !== 'all' ? sectionsMeta[selectedSection] : null;
  const accent = selectedSection !== 'all' ? sectionAccent(selectedSection, isDark) : null;

  const resolveProphetStory = (prophet: ProphetFigure): StoryItem | null => {
    const matches = storiesForProphetSlug(stories, prophet.slug, prophet.nameEn);
    const preferred = preferProphetCatalogStory(matches, prophet.nameEn);
    return prophetChapterToStoryItem(prophet.slug, preferred) ?? preferred ?? null;
  };

  const resolveSahabahStory = (companion: SahabahFigure): StoryItem | null => {
    const matches = storiesForSahabahSlug(stories, companion.slug, companion.nameEn);
    const preferred = preferSahabahCatalogStory(matches, companion.nameEn);
    return sahabahChapterToStoryItem(companion.slug, preferred) ?? preferred ?? null;
  };

  const openProphetStories = (prophet: ProphetFigure) => {
    const story = resolveProphetStory(prophet);
    if (!story) return;
    setActiveStory(story);
    setSessionMode('read');
  };

  const openSahabahStories = (companion: SahabahFigure) => {
    const story = resolveSahabahStory(companion);
    if (!story) return;
    setActiveStory(story);
    setSessionMode('read');
  };

  const openStory = (story: StoryItem, mode: Exclude<StorySessionMode, null>) => {
    if (story.sectionSlug === 'qisas-al-anbiya') {
      const prophet =
        theProphets.find(
          (item) =>
            item.nameEn.toLowerCase() === story.figureName.toLowerCase() ||
            story.figureName.toLowerCase().includes(item.nameEn.toLowerCase()) ||
            item.nameEn.toLowerCase().includes(story.figureName.toLowerCase()),
        ) ?? null;
      if (prophet) {
        const full = resolveProphetStory(prophet);
        if (full) {
          setActiveStory(full);
          setSessionMode(mode);
          return;
        }
      }
    }
    if (story.sectionSlug === 'sahabah') {
      const companion =
        theSahabah.find(
          (item) =>
            item.nameEn.toLowerCase() === story.figureName.toLowerCase() ||
            story.figureName.toLowerCase().includes(item.nameEn.toLowerCase()) ||
            item.nameEn.toLowerCase().includes(story.figureName.toLowerCase()) ||
            story.id.includes(item.slug),
        ) ?? null;
      if (companion) {
        const full = resolveSahabahStory(companion);
        if (full) {
          setActiveStory(full);
          setSessionMode(mode);
          return;
        }
      }
    }
    setActiveStory(story);
    setSessionMode(mode);
  };

  const resetAll = () => {
    setQuery('');
    setMediaFilter('all');
    setGradeFilter('all');
    setSortBy('default');
    setSelectedSection('all');
  };

  const surpriseMe = () => {
    const pool =
      selectedSection === 'all'
        ? stories
        : stories.filter((story) => story.sectionSlug === selectedSection);
    if (!pool.length) return;
    openStory(pool[Math.floor(Math.random() * pool.length)], 'read');
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
            <Overline color={colors.emerald}>Discover</Overline>
            <Text style={[styles.brand, { color: colors.ink }]}>Explore</Text>
            <Caption color={colors.inkMuted}>Four collections · {stories.length} stories</Caption>
          </View>
          <ModeToggle />
        </Row>

        <View
          style={[
            styles.search,
            { backgroundColor: colors.card, borderColor: colors.border },
            shadow('sm', isDark),
          ]}
        >
          <Search size={17} color={colors.inkSubtle} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={
              selectedSection === 'all'
                ? 'Search a story or figure…'
                : `Search in ${sectionsMeta[selectedSection].shortTitle}…`
            }
            placeholderTextColor={colors.inkSubtle}
            style={[styles.searchInput, { color: colors.ink }]}
            accessibilityLabel="Search the collection"
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Clear search">
              <X size={15} color={colors.inkMuted} />
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => setFiltersOpen((open) => !open)}
            style={[
              styles.filterToggle,
              {
                backgroundColor: filtersOpen || activeFilterCount ? colors.emerald : colors.subtleBg,
              },
            ]}
            accessibilityRole="button"
            accessibilityState={{ expanded: filtersOpen }}
            accessibilityLabel={`Filters${activeFilterCount ? `, ${activeFilterCount} active` : ''}`}
          >
            <SlidersHorizontal
              size={15}
              color={filtersOpen || activeFilterCount ? '#FFFFFF' : colors.inkMuted}
            />
          </Pressable>
        </View>

        {filtersOpen ? (
          <View style={[styles.filterPanel, { backgroundColor: isDark ? colors.cardAlt : colors.subtleBg }]}>
            <Row justify="space-between" style={styles.filterHead}>
              <Row gap={7}>
                <Filter size={14} color={colors.emerald} />
                <Overline color={colors.ink}>Refine</Overline>
              </Row>
              {activeFilterCount ? (
                <Pressable onPress={resetAll} accessibilityRole="button" accessibilityLabel="Clear all filters">
                  <Caption color={colors.gold}>Clear</Caption>
                </Pressable>
              ) : null}
            </Row>
            <Caption color={colors.inkSubtle} style={styles.filterLabel}>
              Authenticity
            </Caption>
            <Row gap={7} style={styles.filterGroup}>
              {grades.map((grade) => (
                <Pill
                  key={grade.id}
                  label={grade.label}
                  selected={gradeFilter === grade.id}
                  onPress={() => setGradeFilter(grade.id)}
                  gradient={emeraldGradient}
                />
              ))}
            </Row>
            <Caption color={colors.inkSubtle} style={styles.filterLabel}>
              Format
            </Caption>
            <Row gap={7} style={styles.filterGroup}>
              {formats.map((format) => (
                <Pill
                  key={format.id}
                  label={format.label}
                  selected={mediaFilter === format.id}
                  onPress={() => setMediaFilter(format.id)}
                  gradient={emeraldGradient}
                />
              ))}
            </Row>
            <Caption color={colors.inkSubtle} style={styles.filterLabel}>
              Sort
            </Caption>
            <Row gap={7} style={styles.filterGroupLast}>
              {sorts.map((sort) => (
                <Pill
                  key={sort.id}
                  label={sort.label}
                  selected={sortBy === sort.id}
                  onPress={() => setSortBy(sort.id)}
                  gradient={brandGradients.gold[isDark ? 'dark' : 'light']}
                />
              ))}
            </Row>
          </View>
        ) : null}

        {!showGroupedBrowse ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: -padX }}
            contentContainerStyle={[styles.pillsContent, { paddingLeft: padX, paddingRight: padX + pillEndPad }]}
          >
            <Pill
              label="All"
              selected={selectedSection === 'all'}
              onPress={() => setSelectedSection('all')}
              gradient={emeraldGradient}
            />
            {SECTION_ORDER.map((slug) => (
              <Pill
                key={slug}
                label={sectionsMeta[slug].shortTitle}
                icon={sectionIcons[slug]}
                selected={selectedSection === slug}
                onPress={() => setSelectedSection(slug)}
                gradient={sectionAccent(slug, isDark).accentGradient}
              />
            ))}
          </ScrollView>
        ) : null}

        {showGroupedBrowse ? (
          <View style={styles.gatewayList}>
            <Row justify="space-between" align="center" style={styles.sectionHead}>
              <Overline>Collections</Overline>
              <Pressable
                onPress={surpriseMe}
                accessibilityRole="button"
                accessibilityLabel="Open a random story"
                style={styles.surprise}
              >
                <Shuffle size={13} color={colors.gold} />
                <Caption color={colors.gold}>Surprise me</Caption>
              </Pressable>
            </Row>
            {SECTION_ORDER.map((slug) => (
              <SectionGateway
                key={slug}
                slug={slug}
                count={sectionCounts[slug]}
                onOpen={() => setSelectedSection(slug)}
              />
            ))}
          </View>
        ) : null}

        {activeMeta && accent ? (
          <View style={styles.sectionHero}>
            <Pressable
              onPress={() => setSelectedSection('all')}
              accessibilityRole="button"
              accessibilityLabel="Back to all collections"
              style={styles.backRow}
            >
              <ChevronLeft size={16} color={colors.inkMuted} />
              <Caption color={colors.inkMuted}>All collections</Caption>
            </Pressable>
            <Overline color={accent.primary}>{activeMeta.subtitle}</Overline>
            <Text style={[styles.sectionTitle, { color: colors.ink }]}>{activeMeta.title}</Text>
            <Body color={colors.inkMuted} style={styles.sectionBody}>
              {activeMeta.description}
            </Body>
            <Row gap={10} style={styles.sectionMeta} align="center">
              <Caption color={accent.primary} style={styles.sectionCount}>
                {sectionCounts[selectedSection as SectionSlug]} {activeMeta.countLabel.toLowerCase()}
              </Caption>
              <Pressable onPress={surpriseMe} accessibilityRole="button" style={styles.surprise}>
                <Shuffle size={13} color={colors.gold} />
                <Caption color={colors.gold}>Random</Caption>
              </Pressable>
            </Row>
          </View>
        ) : null}

        {selectedSection === 'qisas-al-anbiya' ? <ProphetsRoster onSelect={openProphetStories} /> : null}
        {selectedSection === 'qisas-al-quran' ? (
          <QuranStoriesPath
            onSelect={(slug) => {
              const story = quranStoryToStoryItem(slug);
              if (!story) return;
              setActiveStory(story);
              setSessionMode('read');
            }}
          />
        ) : null}
        {selectedSection === 'seerah-shamail' ? (
          <SeerahPath
            onSelect={(slug) => {
              const story = resolveSeerahTimelineStory(slug);
              if (!story) return;
              setActiveStory(story);
              setSessionMode('read');
            }}
          />
        ) : null}
        {selectedSection === 'sahabah' ? <SahabahRoster onSelect={openSahabahStories} /> : null}

        {filteredStories.length === 0 && !showPathShelf && !showGroupedBrowse ? (
          <EmptyState
            icon={mediaFilter === 'audio' ? Headphones : SearchX}
            title={mediaFilter === 'audio' ? 'Listening is incoming' : 'Nothing found'}
            description={
              mediaFilter === 'audio'
                ? 'Spoken playback is a future feature. Reset filters and read stories now.'
                : 'No story matches this combination of search and filters.'
            }
            actionLabel="Reset everything"
            onAction={resetAll}
            gradient={emeraldGradient}
          />
        ) : searching || (selectedSection !== 'all' && !showPathShelf && selectedSection !== 'qisas-al-anbiya' && selectedSection !== 'sahabah') ? (
          <View style={styles.list}>
            {searching ? (
              <Overline style={styles.resultsLabel}>
                {filteredStories.length} {filteredStories.length === 1 ? 'result' : 'results'}
              </Overline>
            ) : null}
            {filteredStories.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                variant="compact"
                onRead={() => openStory(story, 'read')}
                onListen={() => openStory(story, 'listen')}
              />
            ))}
          </View>
        ) : null}

        {selectedSection !== 'all' && !searching && (selectedSection === 'qisas-al-anbiya' || selectedSection === 'sahabah') ? (
          <Caption color={colors.inkSubtle} style={styles.footerHint}>
            Tap a name to open their story.
          </Caption>
        ) : null}
      </ScrollView>

      <StorySessionModal
        story={activeStory}
        mode={sessionMode}
        onChangeMode={(mode) => {
          setSessionMode(mode);
          if (!mode) setActiveStory(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },
  content: { gap: 0 },
  header: { marginBottom: 16 },
  brandBlock: { flex: 1, minWidth: 0, gap: 2 },
  brand: {
    fontFamily: DISPLAY_FONT_FAMILY,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingLeft: 14,
    paddingRight: 8,
    paddingVertical: 6,
    borderRadius: radius.xl,
    borderWidth: 1,
    minHeight: 48,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 8,
    fontFamily: BODY_FONT_FAMILY,
    fontSize: 14,
    fontWeight: '500',
    ...(({ outlineStyle: 'none' } as unknown) as object),
  },
  filterToggle: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  filterPanel: { borderRadius: radius.xl, padding: 14, marginBottom: 14, gap: 2 },
  filterHead: { marginBottom: 10 },
  filterLabel: { marginBottom: 8, marginTop: 4, fontWeight: '700' },
  filterGroup: { marginBottom: 12, flexWrap: 'wrap' },
  filterGroupLast: { flexWrap: 'wrap' },
  pillsContent: { gap: 8, paddingBottom: 14 },
  sectionHead: { marginBottom: 12 },
  surprise: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  gatewayList: { gap: 12, marginBottom: 8 },
  gateway: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: radius.xl,
    paddingVertical: 14,
    paddingRight: 14,
    paddingLeft: 0,
    overflow: 'hidden',
  },
  gatewayAccent: { width: 4, alignSelf: 'stretch', borderTopRightRadius: 2, borderBottomRightRadius: 2 },
  gatewayIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  gatewayCopy: { flex: 1, minWidth: 0, gap: 2 },
  gatewayTitle: {
    fontFamily: DISPLAY_FONT_FAMILY,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  gatewayArabic: { fontSize: 13, lineHeight: 20, textAlign: 'left' },
  gatewayBlurb: { marginTop: 2 },
  gatewayCount: { marginTop: 4, fontWeight: '700' },
  sectionHero: { marginBottom: 16, gap: 4 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 8, alignSelf: 'flex-start' },
  sectionTitle: {
    fontFamily: DISPLAY_FONT_FAMILY,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  sectionBody: { marginTop: 4, lineHeight: 22 },
  sectionMeta: { marginTop: 10 },
  sectionCount: { fontWeight: '800' },
  list: { gap: 12, marginBottom: 8 },
  resultsLabel: { marginBottom: 8 },
  footerHint: { marginTop: 8, marginBottom: 4 },
});
