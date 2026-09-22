import { LinearGradient } from 'expo-linear-gradient';
import { BookmarkX, Clock, Headphones, LogIn, LogOut, Sparkles, Trash2 } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useAuth } from '../auth/AuthProvider';
import ScreenHeader from '../components/ScreenHeader';
import StoryCard, { sectionIcons } from '../components/StoryCard';
import StorySessionModal, { type StorySessionMode } from '../components/StorySessionModal';
import {
  ArabicInline,
  Badge,
  BodyStrong,
  Caption,
  Card,
  EmptyState,
  GradientButton,
  Heading,
  Overline,
  Pill,
  Row,
  SectionHeading,
  Small,
  useTheme,
} from '../components/ui';
import { sectionsMeta } from '../data/catalogMeta';
import type { SectionSlug, StoryItem } from '../types/catalog';
import { useLibrary } from '../hooks/useLibrary';
import { alpha, brandGradients, radius, sectionAccent, shadow } from '../theme/tokens';
import { apiRequest } from '../services/api';

export default function LibraryScreen() {
  const { colors, isDark } = useTheme();
  const { savedStories, savedCount } = useLibrary();
  const { authenticated, signIn, signOut, getAccessToken } = useAuth();
  const [sectionFilter, setSectionFilter] = useState<SectionSlug | 'all'>('all');
  const [activeStory, setActiveStory] = useState<StoryItem | null>(null);
  const [sessionMode, setSessionMode] = useState<StorySessionMode>(null);

  const visible = useMemo(
    () =>
      sectionFilter === 'all'
        ? savedStories
        : savedStories.filter((story) => story.sectionSlug === sectionFilter),
    [savedStories, sectionFilter],
  );

  /** Total listening time across the library, shown as hours + minutes. */
  const totalMinutes = useMemo(
    () => Math.round(savedStories.reduce((sum, story) => sum + story.durationMs, 0) / 60000),
    [savedStories],
  );

  const perSection = useMemo(() => {
    return (Object.keys(sectionsMeta) as SectionSlug[])
      .map((slug) => ({
        slug,
        count: savedStories.filter((story) => story.sectionSlug === slug).length,
      }))
      .filter((entry) => entry.count > 0);
  }, [savedStories]);

  const deleteAccount = () => {
    Alert.alert(
      'Delete account and synced data?',
      'This permanently removes your account, bookmarks, and listening progress. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: () => {
            void getAccessToken().then(async (token) => {
              if (!token) return;
              await apiRequest<void>('/v1/me', { method: 'DELETE', accessToken: token });
              await signOut();
            });
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.paper }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          eyebrow="Your collection"
          title="Library"
          arabic="مكتبتي"
          subtitle="Stories you saved for later reflection"
        />

        <Card tone="cardAlt" padding={14} style={styles.accountCard}>
          <BodyStrong>
            {authenticated ? 'Your library is syncing across devices.' : 'Sign in to sync bookmarks and progress.'}
          </BodyStrong>
          <Row gap={8} style={styles.accountActions}>
            {authenticated ? (
              <>
                <GradientButton
                  label="Sign out"
                  icon={LogOut}
                  size="sm"
                  gradient={brandGradients.emerald[isDark ? 'dark' : 'light']}
                  onPress={() => void signOut()}
                />
                <GradientButton
                  label="Delete account"
                  icon={Trash2}
                  size="sm"
                  gradient={['#DC2626', '#7F1D1D']}
                  onPress={deleteAccount}
                />
              </>
            ) : (
              <GradientButton
                label="Sign in"
                icon={LogIn}
                size="sm"
                gradient={brandGradients.emerald[isDark ? 'dark' : 'light']}
                onPress={() => void signIn()}
              />
            )}
          </Row>
        </Card>

        {/* Collection summary */}
        <LinearGradient
          colors={brandGradients.night[isDark ? 'dark' : 'light']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.summary, shadow('md', isDark)]}
        >
          <Row justify="space-between" align="flex-start">
            <View style={styles.summaryText}>
              <Overline color="#FDE68A">Saved for later</Overline>
              <Heading color="#FFFFFF" style={styles.summaryHeading}>
                {savedCount} {savedCount === 1 ? 'story' : 'stories'} in your library
              </Heading>
              <Row gap={12} style={styles.summaryStats}>
                <Row gap={5}>
                  <Headphones size={13} color="#5EEAD4" />
                  <Caption color="#CBD5E1">{totalMinutes} min of audio</Caption>
                </Row>
                <Row gap={5}>
                  <Sparkles size={13} color="#FDE68A" />
                  <Caption color="#CBD5E1">{perSection.length} sections</Caption>
                </Row>
              </Row>
            </View>
            <ArabicInline color="#FDE68A">قبسات محفوظة</ArabicInline>
          </Row>

          {perSection.length ? (
            <Row gap={6} style={styles.summaryBadges}>
              {perSection.map(({ slug, count }) => {
                const accent = sectionAccent(slug, true);
                return (
                  <Badge
                    key={slug}
                    label={`${sectionsMeta[slug].title} ${count}`}
                    color={accent.primary}
                    background={alpha(accent.primary, 0.18)}
                    icon={sectionIcons[slug]}
                  />
                );
              })}
            </Row>
          ) : null}
        </LinearGradient>

        {/* Section filter */}
        {savedCount > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filters}
            contentContainerStyle={styles.filtersContent}
          >
            <Pill
              label="Everything"
              selected={sectionFilter === 'all'}
              onPress={() => setSectionFilter('all')}
              gradient={brandGradients.emerald[isDark ? 'dark' : 'light']}
            />
            {perSection.map(({ slug }) => (
              <Pill
                key={slug}
                label={sectionsMeta[slug].title}
                icon={sectionIcons[slug]}
                selected={sectionFilter === slug}
                onPress={() => setSectionFilter(slug)}
                gradient={sectionAccent(slug, isDark).accentGradient}
              />
            ))}
          </ScrollView>
        ) : null}

        {savedCount === 0 ? (
          <EmptyState
            icon={BookmarkX}
            title="Nothing saved yet"
            description="Tap the bookmark icon on any story to keep it here for later listening."
            gradient={brandGradients.emerald[isDark ? 'dark' : 'light']}
          />
        ) : (
          <>
            <SectionHeading
              label={sectionFilter === 'all' ? 'All saved stories' : sectionsMeta[sectionFilter].title}
              trailing={`${visible.length} ${visible.length === 1 ? 'item' : 'items'}`}
            />

            {visible.length === 0 ? (
              <Card style={styles.noneInSection} padding={22}>
                <Small align="center">
                  Nothing saved in this section yet. Try another filter.
                </Small>
              </Card>
            ) : (
              <View style={styles.list}>
                {visible.map((story) => (
                  <StoryCard
                    key={story.id}
                    story={story}
                    variant="compact"
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

            {/* Continue-where-you-left-off hint */}
            <Card style={styles.hint} tone="cardAlt" padding={14} elevation="none">
              <Row gap={9}>
                <Clock size={14} color={colors.gold} />
                <Small color={colors.inkMuted} style={styles.hintText}>
                  Saved stories stay available offline once downloaded, so you can revisit them
                  during travel or quiet evenings.
                </Small>
              </Row>
            </Card>
          </>
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
  summary: { borderRadius: radius['3xl'], padding: 20, marginBottom: 18 },
  accountCard: { marginBottom: 14 },
  accountActions: { marginTop: 10, flexWrap: 'wrap' },
  summaryText: { flex: 1, paddingRight: 10 },
  summaryHeading: { marginTop: 6 },
  summaryStats: { marginTop: 10 },
  summaryBadges: { marginTop: 14, flexWrap: 'wrap' },
  filters: { marginBottom: 18 },
  filtersContent: { gap: 8, paddingRight: 4 },
  list: { gap: 14 },
  noneInSection: { alignItems: 'center' },
  hint: { marginTop: 18 },
  hintText: { flex: 1 },
});
