import { Bookmark, ChevronLeft, ChevronRight, ExternalLink, Headphones, Highlighter, Share2, X } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { getStoryChapters } from '../data/chapters';
import { getSeerahPart } from '../data/seerahParts';
import { prophetSlugForStory, sahabahSlugForStory } from '../data/storyText';
import ChapterQuiz from '../components/ChapterQuiz';
import {
  EMPTY_READING_BOOKMARK,
  bookmarkFromScroll,
  chapterBookmark,
  formatReadingPercent,
  type ReadingBlock,
  type ReadingBookmark,
} from '../hooks/readingBookmark';
import { useReadingBookmark } from '../hooks/useReadingBookmark';
import HighlightableText from '../components/HighlightableText';
import { useShareSheet } from '../components/ShareSheet';
import { useLibrary } from '../hooks/useLibrary';
import { formatStoryShare } from '../services/share';
import { openIbnKathirPdf, pdfSpanForSlug } from '../services/ibnKathirPdf';
import { openQuranStoriesPdf, quranStoryPdfSpanForSlug } from '../services/quranStoriesPdf';
import { openSahabahPdf, sahabahPdfSpanForSlug } from '../services/sahabahPdf';
import { openShortStoriesPdf, shortStoryPdfSpanForSlug } from '../services/shortStoriesPdf';
import { LISTEN_CTA_A11Y, LISTEN_CTA_LABEL } from '../data/listenIncoming';
import type { StoryItem } from '../types/catalog';
import { useMobileLayout } from '../hooks/useMobileLayout';
import { alpha, radius, sectionAccent, shadow } from '../theme/tokens';
import {
  ArabicTitle,
  Badge,
  Body,
  Caption,
  Display,
  Heading,
  OutlineButton,
  Overline,
  Row,
  Title,
  useTheme,
} from '../components/ui';

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
  const [highlightMode, setHighlightMode] = useState(false);
  const saved = isSaved(story.id);
  const chapters = useMemo(() => getStoryChapters(story), [story]);
  const [chapterIndex, setChapterIndex] = useState(0);
  const chapter = chapters[Math.min(chapterIndex, chapters.length - 1)];
  const chapterTopRef = useRef(0);
  const prophetSlug = useMemo(() => prophetSlugForStory(story), [story]);
  const sahabahSlug = useMemo(() => sahabahSlugForStory(story), [story]);
  const prophetPdfSpan = prophetSlug ? pdfSpanForSlug(prophetSlug) : null;
  const seerahPdfSpan =
    story.sectionSlug === 'seerah-shamail' && getSeerahPart(story.id)
      ? pdfSpanForSlug('muhammad')
      : null;
  const shortStoryPdfSpan =
    story.sectionSlug === 'seerah-shamail' ? shortStoryPdfSpanForSlug(story.id) : null;
  const sahabahPdfSpan = sahabahSlug ? sahabahPdfSpanForSlug(sahabahSlug) : null;
  const quranPdfSpan =
    story.sectionSlug === 'qisas-al-quran' ? quranStoryPdfSpanForSlug(story.id) : null;
  const ibnKathirSpan = prophetPdfSpan ?? seerahPdfSpan;
  const pdfSpan = ibnKathirSpan ?? shortStoryPdfSpan ?? sahabahPdfSpan ?? quranPdfSpan;

  useEffect(() => {
    void load().then((bookmark) => {
      setResume(bookmark);
      if (bookmark.chapter !== undefined) {
        setChapterIndex(Math.min(bookmark.chapter, chapters.length - 1));
        setRestoredY(bookmark.y);
        return;
      }
      // Bookmarks from before chapters: reopen the chapter holding the last line read.
      const legacy = bookmark.line
        ? chapters.findIndex((item) => item.blocks.some((block) => block.paragraphs.some((p) => p.includes(bookmark.line))))
        : -1;
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

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const next = chapterBookmark(
      bookmarkFromScroll(
        contentOffset.y,
        contentSize.height,
        layoutMeasurement.height,
        layoutMeasurement.width,
        blocksRef.current,
      ),
      chapterIndex,
      chapters.length,
    );
    setResume((current) => (Math.abs(current.percent - next.percent) >= 0.01 || current.chapter !== next.chapter ? next : current));
    void save(next);
  };

  const goToChapter = (index: number) => {
    const target = Math.max(0, Math.min(chapters.length - 1, index));
    blockMapRef.current.clear();
    blocksRef.current = [];
    sectionYRef.current = [];
    setChapterIndex(target);
    setRestoredY(0);
    const bookmark = chapterBookmark(
      { ...EMPTY_READING_BOOKMARK, heading: chapters[target]?.title ?? null },
      target,
      chapters.length,
    );
    setResume(bookmark);
    void save(bookmark);
    requestAnimationFrame(() =>
      scrollRef.current?.scrollTo({ y: Math.max(0, chapterTopRef.current - 8), animated: false }),
    );
  };

  const publishBlocks = () => {
    blocksRef.current = [...blockMapRef.current.values()];
  };

  const onSectionLayout = (sectionIndex: number, y: number) => {
    sectionYRef.current[sectionIndex] = y;
    for (const [key, block] of blockMapRef.current) {
      if (key.startsWith(`${sectionIndex}:`)) {
        block.y = y + block.localY;
      }
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

  return (
    <View style={[styles.screen, { backgroundColor: colors.paper }]}>
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
            {resume.percent > 0 ? ` · ${formatReadingPercent(resume.percent)}` : ''}
          </Overline>
          <Caption color={colors.inkMuted} numberOfLines={1}>
            {resume.heading ?? story.figureName}
          </Caption>
        </View>

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
          <Bookmark
            size={18}
            color={saved ? colors.gold : colors.ink}
            fill={saved ? colors.gold : 'transparent'}
          />
        </Pressable>
      </View>

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
                        backgroundColor: selected ? alpha(accent.primary, isDark ? 0.22 : 0.1) : colors.card,
                      },
                    ]}
                  >
                    <Caption color={selected ? accent.primary : colors.inkMuted} style={styles.chapterChipText}>
                      {item.index + 1}
                    </Caption>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}
          <View style={[styles.chapterHeader, { borderBottomColor: colors.border }]}>
            <Overline color={accent.primary}>
              {chapters.length > 1 ? `Chapter ${chapterIndex + 1} of ${chapters.length}` : 'Full story'}
            </Overline>
            <Heading style={styles.chapterTitle}>{chapter.title}</Heading>
            <Caption color={colors.inkSubtle}>About {Math.max(1, Math.round(chapter.words / 200))} min read</Caption>
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
          {story.sourceVolume ? (
            <Caption color={colors.inkSubtle}>Volume: {story.sourceVolume}</Caption>
          ) : null}
          {story.sourcePageOrHadith ? (
            <Caption color={colors.inkSubtle}>Ref: {story.sourcePageOrHadith}</Caption>
          ) : null}
          {pdfSpan ? (
            <Pressable
              onPress={() =>
                void (ibnKathirSpan
                  ? openIbnKathirPdf(pdfSpan.start)
                  : quranPdfSpan
                    ? openQuranStoriesPdf(pdfSpan.start)
                    : shortStoryPdfSpan
                      ? openShortStoriesPdf(pdfSpan.start)
                      : openSahabahPdf(pdfSpan.start))
              }
              accessibilityRole="link"
              accessibilityLabel={
                ibnKathirSpan
                  ? 'Open Ibn Kathir PDF at this chapter'
                  : quranPdfSpan
                    ? 'Open Stories of the Quran PDF at this chapter'
                    : shortStoryPdfSpan
                      ? 'Open short stories PDF at this chapter'
                      : 'Open Sahaba biographies PDF at this chapter'
              }
              style={({ pressed }) => [
                styles.pdfBtn,
                {
                  borderColor: accent.primary,
                  backgroundColor: alpha(accent.primary, isDark ? 0.16 : 0.08),
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <ExternalLink size={14} color={accent.primary} />
              <Caption color={accent.primary} style={styles.pdfBtnLabel}>
                {ibnKathirSpan
                  ? `Open Ibn Kathir PDF (p. ${pdfSpan.start})`
                  : quranPdfSpan
                    ? `Open Stories of the Quran PDF (p. ${pdfSpan.start})`
                    : shortStoryPdfSpan
                      ? `Open short stories PDF (p. ${pdfSpan.start})`
                      : `Open Sahaba PDF (p. ${pdfSpan.start})`}
              </Caption>
            </Pressable>
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
  chapterChipsWrap: { marginHorizontal: -20, marginBottom: 12 },
  chapterChips: { gap: 8, paddingHorizontal: 20 },
  chapterChip: {
    minWidth: 38,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterChipText: { fontWeight: '800', fontSize: 13 },
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
  pdfBtn: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },
  pdfBtnLabel: { fontWeight: '800' },
  grade: { marginTop: 4, fontWeight: '800' },
});
