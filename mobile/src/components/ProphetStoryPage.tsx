import { BookOpen, ChevronLeft, Quote } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import type { ProphetChapter } from '../data/prophetChapters';
import { alpha, radius, shadow } from '../theme/tokens';
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
} from './ui';

type ProphetStoryPageProps = {
  chapter: ProphetChapter;
  honorificEn?: string;
  honorificAr?: string;
  onClose: () => void;
  onListen?: () => void;
};

/**
 * Dedicated full-page reading surface for one prophet’s Ibn Kathir chapter
 * paraphrase — continuous prose with section headings from the book’s arc.
 */
export default function ProphetStoryPage({
  chapter,
  honorificEn = 'peace be upon him',
  honorificAr = 'عليه السلام',
  onClose,
  onListen,
}: ProphetStoryPageProps) {
  const { colors, isDark } = useTheme();
  const minutes = Math.max(1, Math.round(chapter.durationMs / 60000));

  return (
    <View style={[styles.screen, { backgroundColor: colors.paper }]}>
      <View
        style={[
          styles.topBar,
          {
            backgroundColor: isDark ? colors.card : '#F7F3EA',
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close prophet story"
          style={({ pressed }) => [
            styles.backBtn,
            {
              backgroundColor: isDark ? colors.cardAlt : '#FFFFFF',
              borderColor: colors.border,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <ChevronLeft size={20} color={colors.ink} />
        </Pressable>
        <View style={styles.topMeta}>
          <Overline color={colors.emerald}>Stories of the Prophets</Overline>
          <Caption color={colors.inkMuted}>
            Ibn Kathir · teaching paraphrase
          </Caption>
        </View>
        {onListen ? (
          <Pressable
            onPress={onListen}
            accessibilityRole="button"
            accessibilityLabel={`Listen to ${chapter.nameEn}`}
            style={({ pressed }) => [
              styles.listenBtn,
              {
                backgroundColor: colors.emerald,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <Caption color="#FFFFFF" style={styles.listenLabel}>
              Listen
            </Caption>
          </Pressable>
        ) : (
          <View style={styles.listenSpacer} />
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.hero,
            {
              backgroundColor: isDark ? alpha(colors.emerald, 0.14) : '#ECFDF5',
              borderColor: isDark ? alpha(colors.emerald, 0.35) : '#A7F3D0',
            },
            shadow('sm', isDark),
          ]}
        >
          <Row gap={8} style={styles.heroBadges}>
            <Badge label="Sahih themes" color={colors.emerald} icon={BookOpen} />
            <Caption color={colors.inkMuted}>~{minutes} min read</Caption>
          </Row>
          <Display style={styles.heroTitle}>{chapter.titleEn}</Display>
          <ArabicTitle color={colors.emerald}>{chapter.titleAr}</ArabicTitle>
          <Title style={styles.figure}>
            {chapter.nameEn} · {honorificEn}
          </Title>
          <Caption color={colors.inkMuted}>
            {chapter.nameAr} {honorificAr}
          </Caption>
        </View>

        <View
          style={[
            styles.note,
            {
              backgroundColor: isDark ? colors.cardAlt : '#FFFBEB',
              borderColor: isDark ? colors.border : '#FDE68A',
            },
          ]}
        >
          <Quote size={16} color={colors.gold} />
          <Body color={colors.inkMuted} style={styles.noteText}>
            Full chapter account adapted for reading from Ibn Kathir’s Stories of
            the Prophets. This is a teaching paraphrase of the narrative arc—not
            a word-for-word reprint of the book.
          </Body>
        </View>

        {chapter.sections.map((section) => (
          <View key={section.heading} style={styles.section}>
            <Heading style={styles.sectionHeading}>{section.heading}</Heading>
            {section.body.split(/\n+/).filter(Boolean).map((paragraph) => (
              <Body key={paragraph.slice(0, 48)} style={styles.paragraph}>
                {paragraph.trim()}
              </Body>
            ))}
          </View>
        ))}

        <Caption align="center" style={styles.citation}>
          {chapter.sourceCitation}
        </Caption>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
              borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topMeta: { flex: 1, gap: 2 },
  listenBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  listenLabel: { fontWeight: '800' },
  listenSpacer: { width: 36 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 48 },
  hero: {
    borderWidth: 1,
    borderRadius: radius['2xl'],
    padding: 18,
    gap: 6,
    marginBottom: 16,
  },
  heroBadges: { marginBottom: 4 },
  heroTitle: { marginTop: 4 },
  figure: { marginTop: 6, fontSize: 17 },
  note: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 22,
  },
  noteText: { flex: 1, lineHeight: 21, fontSize: 13 },
  section: { marginBottom: 26, gap: 10 },
  sectionHeading: { fontSize: 18, marginBottom: 2 },
  paragraph: { lineHeight: 26, fontSize: 16 },
  citation: { marginTop: 8, lineHeight: 18, paddingHorizontal: 12 },
});
