import { BookmarkX, Highlighter, LogIn, LogOut, Quote, Share2, Trash2 } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
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
import { useCatalog } from '../data/CatalogProvider';
import { sectionsMeta } from '../data/catalogMeta';
import type { SectionSlug, StoryItem } from '../types/catalog';
import { useShareSheet } from '../components/ShareSheet';
import { useHighlights } from '../hooks/useHighlights';
import { useLibrary } from '../hooks/useLibrary';
import { formatHighlightShare } from '../services/share';
import { useMobileLayout } from '../hooks/useMobileLayout';
import { alpha, brandGradients, radius, sectionAccent, shadow } from '../theme/tokens';
import { apiRequest } from '../services/api';
import { APP_BUILD_LABEL } from '../config';

/** Lean library: slim account strip, filters, compact saved list. */
export default function LibraryScreen() {
  const { colors, isDark } = useTheme();
  const { padX, pillEndPad, screenContent } = useMobileLayout();
  const { stories } = useCatalog();
  const { savedStories, savedCount } = useLibrary();
  const { highlights, highlightCount, removeHighlight } = useHighlights();
  const { openShare } = useShareSheet();
  const [shelf, setShelf] = useState<'stories' | 'highlights'>('stories');
  const { authenticated, signIn, signOut, getAccessToken } = useAuth();
  const [sectionFilter, setSectionFilter] = useState<SectionSlug | 'all'>('all');
  const [activeStory, setActiveStory] = useState<StoryItem | null>(null);
  const [sessionMode, setSessionMode] = useState<StorySessionMode>(null);

  const catalogSaved = useMemo(
    () => savedStories.filter((story) => story.sectionSlug in sectionsMeta),
    [savedStories],
  );

  const visible = useMemo(
    () =>
      sectionFilter === 'all'
        ? catalogSaved
        : catalogSaved.filter((story) => story.sectionSlug === sectionFilter),
    [catalogSaved, sectionFilter],
  );

  const perSection = useMemo(() => {
    return (Object.keys(sectionsMeta) as SectionSlug[])
      .map((slug) => ({
        slug,
        count: catalogSaved.filter((story) => story.sectionSlug === slug).length,
      }))
      .filter((entry) => entry.count > 0);
  }, [catalogSaved]);

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
        contentContainerStyle={[styles.content, screenContent]}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader eyebrow="Your collection" title="Library" arabic="مكتبتي" />

        <View style={styles.accountRow}>
          <View style={styles.accountCopy}>
            <BodyStrong numberOfLines={1}>
              {authenticated ? 'Synced across devices' : 'Sign in to sync'}
            </BodyStrong>
            <Caption color={colors.inkMuted}>
              {savedCount} {savedCount === 1 ? 'story' : 'stories'} · {highlightCount}{' '}
              {highlightCount === 1 ? 'highlight' : 'highlights'}
            </Caption>
          </View>
          <Row gap={8} style={styles.accountActions} align="stretch">
            {authenticated ? (
              <>
                <View style={styles.accountAction}>
                  <GradientButton
                    label="Sign out"
                    icon={LogOut}
                    size="sm"
                    gradient={brandGradients.emerald[isDark ? 'dark' : 'light']}
                    onPress={() => void signOut()}
                  />
                </View>
                <View style={styles.accountAction}>
                  <GradientButton
                    label="Delete"
                    icon={Trash2}
                    size="sm"
                    gradient={['#DC2626', '#7F1D1D']}
                    onPress={deleteAccount}
                  />
                </View>
              </>
            ) : (
              <View style={styles.accountAction}>
                <GradientButton
                  label="Sign in"
                  icon={LogIn}
                  size="sm"
                  gradient={brandGradients.emerald[isDark ? 'dark' : 'light']}
                  onPress={() => void signIn()}
                />
              </View>
            )}
          </Row>
        </View>

        <Row gap={8} style={styles.shelfRow}>
          <View style={styles.shelfChip}>
            <Pill
              label={`Stories · ${savedCount}`}
              selected={shelf === 'stories'}
              onPress={() => setShelf('stories')}
              gradient={brandGradients.emerald[isDark ? 'dark' : 'light']}
            />
          </View>
          <View style={styles.shelfChip}>
            <Pill
              label={`Highlights · ${highlightCount}`}
              selected={shelf === 'highlights'}
              onPress={() => setShelf('highlights')}
              icon={Highlighter}
              gradient={brandGradients.gold[isDark ? 'dark' : 'light']}
            />
          </View>
        </Row>

        {shelf === 'stories' ? (
          <>
            {savedCount > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={[styles.filters, { marginHorizontal: -padX }]}
                contentContainerStyle={[
                  styles.filtersContent,
                  { paddingLeft: padX, paddingRight: padX + pillEndPad },
                ]}
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
                description="Tap the bookmark on a story card, or Save story in the reader, to keep the whole story here. Highlights are for passages only."
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
          </>
        ) : highlightCount === 0 ? (
          <EmptyState
            icon={Quote}
            title="No highlights yet"
            description="Select or long-press a passage in a story, or save the hadith of the day from Home."
            gradient={brandGradients.gold[isDark ? 'dark' : 'light']}
          />
        ) : (
          <>
            <SectionHeading label="Highlights" trailing={`${highlightCount}`} />
            <View style={styles.list}>
              {highlights.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.highlightCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                    shadow('sm', isDark),
                  ]}
                >
                  <View
                    style={[
                      styles.highlightBar,
                      { backgroundColor: item.kind === 'hadith' ? colors.emerald : colors.gold },
                    ]}
                  />
                  <Caption color={colors.gold}>{item.kind === 'hadith' ? 'Hadith' : item.kind === 'name' ? 'Name' : 'Story'}</Caption>
                  <BodyStrong style={styles.highlightQuote}>{item.text}</BodyStrong>
                  <Small color={colors.inkMuted}>{item.sourceLabel}</Small>
                  <Row gap={8} style={styles.highlightActions} align="center">
                    <Pressable
                      onPress={() => openShare(formatHighlightShare(item))}
                      accessibilityRole="button"
                      accessibilityLabel="Share this highlight"
                      style={({ pressed }) => [
                        styles.highlightBtn,
                        {
                          borderColor: colors.border,
                          backgroundColor: isDark ? colors.cardAlt : alpha(colors.gold, 0.08),
                        },
                        pressed && styles.pressed,
                      ]}
                    >
                      <Share2 size={14} color={colors.ink} />
                      <Caption color={colors.ink}>Share</Caption>
                    </Pressable>
                    {item.storyId ? (
                      <Pressable
                        onPress={() => {
                          const story = stories.find((entry) => entry.id === item.storyId) ?? null;
                          if (story) {
                            setActiveStory(story);
                            setSessionMode('read');
                          }
                        }}
                        accessibilityRole="button"
                        accessibilityLabel="Open the source story"
                        style={({ pressed }) => [
                          styles.highlightBtn,
                          { borderColor: colors.border, backgroundColor: colors.cardAlt },
                          pressed && styles.pressed,
                        ]}
                      >
                        <Caption color={colors.inkMuted}>Open</Caption>
                      </Pressable>
                    ) : null}
                    <Pressable
                      onPress={() => removeHighlight(item.id)}
                      accessibilityRole="button"
                      accessibilityLabel="Remove this highlight"
                      style={({ pressed }) => [
                        styles.highlightBtn,
                        { borderColor: colors.border },
                        pressed && styles.pressed,
                      ]}
                    >
                      <Trash2 size={14} color={colors.coral} />
                      <Caption color={colors.coral}>Remove</Caption>
                    </Pressable>
                  </Row>
                </View>
              ))}
            </View>
          </>
        )}

        <Caption color={colors.inkSubtle} style={styles.buildLabel}>
          Stories of Islam {APP_BUILD_LABEL}
        </Caption>
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
  content: {},
  accountRow: { marginBottom: 16, gap: 12 },
  accountCopy: { gap: 2 },
  accountActions: { flexWrap: 'wrap' },
  accountAction: { flexGrow: 0, minWidth: 132 },
  filters: { marginBottom: 14 },
  filtersContent: { gap: 8, alignItems: 'center' },
  shelfRow: { marginBottom: 14, flexWrap: 'wrap' },
  shelfChip: { flexGrow: 0 },
  list: { gap: 10 },
  highlightCard: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: 14,
    paddingLeft: 18,
    gap: 6,
    overflow: 'hidden',
  },
  highlightBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  highlightQuote: { fontSize: 15, lineHeight: 22 },
  highlightActions: { marginTop: 8, flexWrap: 'wrap' },
  highlightBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  pressed: { opacity: 0.88 },
  buildLabel: { marginTop: 24, textAlign: 'center' },
});
