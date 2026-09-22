import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowRight,
  BookMarked,
  Clock,
  Flame,
  Headphones,
  Pause,
  Play,
  Quote,
  Search,
  SearchX,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import ScreenHeader from '../components/ScreenHeader';
import StoryCard, { sectionIcons } from '../components/StoryCard';
import StorySessionModal, { type StorySessionMode } from '../components/StorySessionModal';
import {
  ArabicBody,
  ArabicInline,
  Badge,
  Body,
  Caption,
  Card,
  Display,
  EmptyState,
  Heading,
  IconBubble,
  Overline,
  Pill,
  PlayButton,
  ProgressBar,
  Row,
  SectionHeading,
  Title,
  useTheme,
} from '../components/ui';
import { useCatalog } from '../data/CatalogProvider';
import { sectionsMeta } from '../data/catalogMeta';
import { useLibrary } from '../hooks/useLibrary';
import { brandGradients, radius, sectionAccent, shadow } from '../theme/tokens';
import type { MediaFilter, SectionSlug, StoryItem } from '../types/catalog';

const metricIcons: Record<string, LucideIcon> = {
  listened: Headphones,
  streak: Flame,
  favorites: BookMarked,
  hours: Clock,
};

const mediaFilters: { id: MediaFilter; label: string }[] = [
  { id: 'all', label: 'All content' },
  { id: 'audio', label: 'Audio stories' },
  { id: 'text', label: 'Text only' },
];

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { savedCount } = useLibrary();
  const { stories } = useCatalog();

  const [selectedSection, setSelectedSection] = useState<SectionSlug | 'all'>('all');
  const [query, setQuery] = useState('');
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeStory, setActiveStory] = useState<StoryItem | null>(null);
  const [sessionMode, setSessionMode] = useState<StorySessionMode>(null);

  const activeMeta = selectedSection !== 'all' ? sectionsMeta[selectedSection] : null;
  const featuredStory = stories[0];
  const continueStory = stories.find((story) => story.hasAudio) ?? featuredStory;
  const homeMetrics = useMemo(
    () => [
      { id: 'listened', label: 'Published Stories', value: String(stories.length) },
      { id: 'streak', label: 'Collections', value: String(new Set(stories.map((story) => story.sectionSlug)).size) },
      { id: 'favorites', label: 'Saved Stories', value: String(savedCount) },
      { id: 'hours', label: 'Audio Stories', value: String(stories.filter((story) => story.hasAudio).length) },
    ],
    [stories, savedCount],
  );
  const emeraldGradient = brandGradients.emerald[isDark ? 'dark' : 'light'];

  const filteredStories = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return stories.filter((story) => {
      if (selectedSection !== 'all' && story.sectionSlug !== selectedSection) return false;
      if (mediaFilter === 'audio' && !story.hasAudio) return false;
      if (mediaFilter === 'text' && story.hasAudio) return false;
      if (!needle) return true;

      return (
        story.title.toLowerCase().includes(needle) ||
        story.titleAr.includes(needle) ||
        story.figureName.toLowerCase().includes(needle) ||
        story.summary.toLowerCase().includes(needle)
      );
    });
  }, [stories, selectedSection, mediaFilter, query]);

  const showDashboard = selectedSection === 'all' && !query;

  const resetFilters = () => {
    setQuery('');
    setMediaFilter('all');
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
          eyebrow="Assalamu alaikum"
          title="Stories of Islam"
          arabic="السلام عليكم ورحمة الله"
        />

        {/* Section navigation */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.pills}
          contentContainerStyle={styles.pillsContent}
        >
          <Pill
            label="All sections"
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

        {/* Hero: daily verse, or the concept banner for the chosen section */}
        {selectedSection === 'all' && featuredStory ? (
          <LinearGradient
            colors={brandGradients.verse[isDark ? 'dark' : 'light']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.hero, shadow('md', isDark)]}
          >
            <Row justify="space-between">
              <Row gap={7}>
                <Quote size={13} color="#5EEAD4" />
                <Overline color="#5EEAD4">Featured reflection</Overline>
              </Row>
              <Badge label={featuredStory.authenticityGrade} color="#CCFBF1" background="rgba(204, 251, 241, 0.16)" />
            </Row>

            <ArabicBody color="#FDE68A" style={styles.heroArabic}>
              {featuredStory.titleAr}
            </ArabicBody>

            <Body color="#E7E5E4" style={styles.heroTranslation}>
              {featuredStory.summary}
            </Body>

            <View style={[styles.heroFooter, { borderTopColor: 'rgba(255,255,255,0.16)' }]}>
              <Caption color="#5EEAD4">{featuredStory.sourceCitation}</Caption>
            </View>
          </LinearGradient>
        ) : selectedSection !== 'all' ? (
          <LinearGradient
            colors={sectionAccent(selectedSection, isDark).gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.hero, shadow('md', isDark)]}
          >
            <Row justify="space-between" align="flex-start">
              <Badge
                label={activeMeta?.conceptTagline ?? ''}
                color="#FFFFFF"
                background="rgba(255,255,255,0.2)"
                style={styles.conceptBadge}
              />
              <ArabicInline color="#FDE68A">{activeMeta?.titleAr}</ArabicInline>
            </Row>

            <Display color="#FFFFFF" style={styles.heroTitle}>
              {activeMeta?.subtitle}
            </Display>
            <Body color="#E7E5E4" style={styles.heroTranslation}>
              {activeMeta?.description}
            </Body>

            <View style={[styles.heroFooter, { borderTopColor: 'rgba(255,255,255,0.16)' }]}>
              <Row justify="space-between">
                <Caption color="#E7E5E4">{activeMeta?.countLabel}</Caption>
                <Row gap={5}>
                  <Caption color="#FDE68A">Browse section</Caption>
                  <ArrowRight size={12} color="#FDE68A" />
                </Row>
              </Row>
            </View>
          </LinearGradient>
        ) : null}

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
            placeholder={
              selectedSection === 'all'
                ? 'Search stories, figures, sources…'
                : `Search in ${sectionsMeta[selectedSection].title}…`
            }
            placeholderTextColor={colors.inkSubtle}
            style={[styles.searchInput, { color: colors.ink }]}
            accessibilityLabel="Search stories"
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
              { backgroundColor: filtersOpen ? colors.emerald : colors.subtleBg },
            ]}
            accessibilityRole="button"
            accessibilityState={{ expanded: filtersOpen }}
            accessibilityLabel="Toggle filters"
          >
            <SlidersHorizontal size={15} color={filtersOpen ? '#FFFFFF' : colors.inkMuted} />
          </Pressable>
        </View>

        {filtersOpen ? (
          <Row gap={8} style={styles.filterRow}>
            {mediaFilters.map((filter) => (
              <Pill
                key={filter.id}
                label={filter.label}
                selected={mediaFilter === filter.id}
                onPress={() => setMediaFilter(filter.id)}
                gradient={emeraldGradient}
              />
            ))}
          </Row>
        ) : null}

        {showDashboard ? (
          <>
            {/* Listening stats */}
            <SectionHeading label="Your progress" trailing="This month" />
            <View style={styles.metrics}>
              {homeMetrics.map((metric) => {
                const Icon = metricIcons[metric.id] ?? Headphones;
                const value = metric.id === 'favorites' ? `${savedCount}` : metric.value;

                return (
                  <Card key={metric.id} style={styles.metricCard} padding={14}>
                    <Row justify="space-between">
                      <IconBubble icon={Icon} color={colors.gold} size={30} rounded={radius.sm} />
                      <Overline>{metric.id === 'streak' ? 'Streak' : 'Total'}</Overline>
                    </Row>
                    <Title style={styles.metricValue}>{value}</Title>
                    <Caption color={colors.inkMuted}>{metric.label}</Caption>
                  </Card>
                );
              })}
            </View>

            {/* Section grid */}
            <SectionHeading label="Browse sections" trailing={`${Object.keys(sectionsMeta).length} collections`} />
            <View style={styles.sectionGrid}>
              {(Object.keys(sectionsMeta) as SectionSlug[]).map((slug) => {
                const meta = sectionsMeta[slug];
                const accent = sectionAccent(slug, isDark);

                return (
                  <Card
                    key={slug}
                    style={styles.sectionCard}
                    padding={14}
                    accent={accent.primary}
                    onPress={() => setSelectedSection(slug)}
                    accessibilityLabel={`${meta.title}: ${meta.subtitle}`}
                  >
                    <Row justify="space-between" align="flex-start">
                      <IconBubble
                        icon={sectionIcons[slug]}
                        color={accent.primary}
                        background={isDark ? colors.cardAlt : accent.surface}
                        size={36}
                      />
                      <ArabicInline color={accent.primary} style={styles.sectionArabic}>
                        {meta.titleAr}
                      </ArabicInline>
                    </Row>

                    <Heading style={styles.sectionTitle} numberOfLines={1}>
                      {meta.title}
                    </Heading>
                    <Caption numberOfLines={2} style={styles.sectionSubtitle}>
                      {meta.subtitle}
                    </Caption>

                    <Row justify="space-between" style={styles.sectionFooter}>
                      <Caption color={accent.primary}>
                        {stories.filter((story) => story.sectionSlug === slug).length} {meta.countLabel}
                      </Caption>
                      <ArrowRight size={13} color={accent.primary} />
                    </Row>
                  </Card>
                );
              })}
            </View>

            {/* Continue listening */}
            {continueStory ? <>
            <SectionHeading label={continueStory.hasAudio ? 'Ready to listen' : 'Continue reading'} trailing="Open reader" />
            <LinearGradient
              colors={brandGradients.night[isDark ? 'dark' : 'light']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.player, shadow('lg', isDark)]}
            >
              <Row justify="space-between" align="flex-start">
                <View style={styles.playerText}>
                  <Row gap={6}>
                    <Sparkles size={12} color="#FDE68A" />
                    <Overline color="#FDE68A">{continueStory.hasAudio ? 'Audio available' : 'Text edition'}</Overline>
                  </Row>
                  <Heading color="#FFFFFF" style={styles.playerTitle} numberOfLines={2}>
                    {continueStory.title}
                  </Heading>
                  <ArabicInline color="#FDE68A" style={styles.playerArabic}>
                    {continueStory.titleAr}
                  </ArabicInline>
                  <Caption color="#CBD5E1" style={styles.playerFigure}>
                    {continueStory.figureName}
                  </Caption>
                </View>

                <PlayButton
                  playing={false}
                  onPress={() => {
                    setActiveStory(continueStory);
                    setSessionMode('listen');
                  }}
                  gradient={emeraldGradient}
                  icons={{ play: Play, pause: Pause }}
                  accessibilityLabel={`Continue listening to ${continueStory.title}`}
                />
              </Row>

              <View style={styles.playerProgress}>
                <ProgressBar
                  value={0}
                  gradient={brandGradients.gold[isDark ? 'dark' : 'light']}
                  trackColor="rgba(255,255,255,0.14)"
                  height={5}
                />
                <Row justify="space-between" style={styles.playerMeta}>
                  <Caption color="#94A3B8">
                    Continue listening
                  </Caption>
                  <Caption color="#FDE68A">{continueStory.durationLabel}</Caption>
                </Row>
              </View>

              <Pressable
                onPress={() => {
                  setActiveStory(continueStory);
                  setSessionMode('read');
                }}
                style={({ pressed }) => [styles.playerAction, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Open reading mode"
              >
                <Caption color="#FFFFFF">Read Story</Caption>
                <ArrowRight size={12} color="#FFFFFF" />
              </Pressable>
            </LinearGradient>
            </> : null}
          </>
        ) : null}

        {/* Story list */}
        <SectionHeading
          label={selectedSection === 'all' ? 'Authentic stories' : `${sectionsMeta[selectedSection].title} stories`}
          trailing={`${filteredStories.length} ${filteredStories.length === 1 ? 'story' : 'stories'}`}
        />

        {filteredStories.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No stories match"
            description="Try a different search term, or clear your filters to see the full collection."
            actionLabel="Reset filters"
            onAction={resetFilters}
            gradient={emeraldGradient}
          />
        ) : (
          <View style={styles.list}>
            {filteredStories.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                onRead={() => {
                  setActiveStory(story);
                  setSessionMode('read');
                }}
                onListen={() => {
                  setActiveStory(story);
                  setSessionMode('listen');
                }}
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
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 130 },
  pressed: { opacity: 0.7 },

  pills: { marginBottom: 18, overflow: 'visible' },
  pillsContent: { gap: 8, paddingRight: 4 },

  hero: { borderRadius: radius['3xl'], padding: 20, marginBottom: 18 },
  heroArabic: { marginTop: 14 },
  heroTranslation: { marginTop: 10 },
  heroTitle: { marginTop: 14 },
  heroFooter: { marginTop: 16, paddingTop: 12, borderTopWidth: 1 },
  conceptBadge: { flexShrink: 1, marginRight: 8 },

  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: 14,
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
  filterRow: { marginBottom: 18, flexWrap: 'wrap' },

  metrics: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, marginBottom: 22 },
  metricCard: { width: '47.8%' },
  metricValue: { marginTop: 12 },

  sectionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, marginBottom: 22 },
  sectionCard: { width: '47.8%' },
  sectionArabic: { flexShrink: 1, textAlign: 'right' },
  sectionTitle: { marginTop: 12 },
  sectionSubtitle: { marginTop: 3, minHeight: 30 },
  sectionFooter: { marginTop: 10 },

  player: { borderRadius: radius['3xl'], padding: 20, marginBottom: 24 },
  playerText: { flex: 1, paddingRight: 12 },
  playerTitle: { marginTop: 6 },
  playerArabic: { marginTop: 2 },
  playerFigure: { marginTop: 6 },
  playerProgress: { marginTop: 18 },
  playerMeta: { marginTop: 8 },
  playerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  list: { gap: 14 },
});
