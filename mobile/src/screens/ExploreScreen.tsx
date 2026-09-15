import {
  ArrowDownWideNarrow,
  CheckCircle2,
  Clock,
  Filter,
  Headphones,
  Search,
  SearchX,
  SlidersHorizontal,
  SortAsc,
  Sparkles,
  X,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import ScreenHeader from '../components/ScreenHeader';
import StoryCard, { sectionIcons } from '../components/StoryCard';
import SynchronizedAudioReader from '../components/SynchronizedAudioReader';
import {
  Caption,
  Card,
  EmptyState,
  Overline,
  Pill,
  Row,
  SectionHeading,
  Small,
  useTheme,
} from '../components/ui';
import {
  allStandardStories,
  sectionsMeta,
  type AuthenticityGrade,
  type MediaFilter,
  type SectionSlug,
  type StoryItem,
} from '../data/mockHome';
import { toReaderStory } from '../data/storyAdapters';
import { brandGradients, radius, sectionAccent, shadow } from '../theme/tokens';

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

export default function ExploreScreen() {
  const { colors, isDark } = useTheme();

  const [selectedSection, setSelectedSection] = useState<SectionSlug | 'all'>('all');
  const [query, setQuery] = useState('');
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>('all');
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>('all');
  const [sortBy, setSortBy] = useState<SortKey>('default');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeStory, setActiveStory] = useState<StoryItem | null>(null);

  const emeraldGradient = brandGradients.emerald[isDark ? 'dark' : 'light'];
  const goldGradient = brandGradients.gold[isDark ? 'dark' : 'light'];

  const activeFilterCount =
    (mediaFilter === 'all' ? 0 : 1) + (gradeFilter === 'all' ? 0 : 1) + (sortBy === 'default' ? 0 : 1);

  const filteredStories = useMemo(() => {
    const needle = query.trim().toLowerCase();

    const list = allStandardStories.filter((story) => {
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

    if (sortBy === 'duration') return [...list].sort((a, b) => b.durationMs - a.durationMs);
    if (sortBy === 'title') return [...list].sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [selectedSection, mediaFilter, gradeFilter, query, sortBy]);

  const audioCount = filteredStories.filter((story) => story.hasAudio).length;
  const totalMinutes = Math.round(
    filteredStories.reduce((sum, story) => sum + story.durationMs, 0) / 60000,
  );

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
        <ScreenHeader
          eyebrow="Explore collection"
          title="All stories"
          arabic="جميع القصص"
          subtitle="Authentic accounts drawn from classical sources"
        />

        {/* Category pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.pills}
          contentContainerStyle={styles.pillsContent}
        >
          <Pill
            label="All categories"
            selected={selectedSection === 'all'}
            onPress={() => setSelectedSection('all')}
            gradient={emeraldGradient}
          />
          {(Object.keys(sectionsMeta) as SectionSlug[]).map((slug) => (
            <Pill
              key={slug}
              label={sectionsMeta[slug].title}
              icon={sectionIcons[slug]}
              selected={selectedSection === slug}
              onPress={() => setSelectedSection(slug)}
              gradient={sectionAccent(slug, isDark).accentGradient}
            />
          ))}
        </ScrollView>

        {/* Search */}
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
            placeholder="Search title, figure, or citation…"
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

        {/* Result summary strip */}
        <Row gap={14} style={styles.summaryRow}>
          <Row gap={5}>
            <Sparkles size={12} color={colors.gold} />
            <Caption>{filteredStories.length} results</Caption>
          </Row>
          <Row gap={5}>
            <Headphones size={12} color={colors.emerald} />
            <Caption>{audioCount} with audio</Caption>
          </Row>
          <Row gap={5}>
            <Clock size={12} color={colors.inkSubtle} />
            <Caption>{totalMinutes} min total</Caption>
          </Row>
        </Row>

        {/* Filter panel */}
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

        <SectionHeading
          label={selectedSection === 'all' ? 'Catalog' : sectionsMeta[selectedSection].title}
          trailing={sortBy === 'default' ? 'Recommended order' : sorts.find((s) => s.id === sortBy)?.label}
        />

        {filteredStories.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="Nothing found"
            description="No story matches this combination of search and filters."
            actionLabel="Reset everything"
            onAction={resetAll}
            gradient={emeraldGradient}
          />
        ) : (
          <View style={styles.list}>
            {filteredStories.map((story) => (
              <StoryCard key={story.id} story={story} onPress={() => setActiveStory(story)} />
            ))}

            <Small align="center" style={styles.listEnd}>
              You’ve reached the end of the catalog · {filteredStories.length} stories
            </Small>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={activeStory !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setActiveStory(null)}
      >
        {activeStory ? (
          <SynchronizedAudioReader
            story={toReaderStory(activeStory)}
            sectionSlug={activeStory.sectionSlug}
            initiallyExpanded
            onClose={() => setActiveStory(null)}
          />
        ) : null}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 130 },

  pills: { marginBottom: 16, overflow: 'visible' },
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

  summaryRow: { marginTop: 12, marginBottom: 16, flexWrap: 'wrap' },

  filterPanel: { marginBottom: 20 },
  filterHead: { marginBottom: 14 },
  filterGroupLabel: { marginBottom: 8 },
  filterGroup: { marginBottom: 16, flexWrap: 'wrap' },
  filterGroupLast: { flexWrap: 'wrap' },

  list: { gap: 14 },
  listEnd: { marginTop: 10, paddingVertical: 8 },
});
