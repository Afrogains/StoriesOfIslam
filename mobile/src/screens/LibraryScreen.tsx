import { BookmarkX, LogIn, LogOut, Trash2 } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useAuth } from '../auth/AuthProvider';
import ScreenHeader from '../components/ScreenHeader';
import StoryCard, { sectionIcons } from '../components/StoryCard';
import StorySessionModal, { type StorySessionMode } from '../components/StorySessionModal';
import {
  BodyStrong,
  Caption,
  EmptyState,
  GradientButton,
  Pill,
  Row,
  SectionHeading,
  Small,
  useTheme,
} from '../components/ui';
import { sectionsMeta } from '../data/catalogMeta';
import type { SectionSlug, StoryItem } from '../types/catalog';
import { useLibrary } from '../hooks/useLibrary';
import { brandGradients, sectionAccent } from '../theme/tokens';
import { apiRequest } from '../services/api';

/** Lean library: slim account strip, filters, compact saved list. */
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
        <ScreenHeader eyebrow="Your collection" title="Library" arabic="مكتبتي" />

        <Row justify="space-between" align="center" style={styles.accountRow}>
          <View style={styles.accountCopy}>
            <BodyStrong numberOfLines={1}>
              {authenticated ? 'Synced across devices' : 'Sign in to sync'}
            </BodyStrong>
            <Caption color={colors.inkMuted}>
              {savedCount} saved {savedCount === 1 ? 'story' : 'stories'}
            </Caption>
          </View>
          <Row gap={8}>
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
                  label="Delete"
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
        </Row>

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
            description="Tap the bookmark on any story to keep it here."
            gradient={brandGradients.emerald[isDark ? 'dark' : 'light']}
          />
        ) : (
          <>
            <SectionHeading
              label={sectionFilter === 'all' ? 'Saved' : sectionsMeta[sectionFilter].title}
              trailing={`${visible.length}`}
            />

            {visible.length === 0 ? (
              <Small align="center" color={colors.inkMuted}>
                Nothing in this section yet.
              </Small>
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
  content: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 120 },
  accountRow: { marginBottom: 14, gap: 10 },
  accountCopy: { flex: 1, gap: 2 },
  filters: { marginBottom: 14 },
  filtersContent: { gap: 8, paddingRight: 4 },
  list: { gap: 10 },
});
