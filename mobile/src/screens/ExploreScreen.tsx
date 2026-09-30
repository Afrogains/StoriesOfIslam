import {
  ArrowDownWideNarrow,
  ArrowRight,
  CheckCircle2,
  Filter,
  Headphones,
  Search,
  SearchX,
  SlidersHorizontal,
  SortAsc,
  X,
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import ScreenHeader from '../components/ScreenHeader';
import { takeExploreIntent } from '../navigation/exploreIntent';
import ProphetsRoster from '../components/ProphetsRoster';
import SahabahRoster from '../components/SahabahRoster';
import StoryCard, { sectionIcons } from '../components/StoryCard';
import StorySessionModal, { type StorySessionMode } from '../components/StorySessionModal';
import {
  Body,
  Caption,
  Card,
  EmptyState,
  Heading,
  IconBubble,
  Overline,
  Pill,
  Row,
  SectionHeading,
  Small,
  useTheme,
} from '../components/ui';
import { SECTION_ORDER, groupStoriesBySection } from '../data/catalogBrowse';
import { sectionsMeta } from '../data/catalogMeta';
import type {
  AuthenticityGrade,
  MediaFilter,
  SectionSlug,
  StoryItem,
} from '../types/catalog';
import { useCatalog } from '../data/CatalogProvider';
import {
  preferProphetCatalogStory,
  prophetChapterToStoryItem,
} from '../data/prophetChapters';
import {
  preferSahabahCatalogStory,
  sahabahChapterToStoryItem,
} from '../data/sahabahChapters';
import { storiesForProphetSlug, storiesForSahabahSlug } from '../data/storyAdapters';
import { brandGradients, radius, sectionAccent, shadow } from '../theme/tokens';
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
  { id: 'audio', label: 'With audio' },
  { id: 'text', label: 'Text only' },
];

const sorts: { id: SortKey; label: string }[] = [
  { id: 'default', label: 'Recommended' },
  { id: 'duration', label: 'Longest first' },
  { id: 'title', label: 'A → Z' },
];

const PREVIEW_PER_SECTION = 2;

function sortStories(list: StoryItem[], sortBy: SortKey): StoryItem[] {
  if (sortBy === 'duration') return [...list].sort((a, b) => b.durationMs - a.durationMs);
  if (sortBy === 'title') return [...list].sort((a, b) => a.title.localeCompare(b.title));
  return list;
}

/** Explore: browse by category first; drill into a section for the full shelf. */
export default function ExploreScreen() {
  const { colors, isDark } = useTheme();
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
  const goldGradient = brandGradients.gold[isDark ? 'dark' : 'light'];

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
      if (mediaFilter === 'audio' && !story.hasAudio) return false;
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

  const grouped = useMemo(
    () => groupStoriesBySection(filteredStories),
    [filteredStories],
  );

  const searching = query.trim().length > 0;
  const showGroupedBrowse = selectedSection === 'all' && !searching;
  const audioCount = filteredStories.filter((story) => story.hasAudio).length;
  const activeMeta = selectedSection !== 'all' ? sectionsMeta[selectedSection] : null;

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

  return (
    <View style={[styles.screen, { backgroundColor: colors.paper }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader eyebrow="Explore" title="Categories" arabic="التصنيفات" />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.pills}
          contentContainerStyle={styles.pillsContent}
        >
          <Pill
            label={`All · ${stories.length}`}
            selected={selectedSection === 'all'}
            onPress={() => setSelectedSection('all')}
            gradient={emeraldGradient}
          />
          {SECTION_ORDER.map((slug) => (
            <Pill
              key={slug}
              label={`${sectionsMeta[slug].title} · ${sectionCounts[slug]}`}
              icon={sectionIcons[slug]}
              selected={selectedSection === slug}
              onPress={() => setSelectedSection(slug)}
              gradient={sectionAccent(slug, isDark).accentGradient}
            />
          ))}
        </ScrollView>

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
                ? 'Search across all categories…'
                : `Search in ${sectionsMeta[selectedSection].title}…`
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
              { backgroundColor: filtersOpen || activeFilterCount ? colors.emerald : colors.subtleBg },
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

        <Caption color={colors.inkMuted} style={styles.summaryRow}>
          {showGroupedBrowse
            ? `${SECTION_ORDER.length} categories · ${stories.length} stories`
            : `${filteredStories.length} stories${audioCount ? ` · ${audioCount} with audio` : ''}`}
          {activeFilterCount ? ` · ${activeFilterCount} filters` : ''}
        </Caption>

        {filtersOpen ? (
          <Card style={styles.filterPanel} padding={16}>
            <Row justify="space-between" style={styles.filterHead}>
              <Row gap={7}>
                <Filter size={14} color={colors.emerald} />
                <Overline color={colors.ink}>Refine results</Overline>
              </Row>
              {activeFilterCount ? (
                <Pressable onPress={resetAll} accessibilityRole="button" accessibilityLabel="Clear all filters">
                  <Caption color={colors.gold}>Clear all</Caption>
                </Pressable>
              ) : null}
            </Row>

            <Row gap={6} style={styles.filterGroupLabel}>
              <CheckCircle2 size={12} color={colors.inkSubtle} />
              <Caption>Authenticity grade</Caption>
            </Row>
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

            <Row gap={6} style={styles.filterGroupLabel}>
              <Headphones size={12} color={colors.inkSubtle} />
              <Caption>Media format</Caption>
            </Row>
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

            <Row gap={6} style={styles.filterGroupLabel}>
              <ArrowDownWideNarrow size={12} color={colors.inkSubtle} />
              <Caption>Sort order</Caption>
            </Row>
            <Row gap={7} style={styles.filterGroupLast}>
              {sorts.map((sort) => (
                <Pill
                  key={sort.id}
                  label={sort.label}
                  icon={sort.id === 'title' ? SortAsc : undefined}
                  selected={sortBy === sort.id}
                  onPress={() => setSortBy(sort.id)}
                  gradient={goldGradient}
                />
              ))}
            </Row>
          </Card>
        ) : null}

        {showGroupedBrowse ? (
          <View style={styles.categoryGrid}>
            {SECTION_ORDER.map((slug) => {
              const meta = sectionsMeta[slug];
              const accent = sectionAccent(slug, isDark);
              const count = sectionCounts[slug];
              return (
                <Card
                  key={slug}
                  style={styles.categoryCard}
                  padding={14}
                  accent={accent.primary}
                  onPress={() => setSelectedSection(slug)}
                  accessibilityLabel={`${meta.title}: ${count} stories`}
                >
                  <Row justify="space-between" align="flex-start">
                    <IconBubble
                      icon={sectionIcons[slug]}
                      color={accent.primary}
                      background={isDark ? colors.cardAlt : accent.surface}
                      size={34}
                    />
                    <Caption color={accent.primary}>{count}</Caption>
                  </Row>
                  <Heading style={styles.categoryTitle} numberOfLines={1}>
                    {meta.title}
                  </Heading>
                  <Small color={colors.inkMuted} numberOfLines={2} style={styles.categorySubtitle}>
                    {meta.subtitle}
                  </Small>
                  <Row justify="space-between" style={styles.categoryFooter}>
                    <Caption color={accent.primary}>Open category</Caption>
                    <ArrowRight size={13} color={accent.primary} />
                  </Row>
                </Card>
              );
            })}
          </View>
        ) : null}

        {activeMeta ? (
          <Card
            style={styles.sectionIntro}
            padding={14}
            accent={sectionAccent(selectedSection as SectionSlug, isDark).primary}
          >
            <Overline color={sectionAccent(selectedSection as SectionSlug, isDark).primary}>
              {activeMeta.conceptTagline}
            </Overline>
            <Heading style={styles.sectionIntroTitle}>{activeMeta.title}</Heading>
            <Body color={colors.inkMuted} numberOfLines={2} style={styles.sectionIntroBody}>
              {activeMeta.description}
            </Body>
            <Pressable
              onPress={() => setSelectedSection('all')}
              accessibilityRole="button"
              accessibilityLabel="Back to all categories"
              style={styles.backLink}
            >
              <Caption color={colors.gold}>← All categories</Caption>
            </Pressable>
          </Card>
        ) : null}

        {selectedSection === 'qisas-al-anbiya' ? (
          <ProphetsRoster onSelect={openProphetStories} />
        ) : null}

        {selectedSection === 'sahabah' ? (
          <SahabahRoster onSelect={openSahabahStories} />
        ) : null}

        {filteredStories.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="Nothing found"
            description="No story matches this combination of search and filters."
            actionLabel="Reset everything"
            onAction={resetAll}
            gradient={emeraldGradient}
          />
        ) : showGroupedBrowse ? (
          <View style={styles.grouped}>
            {grouped.map(({ slug, stories: sectionStories }) => {
              const meta = sectionsMeta[slug];
              const preview = sectionStories.slice(0, PREVIEW_PER_SECTION);
              return (
                <View key={slug} style={styles.groupBlock}>
                  <SectionHeading
                    label={meta.title}
                    trailing={`${sectionStories.length} ${meta.countLabel.toLowerCase()}`}
                  />
                  <View style={styles.list}>
                    {preview.map((story) => (
                      <StoryCard
                        key={story.id}
                        story={story}
                        variant="compact"
                        onRead={() => openStory(story, 'read')}
                        onListen={() => openStory(story, 'listen')}
                      />
                    ))}
                  </View>
                  {sectionStories.length > PREVIEW_PER_SECTION ? (
                    <Pressable
                      onPress={() => setSelectedSection(slug)}
                      accessibilityRole="button"
                      accessibilityLabel={`View all ${meta.title}`}
                      style={styles.viewAll}
                    >
                      <Caption color={sectionAccent(slug, isDark).primary}>
                        View all {sectionStories.length} in {meta.title}
                      </Caption>
                      <ArrowRight size={13} color={sectionAccent(slug, isDark).primary} />
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.list}>
            <SectionHeading
              label={searching ? 'Search results' : activeMeta?.title ?? 'Catalog'}
              trailing={
                sortBy === 'default' ? 'Recommended' : sorts.find((s) => s.id === sortBy)?.label
              }
            />
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
        )}
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
  content: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 120 },

  pills: { marginBottom: 12, overflow: 'visible' },
  pillsContent: { gap: 8, paddingRight: 4 },

  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 7,
    fontSize: 13,
    fontWeight: '500',
    ...(({ outlineStyle: 'none' } as unknown) as object),
  },
  filterToggle: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },

  summaryRow: { marginTop: 10, marginBottom: 12 },

  filterPanel: { marginBottom: 14 },
  filterHead: { marginBottom: 14 },
  filterGroupLabel: { marginBottom: 8 },
  filterGroup: { marginBottom: 16, flexWrap: 'wrap' },
  filterGroupLast: { flexWrap: 'wrap' },

  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 18,
  },
  categoryCard: { width: '47.8%' },
  categoryTitle: { marginTop: 10 },
  categorySubtitle: { marginTop: 3, minHeight: 32 },
  categoryFooter: { marginTop: 10 },

  sectionIntro: { marginBottom: 14, gap: 4 },
  sectionIntroTitle: { marginTop: 4 },
  sectionIntroBody: { marginTop: 4 },
  backLink: { marginTop: 8, alignSelf: 'flex-start' },

  grouped: { gap: 8 },
  groupBlock: { marginBottom: 12 },
  list: { gap: 10 },
  viewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
});
