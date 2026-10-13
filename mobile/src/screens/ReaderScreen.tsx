import { Bookmark, BookOpenCheck, ExternalLink, Headphones, Highlighter, Share2, X } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { getProphetChapter } from '../data/prophetChapters';
import { getQuranStory } from '../data/quranStories';
import { getSahabahChapter } from '../data/sahabahChapters';
import { getSeerahPart } from '../data/seerahParts';
import { getShortStory } from '../data/shortStoriesFromTheLife';
import { theProphets } from '../data/theProphets';
import { theSahabah } from '../data/theSahabah';
import { useReadingBookmark } from '../hooks/useReadingBookmark';
import HighlightableText from '../components/HighlightableText';
import { useShareSheet } from '../components/ShareSheet';
import { useLibrary } from '../hooks/useLibrary';
import { formatStoryShare } from '../services/share';
import { openIbnKathirPdf, pdfSpanForSlug } from '../services/ibnKathirPdf';
import { openQuranStoriesPdf, quranStoryPdfSpanForSlug } from '../services/quranStoriesPdf';
import { openSahabahPdf, sahabahPdfSpanForSlug } from '../services/sahabahPdf';
import { openShortStoriesPdf, shortStoryPdfSpanForSlug } from '../services/shortStoriesPdf';
import type { StoryItem } from '../types/catalog';
import { toParagraphs } from '../data/text';
import { useMobileLayout } from '../hooks/useMobileLayout';
import { alpha, radius, sectionAccent, shadow } from '../theme/tokens';
import {
  ArabicTitle,
  Badge,
  Body,
  Caption,
  Display,
  Heading,
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

function resolveFullText(story: StoryItem): { sections: { heading?: string; body: string }[]; plain: string } {
  if (story.sectionSlug === 'qisas-al-anbiya') {
    const prophet = theProphets.find(
      (item) =>
        item.nameEn.toLowerCase() === story.figureName.toLowerCase() ||
        story.figureName.toLowerCase().includes(item.nameEn.toLowerCase()),
    );
    const chapter = prophet ? getProphetChapter(prophet.slug) : undefined;
    if (chapter?.sections?.length) {
      return {
        sections: chapter.sections.map((section) => ({
          heading: section.heading,
          body: section.body,
        })),
        plain: chapter.contentEn,
      };
    }
  }

  if (story.sectionSlug === 'qisas-al-quran') {
    const chapter = getQuranStory(story.id);
    if (chapter?.sections?.length) {
      return {
        sections: chapter.sections.map((section) => ({
          heading: section.heading,
          body: section.body,
        })),
        plain: chapter.contentEn,
      };
    }
  }

  if (story.sectionSlug === 'seerah-shamail') {
    const part = getSeerahPart(story.id);
    if (part?.sections?.length) {
      return {
        sections: part.sections.map((section) => ({
          heading: section.heading,
          body: section.body,
        })),
        plain: part.contentEn,
      };
    }
    const shortStory = getShortStory(story.id);
    if (shortStory?.sections?.length) {
      return {
        sections: shortStory.sections.map((section) => ({
          heading: section.heading,
          body: section.body,
        })),
        plain: shortStory.contentEn,
      };
    }
  }

  if (story.sectionSlug === 'sahabah') {
    const companion = theSahabah.find(
      (item) =>
        item.nameEn.toLowerCase() === story.figureName.toLowerCase() ||
        story.figureName.toLowerCase().includes(item.nameEn.toLowerCase()) ||
        story.id.includes(item.slug),
    );
    const chapter = companion ? getSahabahChapter(companion.slug) : undefined;
    if (chapter?.sections?.length) {
      return {
        sections: chapter.sections.map((section) => ({
          heading: section.heading,
          body: section.body,
        })),
        plain: chapter.contentEn,
      };
    }
  }

  const content = (story.content ?? story.summary ?? '').trim();
  const paragraphs = toParagraphs(content).map((body) => ({ body }));
  return { sections: paragraphs.length ? paragraphs : [{ body: content }], plain: content };
}

export default function ReaderScreen({ story, onClose, onSwitchToListening }: ReaderScreenProps) {
  const { colors, isDark } = useTheme();
  const { topInset, bottomInset } = useMobileLayout();
  const accent = sectionAccent(story.sectionSlug, isDark);
  const { isSaved, toggleSaved } = useLibrary();
  const { openShare } = useShareSheet();
  const { load, save } = useReadingBookmark(story.id);
  const scrollRef = useRef<ScrollView>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [restoredY, setRestoredY] = useState(0);
  const [highlightMode, setHighlightMode] = useState(false);
  const saved = isSaved(story.id);
  const resolved = useMemo(() => resolveFullText(story), [story]);
  const prophetSlug = useMemo(() => {
    if (story.sectionSlug !== 'qisas-al-anbiya') return null;
    return (
      theProphets.find(
        (item) =>
          item.nameEn.toLowerCase() === story.figureName.toLowerCase() ||
          story.figureName.toLowerCase().includes(item.nameEn.toLowerCase()),
      )?.slug ?? null
    );
  }, [story.figureName, story.sectionSlug]);
  const sahabahSlug = useMemo(() => {
    if (story.sectionSlug !== 'sahabah') return null;
    return (
      theSahabah.find(
        (item) =>
          item.nameEn.toLowerCase() === story.figureName.toLowerCase() ||
          story.figureName.toLowerCase().includes(item.nameEn.toLowerCase()) ||
          story.id.includes(item.slug),
      )?.slug ?? null
    );
  }, [story.figureName, story.id, story.sectionSlug]);
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
    void load().then((y) => {
      setRestoredY(y);
      setBookmarked(y > 0);
    });
  }, [load]);

  useEffect(() => {
    if (restoredY <= 0) return;
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: restoredY, animated: false });
    }, 80);
    return () => clearTimeout(timer);
  }, [restoredY, resolved.plain]);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!bookmarked) return;
    void save(event.nativeEvent.contentOffset.y);
  };

  const toggleBookmark = () => {
    setBookmarked((prev) => {
      const next = !prev;
      if (!next) void save(0);
      return next;
    });
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
          <Overline color={accent.primary}>Reading mode</Overline>
          <Caption color={colors.inkMuted}>
            {story.figureName}
          </Caption>
        </View>

        <Pressable
          onPress={toggleBookmark}
          accessibilityRole="button"
          accessibilityState={{ selected: bookmarked }}
          accessibilityLabel={bookmarked ? 'Clear reading bookmark' : 'Bookmark reading position'}
          style={[
            styles.iconBtn,
            {
              borderColor: bookmarked ? colors.gold : colors.border,
              backgroundColor: bookmarked ? alpha(colors.gold, 0.14) : colors.card,
            },
          ]}
        >
          <Bookmark
            size={18}
            color={bookmarked ? colors.gold : colors.ink}
            fill={bookmarked ? colors.gold : 'transparent'}
          />
        </Pressable>

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
          accessibilityLabel={highlightMode ? 'Turn off highlight mode' : 'Highlight passages'}
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
          onPress={() => toggleSaved(story.id)}
          accessibilityRole="button"
          accessibilityState={{ selected: saved }}
          accessibilityLabel={saved ? 'Remove from library' : 'Save to library'}
          style={[styles.iconBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
        >
          <BookOpenCheck size={18} color={saved ? colors.emerald : colors.ink} />
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomInset + 96 }]}
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
        {highlightMode ? (
          <Caption color={colors.gold} style={styles.highlightHint}>
            Tap a paragraph to save it in Library → Highlights. Long-press still works too.
          </Caption>
        ) : (
          <Caption color={colors.inkSubtle} style={styles.highlightHint}>
            Select or long-press a passage to highlight or share it.
          </Caption>
        )}

        {resolved.sections.map((section, index) => (
          <View key={`${section.heading ?? 'p'}-${index}`} style={styles.section}>
            {section.heading ? <Heading style={styles.sectionHeading}>{section.heading}</Heading> : null}
            {toParagraphs(section.body).map((paragraph, pIndex) => (
              <HighlightableText
                key={`${pIndex}-${paragraph.slice(0, 24)}`}
                text={paragraph}
                kind="story"
                sourceLabel={`${story.title} · ${story.figureName}`}
                storyId={story.id}
                storyTitle={story.title}
                highlightMode={highlightMode}
                style={styles.paragraph}
              />
            ))}
          </View>
        ))}

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

      <Pressable
        onPress={onSwitchToListening}
        accessibilityRole="button"
        accessibilityLabel="Switch to listening mode"
        style={[
          styles.fab,
          { backgroundColor: accent.primary, bottom: bottomInset + 14 },
          shadow('lg', isDark),
        ]}
      >
        <Headphones size={18} color="#FFFFFF" />
        <Caption color="#FFFFFF" style={styles.fabLabel}>
          Switch to Listening Mode
        </Caption>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerMeta: { flex: 1, minWidth: 0, gap: 2 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 120 },
  title: { marginBottom: 4 },
  figure: { marginTop: 6 },
  badges: { marginTop: 10, marginBottom: 8 },
  highlightHint: { marginBottom: 14 },
  section: { marginBottom: 22, gap: 10 },
  sectionHeading: { fontSize: 18 },
  paragraph: { fontSize: 16, lineHeight: 27 },
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
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: radius.pill,
  },
  fabLabel: { fontWeight: '800' },
});
