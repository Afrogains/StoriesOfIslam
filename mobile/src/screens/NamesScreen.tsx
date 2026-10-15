import { AlertTriangle, Headphones, Search } from 'lucide-react-native';
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
import { LISTEN_CTA_LABEL } from '../data/listenIncoming';
import { useMobileLayout } from '../hooks/useMobileLayout';
import { useApprovedNamesMedia } from '../services/namesMedia';
import { alpha, brandGradients, radius, shadow } from '../theme/tokens';

/** Dense 2-column Names grid with a compact bottom sticky deck. */
export default function NamesScreen() {
  const { colors, isDark } = useTheme();
  const { topPad, padX, stickyBottom, namesListPadBottom } = useMobileLayout();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<DivineName>(divineNames[0]);
  const [deckMode, setDeckMode] = useState<BottomStickyDeckMode>('idle');
  const goldGradient = brandGradients.gold[isDark ? 'dark' : 'light'];
  const namesMedia = useApprovedNamesMedia();

  const filtered = useMemo(() => findName(query), [query]);
  // Pad odd counts so the last tile keeps half width instead of stretching.
  const gridData = useMemo<(DivineName | null)[]>(
    () => (filtered.length % 2 ? [...filtered, null] : filtered),
    [filtered],
  );

  const selectName = (item: DivineName) => {
    setSelected(item);
    setDeckMode('idle');
  };

  const badgeLabel =
    filtered.length === 99 ? `Listen ${LISTEN_CTA_LABEL.toLowerCase()}` : `${filtered.length} found`;

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
              {filtered.length === 99 ? LISTEN_CTA_LABEL : String(filtered.length)}
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
          <View style={{ height: deckMode === 'idle' ? stickyBottom + 96 : namesListPadBottom }} />
        }
        renderItem={({ item }) => {
          if (!item) return <View style={styles.spacerTile} />;
          const active = item.number === selected.number;
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
                <View style={styles.audioSpacer} />
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
        onListen={() => setDeckMode((prev) => (prev === 'listen' ? 'idle' : 'listen'))}
        onReadNarrations={() =>
          setDeckMode((prev) => (prev === 'read' ? 'idle' : 'read'))
        }
      />
    </View>
  );
}

function NamesDisclaimer() {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.disclaimer,
        {
          backgroundColor: isDark ? alpha(colors.gold, 0.16) : colors.goldSoft,
          borderColor: colors.gold,
        },
      ]}
      accessibilityRole="summary"
      accessibilityLabel={`${THE_NAMES_SERIES.disclaimerTitle}. ${THE_NAMES_SERIES.disclaimerLead} ${THE_NAMES_SERIES.disclaimerParagraphs.join(' ')}`}
    >
      <View style={styles.disclaimerHead}>
        <AlertTriangle size={16} color={colors.gold} />
        <Overline color={colors.gold}>{THE_NAMES_SERIES.disclaimerTitle}</Overline>
      </View>
      <BodyStrong color={colors.ink} style={styles.disclaimerLead}>
        {THE_NAMES_SERIES.disclaimerLead}
      </BodyStrong>
      {THE_NAMES_SERIES.disclaimerParagraphs.map((paragraph) => (
        <Body key={paragraph.slice(0, 32)} color={colors.ink} style={styles.disclaimerBody}>
          {paragraph}
        </Body>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBar: {
    gap: 10,
    paddingBottom: 6,
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
    gap: 8,
    marginBottom: 10,
  },
  disclaimerHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  disclaimerLead: { fontSize: 13, lineHeight: 19 },
  disclaimerBody: { fontSize: 13, lineHeight: 20 },
});
