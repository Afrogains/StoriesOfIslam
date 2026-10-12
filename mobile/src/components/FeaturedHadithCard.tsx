import { BookOpen, ChevronDown, ChevronUp, Highlighter, Share2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  gradeLabel,
  isLongHadith,
  nextRotationAt,
  todaysHadith,
  NAWAWI_COLLECTION,
  NAWAWI_FORTY,
  type NawawiHadith,
} from '../data/nawawiForty';
import { useHighlights } from '../hooks/useHighlights';
import { openNawawiPdf } from '../services/nawawiPdf';
import { formatHadithShare } from '../services/share';
import { useShareSheet } from './ShareSheet';
import {
  ARABIC_FONT_FAMILY,
  BODY_FONT_FAMILY,
  radius,
  shadow,
} from '../theme/tokens';
import { ArabicInline, Caption, Overline, Row, Small, useTheme } from './ui';

const COLLAPSED_AR_LINES = 2;
const COLLAPSED_EN_LINES = 3;

/**
 * Homepage Featured: one hadith from An-Nawawi's Forty, rotating every UTC day.
 * Long matn collapses to a few lines and expands in place.
 */
export default function FeaturedHadithCard() {
  const { isDark } = useTheme();
  const { openShare } = useShareSheet();
  const { addHighlight } = useHighlights();
  const [now, setNow] = useState(() => Date.now());
  const [expanded, setExpanded] = useState(false);

  const hadith = todaysHadith(now);
  const long = isLongHadith(hadith);

  useEffect(() => {
    const wait = Math.max(250, nextRotationAt(now) - Date.now() + 40);
    const timer = setTimeout(() => {
      setNow(Date.now());
      setExpanded(false);
    }, wait);
    return () => clearTimeout(timer);
  }, [now]);

  useEffect(() => {
    setExpanded(false);
  }, [hadith.n]);

  const toggle = () => {
    if (!long && expanded) {
      setExpanded(false);
      return;
    }
    setExpanded((open) => !open);
  };

  const openPdf = () => {
    void openNawawiPdf(hadith.pdfPage);
  };

  const shareHadith = () => {
    openShare(formatHadithShare(hadith));
  };

  const saveHadith = () => {
    addHighlight({
      text: `${hadith.textEn}\n\n${hadith.textAr}`,
      kind: 'hadith',
      sourceLabel: `${NAWAWI_COLLECTION.title} · Hadith ${hadith.n} · ${hadith.subject}`,
      storyTitle: `Hadith ${hadith.n}`,
    });
  };

  return (
    <View style={[styles.wrap, shadow('md', isDark)]}>
      <LinearGradient
        colors={
          isDark
            ? ['#0B3B32', '#064E3B', '#022C22']
            : ['#0B3B32', '#064E3B', '#04332A']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Pressable
          onPress={toggle}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          accessibilityLabel={featuredLabel(hadith, expanded, long)}
          style={({ pressed }) => [pressed && styles.pressed]}
        >
          <Row justify="space-between" align="center">
            <Overline color="rgba(255,255,255,0.75)">Today's hadith</Overline>
            <View style={styles.badges}>
              <View style={styles.numberBadge}>
                <Caption color="#ECFDF5">
                  {hadith.n} / {NAWAWI_FORTY.length}
                </Caption>
              </View>
              <View style={styles.gradeBadge}>
                <Caption color="#ECFDF5">{gradeLabel(hadith.grade)}</Caption>
              </View>
            </View>
          </Row>

          <Small color="rgba(253, 230, 138, 0.95)" style={styles.collection}>
            {NAWAWI_COLLECTION.title} · {hadith.subject}
          </Small>

          <ArabicInline
            color="#FFFFFF"
            style={styles.arabic}
            align="center"
            numberOfLines={expanded ? undefined : COLLAPSED_AR_LINES}
          >
            {hadith.textAr}
          </ArabicInline>

          <Text
            style={styles.english}
            numberOfLines={expanded ? undefined : COLLAPSED_EN_LINES}
          >
            {hadith.textEn}
          </Text>

          <Caption color="rgba(255,255,255,0.65)" style={styles.source}>
            {hadith.narrator} · {hadith.source}
          </Caption>
        </Pressable>

        <Row justify="space-between" align="center" style={styles.footer}>
          {long ? (
            <Pressable
              onPress={toggle}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={expanded ? 'Show less of this hadith' : 'Read the full hadith'}
              style={({ pressed }) => [styles.footerBtn, pressed && styles.pressed]}
            >
              {expanded ? (
                <ChevronUp size={14} color="rgba(255,255,255,0.85)" strokeWidth={2.25} />
              ) : (
                <ChevronDown size={14} color="rgba(255,255,255,0.85)" strokeWidth={2.25} />
              )}
              <Caption color="rgba(255,255,255,0.85)">
                {expanded ? 'Show less' : 'Read more'}
              </Caption>
            </Pressable>
          ) : (
            <Caption color="rgba(255,255,255,0.55)">New hadith each day</Caption>
          )}

          <Row gap={12} align="center">
            <Pressable
              onPress={saveHadith}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Save hadith ${hadith.n} to Highlights`}
              style={({ pressed }) => [styles.footerBtn, pressed && styles.pressed]}
            >
              <Highlighter size={14} color="rgba(253, 230, 138, 0.95)" strokeWidth={2.25} />
              <Caption color="rgba(253, 230, 138, 0.95)">Save</Caption>
            </Pressable>
            <Pressable
              onPress={shareHadith}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Share hadith ${hadith.n}`}
              style={({ pressed }) => [styles.footerBtn, pressed && styles.pressed]}
            >
              <Share2 size={14} color="rgba(253, 230, 138, 0.95)" strokeWidth={2.25} />
              <Caption color="rgba(253, 230, 138, 0.95)">Share</Caption>
            </Pressable>
            <Pressable
              onPress={openPdf}
              hitSlop={8}
              accessibilityRole="link"
              accessibilityLabel={`Open commentary PDF for hadith ${hadith.n}`}
              style={({ pressed }) => [styles.footerBtn, pressed && styles.pressed]}
            >
              <BookOpen size={14} color="rgba(253, 230, 138, 0.95)" strokeWidth={2.25} />
              <Caption color="rgba(253, 230, 138, 0.95)">Commentary</Caption>
            </Pressable>
          </Row>
        </Row>
      </LinearGradient>
    </View>
  );
}

function featuredLabel(hadith: NawawiHadith, expanded: boolean, long: boolean): string {
  const action = long ? (expanded ? 'Collapse' : 'Expand') : '';
  return [
    `Today's featured hadith, number ${hadith.n} of ${NAWAWI_FORTY.length}.`,
    hadith.subject + '.',
    action,
  ]
    .filter(Boolean)
    .join(' ');
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius['2xl'],
    marginBottom: 12,
    overflow: 'hidden',
  },
  gradient: {
    padding: 14,
    gap: 8,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  numberBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  gradeBadge: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  collection: {
    textAlign: 'left',
  },
  arabic: {
    fontFamily: ARABIC_FONT_FAMILY,
    fontSize: 18,
    lineHeight: 34,
    textAlign: 'center',
    marginTop: 2,
  },
  english: {
    fontFamily: BODY_FONT_FAMILY,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  source: { textAlign: 'center' },
  footer: {
    marginTop: 2,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.12)',
    flexWrap: 'wrap',
    gap: 8,
  },
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 2,
  },
  pressed: { opacity: 0.88 },
});
