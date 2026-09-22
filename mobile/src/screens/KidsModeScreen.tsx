import { LinearGradient } from 'expo-linear-gradient';
import {
  Award,
  Heart,
  Pause,
  Play,
  Shield,
  Sparkles,
  Star,
  Sun,
  type LucideIcon,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import ScreenHeader from '../components/ScreenHeader';
import SynchronizedAudioReader from '../components/SynchronizedAudioReader';
import {
  ArabicTitle,
  Badge,
  Body,
  Caption,
  Display,
  Heading,
  Overline,
  Pill,
  PlayButton,
  ProgressBar,
  Row,
  SectionHeading,
  Small,
  Title,
  useTheme,
} from '../components/ui';
import { useCatalog } from '../data/CatalogProvider';
import { sectionsMeta } from '../data/catalogMeta';
import { kidsStoryToReaderStory } from '../data/storyAdapters';
import { alpha, brandGradients, kidsGradients, radius, shadow } from '../theme/tokens';
import type { KidsStoryCard, SectionSlug } from '../types/catalog';

const useKidsPreviewFixtures =
  __DEV__ ||
  process.env.EXPO_PUBLIC_ENVIRONMENT === 'preview' ||
  process.env.EXPO_PUBLIC_ENVIRONMENT === 'development';
/** Dedicated short kids summaries — never reuse adult full prophet accounts here. */
const previewKidsStories: KidsStoryCard[] = useKidsPreviewFixtures
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- Metro tree-shakes this fixture branch in production exports.
  ? (require('../data/mockHome').kidsStories as KidsStoryCard[])
  : [];

type Tint = KidsStoryCard['tint'];

const tints: Record<Tint, { primary: string; soft: string; gradient: readonly [string, string] }> = {
  sunset: { primary: '#EA580C', soft: '#FFF3E8', gradient: ['#F97316', '#FB7185'] },
  teal: { primary: '#0D9488', soft: '#F0FDF4', gradient: ['#0D9488', '#10B981'] },
  sky: { primary: '#0284C7', soft: '#F0F9FF', gradient: ['#38BDF8', '#0284C7'] },
  coral: { primary: '#E11D48', soft: '#FFF1F2', gradient: ['#FB7185', '#E11D48'] },
  yellow: { primary: '#D97706', soft: '#FEFCE8', gradient: ['#FBBF24', '#F59E0B'] },
};

const sectionBadges: Record<SectionSlug, { icon: LucideIcon; color: string }> = {
  'qisas-al-anbiya': { icon: Star, color: '#EA580C' },
  'seerah-shamail': { icon: Heart, color: '#D97706' },
  sahabah: { icon: Shield, color: '#0284C7' },
  gleanings: { icon: Sparkles, color: '#0D9488' },
};

/** Stars needed for the next reward tier — drives the progress meter. */
const NEXT_BADGE_AT = 30;

export default function KidsModeScreen() {
  const { colors, isDark } = useTheme();
  const { stories } = useCatalog();

  const [selectedSection, setSelectedSection] = useState<SectionSlug | 'all'>('all');
  const [readerStory, setReaderStory] = useState<KidsStoryCard | null>(null);
  const stars = 0;
  const completed: Record<string, boolean> = {};

  const availableStories = useMemo((): KidsStoryCard[] => {
    // Always prefer kids-specific short summaries when fixtures are available.
    // Mapping adult catalog stories here previously showed full prophet accounts in Kids.
    if (previewKidsStories.length) {
      return previewKidsStories;
    }
    return stories.map((story) => {
      const shortSummary = story.summary.split(/(?<=[.!?])\s+/)[0] ?? story.summary;
      return {
        id: story.id,
        sectionSlug: story.sectionSlug,
        title: story.title,
        titleAr: story.titleAr,
        figureName: story.figureName,
        summary: shortSummary,
        durationLabel: story.durationLabel,
        durationMs: Math.min(story.durationMs, 120_000),
        audioUrl: story.audioUrl,
        artworkUrl: story.artworkUrl,
        // Kids read the short summary only — do not pass adult full-story cues.
        timedCues: [
          {
            startMs: 0,
            endMs: 60_000,
            textEn: shortSummary,
            textAr: story.titleAr,
          },
        ],
        lesson: shortSummary,
        badgeLabel: '✨ Read & reflect',
        tint:
          story.sectionSlug === 'qisas-al-anbiya'
            ? 'sunset'
            : story.sectionSlug === 'seerah-shamail'
              ? 'yellow'
              : story.sectionSlug === 'sahabah'
                ? 'sky'
                : 'teal',
        rewardStarCount: 3,
      };
    });
  }, [stories]);
  const visibleStories = useMemo(
    () =>
      selectedSection === 'all'
        ? availableStories
        : availableStories.filter((story) => story.sectionSlug === selectedSection),
    [availableStories, selectedSection],
  );

  const lessonStory =
    availableStories.find((story) => story.id === 'the-first-revelation') ??
    availableStories[0];

  const finishedCount = Object.keys(completed).length;

  return (
    <View style={[styles.screen, { backgroundColor: colors.paper }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          eyebrow="Assalamu alaikum, friend"
          title="Kids Mode"
          arabic="قصص الأطفال"
          arabicColor={colors.sunset}
          subtitle="Gentle stories full of light and wisdom"
        />

        {/* Reward meter */}
        <LinearGradient
          colors={isDark ? ['#2A1506', '#431D0A'] : ['#FFF7ED', '#FFE8CC']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.reward, { borderColor: colors.border }, shadow('sm', isDark)]}
        >
          <Row justify="space-between">
            <Row gap={11}>
              <LinearGradient colors={['#FBBF24', '#F59E0B']} style={styles.starBubble}>
                <Star size={19} color="#78350F" fill="#78350F" />
              </LinearGradient>
              <View>
                <Heading>Your star jar</Heading>
                <Caption color={colors.inkMuted}>
                  {finishedCount} {finishedCount === 1 ? 'story' : 'stories'} finished
                </Caption>
              </View>
            </Row>

            <View style={[styles.starCount, { backgroundColor: alpha('#F59E0B', 0.9) }]}>
              <Title color="#451A03" style={styles.starNumber}>
                {stars}
              </Title>
              <Overline color="#78350F">stars</Overline>
            </View>
          </Row>

          <View style={styles.rewardProgress}>
            <ProgressBar
              value={Math.min(1, stars / NEXT_BADGE_AT)}
              gradient={['#FBBF24', '#EA580C']}
              trackColor={isDark ? '#431D0A' : '#FFE0B8'}
              height={9}
            />
            <Caption color={colors.inkMuted} style={styles.rewardHint}>
              {Math.max(0, NEXT_BADGE_AT - stars)} more stars until your next badge
            </Caption>
          </View>
        </LinearGradient>

        {/* Section filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.pills}
          contentContainerStyle={styles.pillsContent}
        >
          <Pill
            label="All fun stories"
            selected={selectedSection === 'all'}
            onPress={() => setSelectedSection('all')}
            gradient={brandGradients.kidsSunset}
            bold
          />
          {(Object.keys(sectionsMeta) as SectionSlug[]).map((slug) => (
            <Pill
              key={slug}
              label={sectionsMeta[slug].kidsTitle}
              icon={sectionBadges[slug].icon}
              selected={selectedSection === slug}
              onPress={() => setSelectedSection(slug)}
              gradient={kidsGradients[slug]}
              bold
            />
          ))}
        </ScrollView>

        {/* Lesson of the day */}
        {selectedSection === 'all' ? (
          <LinearGradient
            colors={brandGradients.kidsGold[isDark ? 'dark' : 'light']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.lesson,
              { borderColor: isDark ? '#431D0A' : '#FACC15' },
              shadow('md', isDark),
            ]}
          >
            <Row justify="space-between">
              <Row gap={8}>
                <Sun size={20} color={isDark ? '#FBBF24' : '#B45309'} />
                <Overline color={isDark ? '#FDBA74' : '#78350F'}>Lesson of the day</Overline>
              </Row>
              <Award size={18} color={isDark ? '#FBBF24' : '#B45309'} />
            </Row>

            <Display
              color={isDark ? '#FFEDD5' : '#3B1808'}
              style={styles.lessonText}
            >
              “{lessonStory?.lesson ?? 'Reviewed family-friendly lessons will appear here.'}”
            </Display>

            <Row justify="space-between" style={[styles.lessonFooter, { borderTopColor: isDark ? '#431D0A' : '#EAB308' }]}>
              <Caption color={isDark ? '#FDBA74' : '#78350F'} style={styles.lessonSource}>
                {lessonStory ? `From ${lessonStory.title}` : 'Awaiting reviewed content'}
              </Caption>
              <PlayButton
                playing={false}
                onPress={() => lessonStory && setReaderStory(lessonStory)}
                gradient={['#EA580C', '#C2410C']}
                size={40}
                icons={{ play: Play, pause: Pause }}
                accessibilityLabel="Play the lesson of the day"
              />
            </Row>
          </LinearGradient>
        ) : null}

        <SectionHeading
          label={selectedSection === 'all' ? 'Stories picked for you' : sectionsMeta[selectedSection].kidsTitle}
          trailing={`${visibleStories.length} ${visibleStories.length === 1 ? 'story' : 'stories'}`}
          trailingColor={colors.sunset}
        />

        <View style={styles.list}>
          {visibleStories.map((story) => {
            const active = false;
            const tint = tints[story.tint];
            const done = !!completed[story.id];
            const badge = sectionBadges[story.sectionSlug];

            return (
              <Pressable
                key={story.id}
                accessibilityRole="button"
                accessibilityLabel={`${story.title}. ${story.summary}`}
                onPress={() => setReaderStory(story)}
                style={({ pressed }) => [
                  styles.storyCard,
                  {
                    backgroundColor: active ? (isDark ? colors.cardAlt : tint.soft) : colors.card,
                    borderColor: active ? tint.primary : colors.border,
                  },
                  shadow(active ? 'md' : 'sm', isDark),
                  pressed && styles.pressed,
                ]}
              >
                <Row justify="space-between" align="flex-start">
                  <Row gap={7} style={styles.storyBadges}>
                    <Badge label={story.badgeLabel} color={tint.primary} icon={badge.icon} />
                    {done ? <Badge label="done +3" color="#15803D" icon={Star} /> : null}
                  </Row>

                  <PlayButton
                    playing={false}
                    onPress={() => setReaderStory(story)}
                    gradient={tint.gradient}
                    size={50}
                    icons={{ play: Play, pause: Pause }}
                    accessibilityLabel={`${active ? 'Pause' : 'Play'} ${story.title}`}
                  />
                </Row>

                <Display style={styles.storyTitle}>{story.title}</Display>
                <ArabicTitle color={tint.primary}>{story.titleAr}</ArabicTitle>

                <Caption color={colors.inkMuted} style={styles.storyMeta}>
                  {story.figureName} · {story.durationLabel} listen
                </Caption>

                <Body color={colors.ink} style={styles.storySummary}>
                  {story.summary}
                </Body>

                <View
                  style={[
                    styles.moral,
                    {
                      backgroundColor: isDark ? colors.cardAlt : tint.soft,
                      borderColor: isDark ? colors.border : alpha(tint.primary, 0.25),
                    },
                  ]}
                >
                  <Overline color={tint.primary}>What we learn</Overline>
                  <Small color={colors.ink} style={styles.moralText}>
                    {story.lesson}
                  </Small>
                </View>

                <Row justify="space-between" style={styles.storyFooter}>
                  <Caption color={colors.inkMuted}>Tap the card to read along</Caption>
                  <Caption color={tint.primary}>Read &amp; listen →</Caption>
                </Row>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <Modal
        visible={readerStory !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setReaderStory(null)}
      >
        {readerStory ? (
          <SynchronizedAudioReader
            story={kidsStoryToReaderStory(readerStory)}
            sectionSlug={readerStory.sectionSlug}
            initiallyExpanded
            onClose={() => setReaderStory(null)}
          />
        ) : null}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 160 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.995 }] },

  reward: { borderRadius: radius['3xl'], borderWidth: 2, padding: 18, marginBottom: 18 },
  starBubble: { width: 42, height: 42, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  starCount: { alignItems: 'center', paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.lg },
  starNumber: { lineHeight: 24 },
  rewardProgress: { marginTop: 16 },
  rewardHint: { marginTop: 7 },

  pills: { marginBottom: 18, overflow: 'visible' },
  pillsContent: { gap: 8, paddingRight: 4 },

  lesson: { borderRadius: radius['3xl'], borderWidth: 3, padding: 20, marginBottom: 22 },
  lessonText: { marginTop: 14, lineHeight: 34 },
  lessonFooter: { marginTop: 18, paddingTop: 14, borderTopWidth: 2 },
  lessonSource: { flex: 1, paddingRight: 12 },

  list: { gap: 16 },
  storyCard: { borderRadius: 30, borderWidth: 2, padding: 18 },
  storyBadges: { flex: 1, flexWrap: 'wrap', paddingRight: 10 },
  storyTitle: { marginTop: 16 },
  storyMeta: { marginTop: 4 },
  storySummary: { marginTop: 10 },
  moral: { marginTop: 14, borderRadius: radius.xl, borderWidth: 2, paddingHorizontal: 14, paddingVertical: 12 },
  moralText: { marginTop: 4, fontWeight: '700' },
  storyFooter: { marginTop: 14 },
});
