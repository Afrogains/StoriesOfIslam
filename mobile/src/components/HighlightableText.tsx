import { Highlighter, Share2 } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { useHighlights } from '../hooks/useHighlights';
import { formatHighlightShare } from '../services/share';
import {
  BODY_FONT_FAMILY,
  alpha,
  radius,
  shadow,
} from '../theme/tokens';
import type { HighlightKind } from '../types/highlight';
import { Caption, useTheme } from './ui';
import { useShareSheet } from './ShareSheet';

type HighlightableTextProps = {
  text: string;
  kind: HighlightKind;
  sourceLabel: string;
  storyId?: string;
  storyTitle?: string;
  highlightMode?: boolean;
  style?: object;
};

function webSelect(): string {
  if (typeof window === 'undefined' || !window.getSelection) return '';
  return window.getSelection()?.toString().trim() ?? '';
}

function splitHighlighted(text: string, needles: string[]): { text: string; marked: boolean }[] {
  if (!needles.length) return [{ text, marked: false }];
  const sorted = [...needles].filter(Boolean).sort((a, b) => b.length - a.length);
  let parts: { text: string; marked: boolean }[] = [{ text, marked: false }];
  for (const needle of sorted) {
    const next: { text: string; marked: boolean }[] = [];
    for (const part of parts) {
      if (part.marked) {
        next.push(part);
        continue;
      }
      const index = part.text.indexOf(needle);
      if (index < 0) {
        next.push(part);
        continue;
      }
      if (index > 0) next.push({ text: part.text.slice(0, index), marked: false });
      next.push({ text: needle, marked: true });
      const rest = part.text.slice(index + needle.length);
      if (rest) next.push({ text: rest, marked: false });
    }
    parts = next;
  }
  return parts;
}

/**
 * Selectable body copy. Select text (web) or long-press a paragraph (native)
 * to highlight it into Library, or share the passage.
 */
export default function HighlightableText({
  text,
  kind,
  sourceLabel,
  storyId,
  storyTitle,
  highlightMode = false,
  style,
}: HighlightableTextProps) {
  const { colors, isDark } = useTheme();
  const { addHighlight, highlightsForStory, isTextHighlighted } = useHighlights();
  const { openShare } = useShareSheet();
  const [toolbar, setToolbar] = useState<{ selected: string } | null>(null);

  const marked = useMemo(() => {
    const saved = storyId
      ? highlightsForStory(storyId).map((item) => item.text)
      : [];
    const extra = isTextHighlighted(text, storyId) ? [text] : [];
    const needles = [...new Set([...saved, ...extra])].filter((needle) => text.includes(needle));
    return splitHighlighted(text, needles.slice(0, 8));
  }, [highlightsForStory, isTextHighlighted, storyId, text]);

  const save = useCallback(
    (selected: string) => {
      const excerpt = selected.trim();
      if (excerpt.length < 8) return;
      addHighlight({
        text: excerpt,
        kind,
        sourceLabel,
        storyId,
        storyTitle,
      });
      setToolbar(null);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.getSelection()?.removeAllRanges();
      }
    },
    [addHighlight, kind, sourceLabel, storyId, storyTitle],
  );

  const sharePassage = useCallback(
    (selected: string) => {
      const excerpt = selected.trim() || text;
      openShare(
        formatHighlightShare({
          id: 'preview',
          text: excerpt,
          kind,
          sourceLabel,
          storyId,
          storyTitle,
          createdAt: Date.now(),
        }),
      );
      setToolbar(null);
    },
    [kind, openShare, sourceLabel, storyId, storyTitle, text],
  );

  const onLongPress = () => {
    const selected = webSelect() || text;
    if (Platform.OS === 'web') {
      setToolbar({ selected });
      return;
    }
    Alert.alert('This passage', selected.length > 90 ? `${selected.slice(0, 89)}…` : selected, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Share', onPress: () => sharePassage(selected) },
      { text: 'Highlight', onPress: () => save(selected) },
    ]);
  };

  const onPress = () => {
    if (highlightMode) {
      save(text);
      return;
    }
    if (Platform.OS === 'web') {
      const selected = webSelect();
      if (selected && text.includes(selected)) {
        setToolbar({ selected });
      }
    }
  };

  const stop = (event: GestureResponderEvent) => {
    event.stopPropagation();
  };

  const wash = marked.some((part) => part.marked)
    ? isDark
      ? alpha(colors.gold, 0.18)
      : '#FEF3C7'
    : undefined;

  return (
    <View style={highlightMode ? styles.modeRow : undefined}>
      <Pressable
        onLongPress={onLongPress}
        onPress={onPress}
        delayLongPress={380}
        style={styles.passage}
        accessibilityRole="button"
        accessibilityLabel={highlightMode ? 'Save this paragraph to Highlights' : undefined}
      >
        <Text
          selectable
          style={[
            styles.body,
            { color: colors.ink, backgroundColor: wash, borderRadius: radius.sm },
            style,
          ]}
        >
          {marked.map((part, index) => (
            <Text
              key={`${index}-${part.text.slice(0, 12)}`}
              style={
                part.marked
                  ? {
                      backgroundColor: isDark ? alpha('#FBBF24', 0.35) : '#FDE68A',
                    }
                  : undefined
              }
            >
              {part.text}
            </Text>
          ))}
        </Text>
      </Pressable>
      {highlightMode ? (
        <Pressable
          onPress={() => save(text)}
          accessibilityRole="button"
          accessibilityLabel="Save this paragraph to Highlights"
          hitSlop={8}
          style={({ pressed }) => [
            styles.markBtn,
            { borderColor: colors.gold, backgroundColor: alpha(colors.gold, 0.12) },
            pressed && styles.pressed,
          ]}
        >
          <Highlighter size={14} color={colors.gold} />
        </Pressable>
      ) : null}

      {toolbar ? (
        <View
          style={[
            styles.toolbar,
            {
              backgroundColor: isDark ? colors.card : '#1C1917',
              borderColor: colors.border,
            },
            shadow('md', isDark),
          ]}
        >
          <Caption color="#FDE68A" style={styles.toolbarHint} numberOfLines={1}>
            {toolbar.selected.length > 42 ? `${toolbar.selected.slice(0, 41)}…` : toolbar.selected}
          </Caption>
          <View style={styles.toolbarRow}>
            <Pressable
              onPress={(event) => {
                stop(event);
                save(toolbar.selected);
              }}
              accessibilityRole="button"
              accessibilityLabel="Save highlight to library"
              style={({ pressed }) => [styles.toolbarBtn, pressed && styles.pressed]}
            >
              <Highlighter size={14} color="#FDE68A" />
              <Caption color="#FDE68A">Highlight</Caption>
            </Pressable>
            <Pressable
              onPress={(event) => {
                stop(event);
                sharePassage(toolbar.selected);
              }}
              accessibilityRole="button"
              accessibilityLabel="Share this passage"
              style={({ pressed }) => [styles.toolbarBtn, pressed && styles.pressed]}
            >
              <Share2 size={14} color="#ECFDF5" />
              <Caption color="#ECFDF5">Share</Caption>
            </Pressable>
            <Pressable
              onPress={() => setToolbar(null)}
              accessibilityRole="button"
              accessibilityLabel="Dismiss highlight toolbar"
            >
              <Caption color="rgba(255,255,255,0.55)">Close</Caption>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  modeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  passage: { flex: 1, minWidth: 0 },
  markBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  body: {
    fontFamily: BODY_FONT_FAMILY,
    fontSize: 16,
    lineHeight: 27,
    fontWeight: '400',
  },
  toolbar: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  toolbarHint: { fontWeight: '600' },
  toolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  toolbarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pressed: { opacity: 0.85 },
});
