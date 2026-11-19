import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Highlighter,
  Share2,
  X,
} from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  type GestureResponderEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import ChapterQuiz from '../components/ChapterQuiz';
import HighlightableText from '../components/HighlightableText';
import { useShareSheet } from '../components/ShareSheet';
import {
  ArabicTitle,
  Badge,
  Body,
  Caption,
  Display,
  Heading,
  OutlineButton,
  Overline,
  ProgressBar,
  Row,
  Small,
  Title,
  useTheme,
} from '../components/ui';
import { getStoryChapters } from '../data/chapters';
import { LISTEN_CTA_A11Y, LISTEN_CTA_LABEL } from '../data/listenIncoming';
import {
  EMPTY_READING_BOOKMARK,
  bookmarkFromScroll,
  chapterBookmark,
  formatReadingPercent,
  type ReadingBlock,
  type ReadingBookmark,
} from '../hooks/readingBookmark';
import { useLibrary } from '../hooks/useLibrary';
import { useMobileLayout } from '../hooks/useMobileLayout';
import { useReadingBookmark } from '../hooks/useReadingBookmark';
import { formatStoryShare } from '../services/share';
import { alpha, radius, sectionAccent, shadow } from '../theme/tokens';
import type { StoryItem } from '../types/catalog';

type ReaderScreenProps = {
  story: StoryItem;
  onClose: () => void;
  onSwitchToListening: () => void;
};

export default function ReaderScreen({ story, onClose, onSwitchToListening }: ReaderScreenProps) {
  const { colors, isDark } = useTheme();
  const { topInset, bottomInset } = useMobileLayout();
  const accent = sectionAccent(story.sectionSlug, isDark);
  const { isSaved, toggleSaved } = useLibrary();
  const { openShare } = useShareSheet();
  const { load, save } = useReadingBookmark(story.id);
  const scrollRef = useRef<ScrollView>(null);
  const sectionYRef = useRef<number[]>([]);
  const blockMapRef = useRef(new Map<string, ReadingBlock & { localY: number }>());
  const blocksRef = useRef<ReadingBlock[]>([]);
  const [restoredY, setRestoredY] = useState(0);
  const [resume, setResume] = useState<ReadingBookmark>(EMPTY_READING_BOOKMARK);
  const [livePercent, setLivePercent] = useState(0);
  const [highlightMode, setHighlightMode] = useState(false);
  const [swipeHint, setSwipeHint] = useState(false);
  const saved = isSaved(story.id);
  const chapters = useMemo(() => getStoryChapters(story), [story]);
  const [chapterIndex, setChapterIndex] = useState(0);
  const chapter = chapters[Math.min(chapterIndex, chapters.length - 1)];
  const chapterTopRef = useRef(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const chapterCompleteRef = useRef(false);

  useEffect(() => {
    void load().then((bookmark) => {
      setResume(bookmark);
      if (bookmark.chapter !== undefined) {
        const chapter = Math.min(bookmark.chapter, chapters.length - 1);
        setChapterIndex(chapter);
        const within =
          chapters.length > 1
            ? Math.min(1, Math.max(0, bookmark.percent * chapters.length - chapter))
            : bookmark.percent;
        chapterCompleteRef.current = within >= 0.995;
        setLivePercent(within);
        setRestoredY(bookmark.y);
        return;
      }
      const legacy = bookmark.line
        ? chapters.findIndex((item) =>
            item.blocks.some((block) => block.paragraphs.some((paragraph) => paragraph.includes(bookmark.line))),
          )
        : -1;
      setLivePercent(bookmark.percent);
      if (legacy > 0) setChapterIndex(legacy);
      else setRestoredY(bookmark.y);
    });
  }, [load, chapters]);

  useEffect(() => {
    if (restoredY <= 0) return;
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: restoredY, animated: false });
    }, 80);
    return () => clearTimeout(timer);
  }, [restoredY]);

  useEffect(() => {
    if (chapters.length < 2) return;
    setSwipeHint(true);
    const timer = setTimeout(() => setSwipeHint(false), 3200);
    return () => clearTimeout(timer);
  }, [story.id, chapters.length]);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const measured = bookmarkFromScroll(
      contentOffset.y,
      contentSize.height,
      layoutMeasurement.height,
      layoutMeasurement.width,
      blocksRef.current,
    );
    const withinPercent = chapterCompleteRef.current ? 1 : measured.percent;
    const within = { ...measured, percent: withinPercent };
    const next = chapterBookmark(within, chapterIndex, chapters.length);
    setLivePercent((current) => (Math.abs(current - withinPercent) >= 0.01 ? withinPercent : current));
    setResume(next);
    void save(next);
  };

  const goToChapter = (index: number) => {
    const target = Math.max(0, Math.min(chapters.length - 1, index));
    if (target === chapterIndex) return;
    blockMapRef.current.clear();
    blocksRef.current = [];
    sectionYRef.current = [];
    setChapterIndex(target);
    setRestoredY(0);
    setSwipeHint(false);
    chapterCompleteRef.current = false;
    const bookmark = chapterBookmark(
      { ...EMPTY_READING_BOOKMARK, heading: chapters[target]?.title ?? null },
      target,
      chapters.length,
    );
    setResume(bookmark);
    setLivePercent(0);
    void save(bookmark);
    requestAnimationFrame(() =>
      scrollRef.current?.scrollTo({ y: Math.max(0, chapterTopRef.current - 8), animated: false }),
    );
  };

  /** Starting a chapter quiz means the chapter itself has been read through. */
  const markChapterComplete = () => {
    chapterCompleteRef.current = true;
    const bookmark = chapterBookmark(
      {
        ...EMPTY_READING_BOOKMARK,
        heading: chapter.title,
        line: resume.line || chapter.title,
        percent: 1,
        y: restoredY,
        contentHeight: resume.contentHeight,
        viewportHeight: resume.viewportHeight,
      },
      chapterIndex,
      chapters.length,
    );
    setResume(bookmark);
    setLivePercent(1);
    void save(bookmark);
  };
  const beginSwipe = (x: number, y: number) => {
    touchStartRef.current = { x, y };
  };

  const finishSwipe = (x: number, y: number) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start || chapters.length < 2) return;
    const dx = x - start.x;
    const dy = y - start.y;
    if (Math.abs(dx) < 56 || Math.abs(dx) <= Math.abs(dy) * 1.5) return;
    if (dx < 0 && chapterIndex < chapters.length - 1) goToChapter(chapterIndex + 1);
    else if (dx > 0 && chapterIndex > 0) goToChapter(chapterIndex - 1);
  };

  const onTouchStart = (event: GestureResponderEvent) => {
    const touch = event.nativeEvent.touches[0];
    if (touch) beginSwipe(touch.pageX, touch.pageY);
  };

  const onTouchEnd = (event: GestureResponderEvent) => {
    const touch = event.nativeEvent.changedTouches[0];
    if (touch) finishSwipe(touch.pageX, touch.pageY);
  };

  const webSwipeProps =
    Platform.OS === 'web'
      ? ({
          onMouseDown: (event: { clientX: number; clientY: number }) => beginSwipe(event.clientX, event.clientY),
          onMouseUp: (event: { clientX: number; clientY: number }) => finishSwipe(event.clientX, event.clientY),
        } as Record<string, unknown>)
      : {};

  const publishBlocks = () => {
    blocksRef.current = [...blockMapRef.current.values()];
  };

  const onSectionLayout = (sectionIndex: number, y: number) => {
    sectionYRef.current[sectionIndex] = y;
    for (const [key, block] of [...blockMapRef.current.entries()]) {
      if (!key.startsWith(`${sectionIndex}:`)) continue;
      blockMapRef.current.set(key, { ...block, y: y + block.localY });
    }
    publishBlocks();
  };

  const onParagraphLayout = (
    sectionIndex: number,
    paragraphIndex: number,
    localY: number,
    height: number,
    heading: string | undefined,
    text: string,
  ) => {
    const sectionY = sectionYRef.current[sectionIndex] ?? 0;
    blockMapRef.current.set(`${sectionIndex}:${paragraphIndex}`, {
      y: sectionY + localY,
      height,
      heading: heading ?? null,
      text,
      localY,
    });
    publishBlocks();
  };

  const storyProgress = chapters.length > 1 ? (chapterIndex + livePercent) / chapters.length : livePercent;

  return (
    <View
      style={[styles.screen, { backgroundColor: colors.paper }]}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      {...webSwipeProps}
    >
      <View
        style={[
          styles.header,
          {
            backgroundColor: isDark ? colors.card : '#FCFBF7',
            borderBottomColor: colors.border,
            paddingTop: topInset + 10,
          },
        ]}
      >
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close reading mode"
          style={[styles.iconBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
        >
          <X size={18} color={colors.ink} />
        </Pressable>

        <View style={styles.headerMeta}>
          <Overline color={accent.primary}>
            {chapters.length > 1 ? `Chapter ${chapterIndex + 1} of ${chapters.length}` : 'Reading mode'}
            {storyProgress > 0 ? ` · ${formatReadingPercent(storyProgress)}` : ''}
          </Overline>
          <Caption color={colors.inkMuted} numberOfLines={1}>
            {chapters.length > 1 ? chapter.title : (resume.heading ?? story.figureName)}
          </Caption>
        </View>

        {chapters.length > 1 ? (
          <Row gap={6}>
            <Pressable
              onPress={() => goToChapter(chapterIndex - 1)}
              disabled={chapterIndex === 0}
              accessibilityRole="button"
              accessibilityLabel="Previous chapter"
              style={[
                styles.iconBtn,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                  opacity: chapterIndex === 0 ? 0.35 : 1,
                },
              ]}
            >
              <ChevronLeft size={18} color={colors.ink} />
            </Pressable>
            <Pressable
              onPress={() => goToChapter(chapterIndex + 1)}
              disabled={chapterIndex >= chapters.length - 1}
              accessibilityRole="button"
              accessibilityLabel="Next chapter"
              style={[
                styles.iconBtn,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                  opacity: chapterIndex >= chapters.length - 1 ? 0.35 : 1,
                },
              ]}
            >
              <ChevronRight size={18} color={colors.ink} />
            </Pressable>
          </Row>
        ) : null}

        <Pressable
          onPress={() => openShare(formatStoryShare(story))}
          accessibilityRole="button"
          accessibilityLabel={`Share ${story.title}`}
          style={[styles.iconBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
        >
          <Share2 size={17} color={colors.ink} />
        </Pressable>

        <Pressable
          onPress={() => setHighlightMode((on) => !on)}
          accessibilityRole="button"
          accessibilityState={{ selected: highlightMode }}
          accessibilityLabel={highlightMode ? 'Turn off highlight mode' : 'Highlight a passage'}
          style={[
            styles.iconBtn,
            {
              borderColor: highlightMode ? colors.gold : colors.border,
              backgroundColor: highlightMode ? alpha(colors.gold, 0.16) : colors.card,
            },
          ]}
        >
          <Highlighter size={17} color={highlightMode ? colors.gold : colors.ink} />
        </Pressable>

        <Pressable
          onPress={() => toggleSaved(story.id, story)}
          accessibilityRole="button"
          accessibilityState={{ selected: saved }}
          accessibilityLabel={saved ? 'Remove story from library' : 'Save whole story to library'}
          style={[
            styles.iconBtn,
            {
              borderColor: saved ? colors.gold : colors.border,
              backgroundColor: saved ? alpha(colors.gold, 0.14) : colors.card,
            },
          ]}
        >
          <Bookmark size={18} color={saved ? colors.gold : colors.ink} fill={saved ? colors.gold : 'transparent'} />
        </Pressable>
      </View>

      {chapters.length > 1 ? (
        <View style={[styles.progressStrip, { backgroundColor: isDark ? colors.card : '#FCFBF7', borderBottomColor: colors.border }]}>
          <ProgressBar value={storyProgress} color={accent.primary} height={3} />
        </View>
      ) : null}

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomInset + 32 }]}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={200}
      >
        <Display style={styles.title}>{story.title}</Display>
        <ArabicTitle color={accent.primary}>{story.titleAr}</ArabicTitle>
        <Caption color={colors.inkMuted} style={styles.figure}>
          {story.figureName} · {story.honorific}
        </Caption>
        <Row gap={8} style={styles.badges}>
          <Badge label={story.authenticityGrade} color={accent.badgeText} background={accent.badgeBg} />
          <Caption color={colors.inkSubtle}>{story.durationLabel} read</Caption>
        </Row>
        <Row gap={8} style={styles.readerActions} align="center">
          <OutlineButton
            label={saved ? 'Saved to Library' : 'Save story'}
            icon={Bookmark}
            size="sm"
            onPress={() => toggleSaved(story.id, story)}
            accessibilityLabel={saved ? 'Remove story from library' : 'Save whole story to library'}
            style={styles.saveStoryBtn}
          />
          <Pressable
            onPress={onSwitchToListening}
            accessibilityRole="button"
            accessibilityLabel={LISTEN_CTA_A11Y}
            style={({ pressed }) => [
              styles.listenChip,
              {
                borderColor: colors.border,
                backgroundColor: isDark ? colors.cardAlt : colors.subtleBg,
                opacity: pressed ? 0.86 : 1,
              },
            ]}
          >
            <Headphones size={14} color={colors.inkMuted} strokeWidth={2.25} />
            <Caption color={colors.ink} style={styles.listenChipLabel}>
              Listen · {LISTEN_CTA_LABEL}
            </Caption>
          </Pressable>
        </Row>
        {highlightMode ? (
          <Caption color={colors.gold} style={styles.highlightHint}>
            Tap a paragraph to save that passage under Library → Highlights. Use Save story for the whole story.
          </Caption>
        ) : (
          <Caption color={colors.inkSubtle} style={styles.highlightHint}>
            Save story keeps the whole piece in Library. Select or long-press a passage to keep a highlight.
          </Caption>
        )}

        <View onLayout={(event) => (chapterTopRef.current = event.nativeEvent.layout.y)}>
          {chapters.length > 1 ? (
            <>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chapterChips}
                style={styles.chapterChipsWrap}
              >
                {chapters.map((item) => {
                  const selected = item.index === chapterIndex;
                  return (
                    <Pressable
                      key={item.index}
                      onPress={() => goToChapter(item.index)}
                      accessibilityRole="tab"
                      accessibilityState={{ selected }}
                      accessibilityLabel={`Chapter ${item.index + 1}: ${item.title}`}
                      style={[
                        styles.chapterChip,
                        {
                          borderColor: selected ? accent.primary : colors.border,
                          backgroundColor: selected
                            ? alpha(accent.primary, isDark ? 0.22 : 0.1)
                            : isDark
                              ? colors.card
                              : colors.cardAlt,
                        },
                      ]}
                    >
                      <Caption color={selected ? accent.primary : colors.inkMuted} style={styles.chapterChipNum}>
                        {item.index + 1}
                      </Caption>
                      <Caption
                        color={selected ? accent.primary : colors.inkMuted}
                        numberOfLines={1}
                        style={styles.chapterChipLabel}
                      >
                        {item.title}
                      </Caption>
                    </Pressable>
                  );
                })}
              </ScrollView>
              {swipeHint ? (
                <Small color={colors.inkSubtle} style={styles.swipeHint}>
                  Swipe left for the next chapter · or tap a chapter above
                </Small>
              ) : null}
            </>
          ) : null}
          <View style={[styles.chapterHeader, { borderBottomColor: colors.border }]}>
            <Overline color={accent.primary}>
              {chapters.length > 1 ? `Chapter ${chapterIndex + 1} of ${chapters.length}` : 'Full story'}
            </Overline>
            <Heading style={styles.chapterTitle}>{chapter.title}</Heading>
            <Caption color={colors.inkSubtle}>
              About {Math.max(1, Math.round(chapter.words / 200))} min read
            </Caption>
          </View>
        </View>

        {chapter.blocks.map((block, index) => (
          <View
            key={`${chapterIndex}-${block.heading ?? 'p'}-${index}`}
            style={styles.section}
            onLayout={(event) => onSectionLayout(index, event.nativeEvent.layout.y)}
          >
            {block.heading && block.heading !== chapter.title ? (
              <Heading style={styles.sectionHeading}>{block.heading}</Heading>
            ) : null}
            {block.paragraphs.map((paragraph, pIndex) => {
              const lastRead = Boolean(resume.line) && paragraph.includes(resume.line);
              return (
                <View
                  key={`${pIndex}-${paragraph.slice(0, 24)}`}
                  onLayout={(event) =>
                    onParagraphLayout(
                      index,
                      pIndex,
                      event.nativeEvent.layout.y,
                      event.nativeEvent.layout.height,
                      block.heading ?? chapter.title,
                      paragraph,
                    )
                  }
                  style={
                    lastRead
                      ? [
                          styles.lastReadBlock,
                          {
                            borderLeftColor: accent.primary,
                            backgroundColor: alpha(accent.primary, isDark ? 0.16 : 0.08),
                          },
                        ]
                      : null
                  }
                >
                  {lastRead ? (
                    <Caption color={accent.primary} style={styles.lastReadLabel}>
                      Last line read · {formatReadingPercent(resume.percent)}
                      {resume.heading ? ` · ${resume.heading}` : ''}
                    </Caption>
                  ) : null}
                  <HighlightableText
                    text={paragraph}
                    kind="story"
                    sourceLabel={`${story.title} · ${story.figureName}`}
                    storyId={story.id}
                    storyTitle={story.title}
                    highlightMode={highlightMode}
                    style={styles.paragraph}
                  />
                </View>
              );
            })}
          </View>
        ))}

        <ChapterQuiz
          key={`${story.id}-${chapterIndex}`}
          story={story}
          chapterIndex={chapterIndex}
          chapterCount={chapters.length}
          onNextChapter={chapterIndex < chapters.length - 1 ? () => goToChapter(chapterIndex + 1) : undefined}
          onQuizStarted={markChapterComplete}
        />

        {chapters.length > 1 ? (
          <Row gap={10} style={styles.chapterNav}>
            <OutlineButton
              label="Previous"
              icon={ChevronLeft}
              size="sm"
              disabled={chapterIndex === 0}
              onPress={() => goToChapter(chapterIndex - 1)}
              style={styles.chapterNavBtn}
            />
            <OutlineButton
              label={chapterIndex < chapters.length - 1 ? 'Next chapter' : 'Last chapter'}
              icon={ChevronRight}
              size="sm"
              disabled={chapterIndex >= chapters.length - 1}
              onPress={() => goToChapter(chapterIndex + 1)}
              style={styles.chapterNavBtn}
            />
          </Row>
        ) : null}

        <View
          style={[
            styles.citationCard,
            {
              backgroundColor: isDark ? colors.cardAlt : '#F8FAFC',
              borderColor: colors.border,
            },
            shadow('sm', isDark),
          ]}
        >
          <Overline color={accent.primary}>Source & Citation</Overline>
          <Title style={styles.citationTitle}>{story.sourceBook ?? 'Classical Islamic Sources'}</Title>
          <Body color={colors.inkMuted} style={styles.citationBody}>
            {story.sourceCitation}
          </Body>
          {story.sourceVolume ? <Caption color={colors.inkSubtle}>Volume: {story.sourceVolume}</Caption> : null}
          {story.sourcePageOrHadith ? (
            <Caption color={colors.inkSubtle}>Ref: {story.sourcePageOrHadith}</Caption>
          ) : null}
          <Caption color={accent.primary} style={styles.grade}>
            Authenticity: {story.authenticityGrade}
          </Caption>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerMeta: { flex: 1, minWidth: 0, gap: 2 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressStrip: { paddingHorizontal: 0, borderBottomWidth: StyleSheet.hairlineWidth },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 128 },
  title: { marginBottom: 4 },
  figure: { marginTop: 6 },
  badges: { marginTop: 10, marginBottom: 8 },
  readerActions: { marginBottom: 12, flexWrap: 'wrap' },
  saveStoryBtn: { alignSelf: 'flex-start', width: undefined },
  listenChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  listenChipLabel: { fontWeight: '800' },
  highlightHint: { marginBottom: 14 },
  section: { marginBottom: 22, gap: 10 },
  chapterChipsWrap: { marginHorizontal: -20, marginBottom: 8 },
  chapterChips: { gap: 8, paddingHorizontal: 20 },
  chapterChip: {
    maxWidth: 168,
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 2,
    justifyContent: 'center',
  },
  chapterChipNum: { fontWeight: '800', fontSize: 11, letterSpacing: 0.4 },
  chapterChipLabel: { fontWeight: '700', fontSize: 12, maxWidth: 140 },
  swipeHint: { marginBottom: 10, fontStyle: 'italic' },
  chapterHeader: { gap: 4, paddingBottom: 12, marginBottom: 16, borderBottomWidth: 1 },
  chapterTitle: { fontSize: 20, lineHeight: 26 },
  chapterNav: { marginBottom: 20 },
  chapterNavBtn: { flex: 1 },
  sectionHeading: { fontSize: 18 },
  paragraph: { fontSize: 16, lineHeight: 27 },
  lastReadBlock: {
    borderLeftWidth: 3,
    borderRadius: radius.md,
    paddingLeft: 10,
    paddingVertical: 8,
    gap: 6,
  },
  lastReadLabel: { fontWeight: '800' },
  citationCard: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: 16,
    gap: 6,
  },
  citationTitle: { fontSize: 16 },
  citationBody: { lineHeight: 22 },
  grade: { marginTop: 4, fontWeight: '800' },
});
