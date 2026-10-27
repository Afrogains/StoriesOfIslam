import { AlertTriangle, ChevronDown, ChevronUp, Headphones, Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import BottomStickyCard, {
  type BottomStickyDeckMode,
} from '../components/BottomStickyCard';
import ScreenHeader from '../components/ScreenHeader';
import {
  ArabicInline,
  Body,
  BodyStrong,
  Caption,
  Overline,
  Small,
  useTheme,
} from '../components/ui';
import {
  THE_NAMES_SERIES,
  divineNames,
  findName,
  type DivineName,
} from '../data/theNames';
import { nameAudioByNumber } from '../data/theNamesAudio';
import { useMobileLayout } from '../hooks/useMobileLayout';
import { useApprovedNamesMedia, type ApprovedNameMedia } from '../services/namesMedia';
import { alpha, brandGradients, radius, shadow } from '../theme/tokens';

function nameHasAudio(number: number, approved: Record<number, ApprovedNameMedia>): boolean {
  const media = approved[number];
  return Boolean(nameAudioByNumber[number] || media?.audioUrl || media?.podcastAudioUrl);
}

/** Dense 2-column Names grid with a compact bottom sticky deck. */
export default function NamesScreen() {
  const { colors, isDark } = useTheme();
  const {
    topPad,
    padX,
    stickyBottom,
    namesListPadBottom,
    namesListPadBottomIdle,
    namesListPadBottomMini,
  } = useMobileLayout();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<DivineName>(divineNames[0]);
  const [deckMode, setDeckMode] = useState<BottomStickyDeckMode>('idle');
  const goldGradient = brandGradients.gold[isDark ? 'dark' : 'light'];
  const namesMedia = useApprovedNamesMedia();
  const hasAudioFor = (number: number) => nameHasAudio(number, namesMedia.byNumber);
  const audioCount = useMemo(
    () => divineNames.filter((name) => nameHasAudio(name.number, namesMedia.byNumber)).length,
    [namesMedia.byNumber],
  );

  const filtered = useMemo(() => findName(query), [query]);
  // Pad odd counts so the last tile keeps half width instead of stretching.
  const gridData = useMemo<(DivineName | null)[]>(
    () => (filtered.length % 2 ? [...filtered, null] : filtered),
    [filtered],
  );

  const selectName = (item: DivineName) => {
    const hasAudio = hasAudioFor(item.number);
    setSelected(item);
    setDeckMode((prev) => {
      if (prev === 'read') return 'read';
      if (!hasAudio) return 'idle';
      // Keep a compact player when switching names so the grid stays tappable.
      if (prev === 'listen' || prev === 'mini') return 'mini';
      return 'listen';
    });
  };

  const listPadBottom =
    deckMode === 'idle'
      ? namesListPadBottomIdle
      : deckMode === 'mini'
        ? namesListPadBottomMini
        : namesListPadBottom;

  const badgeLabel =
    filtered.length === 99 ? `${audioCount} audio` : `${filtered.length} found`;

  return (
    <View style={[styles.screen, { backgroundColor: colors.paper }]}>
      <View style={[styles.topBar, { paddingTop: topPad, paddingHorizontal: padX }]}>
        <ScreenHeader
          eyebrow="Asma’ul Husna"
          title="The Names"
          arabic="الأسماء الحسنى"
          subtitle="Study notes only — read the disclaimer below."
        />
        <View
          style={[
            styles.searchBox,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Search size={16} color={colors.inkSubtle} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search names…"
            placeholderTextColor={colors.inkSubtle}
            accessibilityLabel="Search the 99 names"
            style={[styles.searchInput, { color: colors.ink }]}
          />
          <View
            style={[
              styles.audioCount,
              { backgroundColor: isDark ? colors.cardAlt : colors.subtleBg },
            ]}
            accessibilityLabel={badgeLabel}
          >
            <Headphones size={11} color={colors.inkMuted} />
            <Caption color={colors.inkMuted} style={styles.audioCountText}>
              {filtered.length === 99 ? String(audioCount) : String(filtered.length)}
            </Caption>
          </View>
        </View>
      </View>

      <FlatList
        data={gridData}
        keyExtractor={(item, index) => (item ? String(item.number) : `spacer-${index}`)}
        numColumns={2}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingHorizontal: padX }]}
        // numColumns + contentContainerStyle paddingBottom is unreliable on web;
        // a footer spacer guarantees tiles can scroll clear of the sticky deck.
        ListHeaderComponent={<NamesDisclaimer />}
        ListFooterComponent={
          <View style={{ height: listPadBottom }} />
        }
        renderItem={({ item }) => {
          if (!item) return <View style={styles.spacerTile} />;
          const active = item.number === selected.number;
          const hasAudio = hasAudioFor(item.number);
          return (
            <Pressable
              onPress={() => selectName(item)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${item.transliteration}, ${item.meaning}`}
              style={({ pressed }) => [
                styles.nameTile,
                {
                  backgroundColor: active
                    ? isDark
                      ? alpha(colors.gold, 0.16)
                      : colors.goldSoft
                    : colors.card,
                  borderColor: active ? colors.gold : colors.border,
                  opacity: pressed ? 0.88 : 1,
                },
                active ? shadow('sm', isDark) : null,
              ]}
            >
              <View style={styles.tileTop}>
                <LinearGradient
                  colors={active ? goldGradient : [colors.cardAlt, colors.cardAlt]}
                  style={styles.numberPill}
                >
                  <BodyStrong
                    color={active ? '#FFFFFF' : colors.inkMuted}
                    style={styles.numberText}
                  >
                    {item.number}
                  </BodyStrong>
                </LinearGradient>
                {hasAudio ? (
                  <Headphones size={12} color={active ? colors.gold : colors.inkSubtle} />
                ) : (
                  <View style={styles.audioSpacer} />
                )}
              </View>
              <ArabicInline
                color={colors.gold}
                style={styles.tileArabic}
                numberOfLines={1}
              >
                {item.arabic}
              </ArabicInline>
              <BodyStrong numberOfLines={1} style={styles.tileName}>
                {item.transliteration}
              </BodyStrong>
              <Small color={colors.inkMuted} numberOfLines={1} style={styles.tileMeaning}>
                {item.meaning}
              </Small>
            </Pressable>
          );
        }}
      />

      <BottomStickyCard
        name={selected}
        mode={deckMode}
        bottomOffset={stickyBottom}
        approved={namesMedia.byNumber[selected.number]}
        mediaStatus={namesMedia.status}
        onListen={() => setDeckMode((prev) => (prev === 'listen' ? 'mini' : 'listen'))}
        onMinimizePlayer={() => setDeckMode('mini')}
        onExpandPlayer={() => setDeckMode('listen')}
        onReadNarrations={() =>
          setDeckMode((prev) => (prev === 'read' ? 'idle' : 'read'))
        }
      />
    </View>
  );
}

function NamesDisclaimer() {
  const { colors, isDark } = useTheme();
  const [expanded, setExpanded] = useState(false);

  return (
    <Pressable
      onPress={() => setExpanded((open) => !open)}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      accessibilityLabel={
        expanded
          ? `${THE_NAMES_SERIES.disclaimerTitle}. ${THE_NAMES_SERIES.disclaimerLead} ${THE_NAMES_SERIES.disclaimerParagraphs.join(' ')}`
          : `${THE_NAMES_SERIES.disclaimerTitle}. ${THE_NAMES_SERIES.disclaimerLead} Double tap to read the full disclaimer.`
      }
      style={[
        styles.disclaimer,
        {
          backgroundColor: isDark ? alpha(colors.gold, 0.16) : colors.goldSoft,
          borderColor: colors.gold,
        },
      ]}
    >
      <View style={styles.disclaimerHead}>
        <AlertTriangle size={16} color={colors.gold} />
        <Overline color={colors.gold} style={styles.disclaimerTitle}>
          {THE_NAMES_SERIES.disclaimerTitle}
        </Overline>
        {expanded ? (
          <ChevronUp size={16} color={colors.gold} />
        ) : (
          <ChevronDown size={16} color={colors.gold} />
        )}
      </View>
      <BodyStrong color={colors.ink} style={styles.disclaimerLead}>
        {THE_NAMES_SERIES.disclaimerLead}
      </BodyStrong>
      {expanded
        ? THE_NAMES_SERIES.disclaimerParagraphs.map((paragraph) => (
            <Body key={paragraph.slice(0, 32)} color={colors.ink} style={styles.disclaimerBody}>
              {paragraph}
            </Body>
          ))
        : (
          <Caption color={colors.gold} style={styles.disclaimerToggle}>
            Read full disclaimer
          </Caption>
        )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBar: {
    gap: 10,
    paddingBottom: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingLeft: 12,
    paddingRight: 6,
    minHeight: 48,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 10,
    ...(({ outlineStyle: 'none' } as unknown) as object),
  },
  audioCount: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 9,
    height: 32,
    borderRadius: radius.pill,
    flexShrink: 0,
  },
  audioCountText: { fontSize: 11, lineHeight: 14, fontWeight: '700' },
  listContent: {
    gap: 8,
    paddingTop: 6,
  },
  row: {
    gap: 8,
  },
  nameTile: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 10,
    gap: 2,
    minHeight: 112,
  },
  tileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    minHeight: 28,
  },
  numberPill: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: { fontSize: 11, lineHeight: 14 },
  audioSpacer: { width: 12, height: 12 },
  spacerTile: { flex: 1 },
  tileArabic: { fontSize: 18, lineHeight: 28, textAlign: 'right' },
  tileName: { marginTop: 2, fontSize: 13, lineHeight: 18 },
  tileMeaning: { lineHeight: 16 },
  disclaimer: {
    borderWidth: 1.5,
    borderRadius: radius.lg,
    padding: 12,
    gap: 6,
    marginBottom: 10,
  },
  disclaimerHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  disclaimerTitle: { flex: 1, minWidth: 0 },
  disclaimerLead: { fontSize: 13, lineHeight: 19 },
  disclaimerBody: { fontSize: 13, lineHeight: 20 },
  disclaimerToggle: { fontWeight: '700', marginTop: 2 },
});
