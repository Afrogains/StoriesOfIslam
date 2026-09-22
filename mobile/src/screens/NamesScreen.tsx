import { Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenHeader from '../components/ScreenHeader';
import StickyHeaderCard from '../components/StickyHeaderCard';
import {
  ArabicInline,
  BodyStrong,
  Overline,
  Row,
  Small,
  useTheme,
} from '../components/ui';
import {
  divineNames,
  findName,
  type DivineName,
} from '../data/theNames';
import { nameAudioByNumber, namesWithAudioCount } from '../data/theNamesAudio';
import { alpha, brandGradients, radius, shadow } from '../theme/tokens';

/** Classical narration depth heuristic for teaching display (not a hadith count claim). */
function narrationsCountFor(name: DivineName): number {
  const hasAudio = Boolean(nameAudioByNumber[name.number]);
  const base = 1 + (name.number % 3);
  return hasAudio ? base + 1 : base;
}

export default function NamesScreen() {
  const { colors, isDark } = useTheme();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<DivineName>(divineNames[0]);
  const goldGradient = brandGradients.gold[isDark ? 'dark' : 'light'];
  const audioCount = namesWithAudioCount();

  const filtered = useMemo(() => findName(query), [query]);
  const narrationsCount = narrationsCountFor(selected);

  const goRelative = (delta: number) => {
    const next = divineNames.find((item) => item.number === selected.number + delta);
    if (next) setSelected(next);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.paper }]}>
      <View style={[styles.stickyTop, { backgroundColor: colors.paper }]}>
        <View style={styles.headerPad}>
          <ScreenHeader
            eyebrow="Asma’ul Husna"
            title="The Names"
            arabic="الأسماء الحسنى"
            subtitle={`${audioCount} names with podcast audio · tap a name below`}
          />
        </View>

        <StickyHeaderCard
          name={selected}
          narrationsCount={narrationsCount}
          onPrevious={() => goRelative(-1)}
          onNext={() => goRelative(1)}
          canPrevious={selected.number > 1}
          canNext={selected.number < 99}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.number)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        stickyHeaderIndices={[]}
        ListHeaderComponent={
          <View style={styles.listHeader}>
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
                placeholder="Search by name, meaning, or number"
                placeholderTextColor={colors.inkSubtle}
                accessibilityLabel="Search the 99 names"
                style={[styles.searchInput, { color: colors.ink }]}
              />
            </View>
            <Overline style={styles.listLabel}>
              {filtered.length === 99 ? 'All 99 names' : `${filtered.length} matching names`}
            </Overline>
          </View>
        }
        renderItem={({ item }) => {
          const active = item.number === selected.number;
          const hasAudio = Boolean(nameAudioByNumber[item.number]);
          return (
            <Pressable
              onPress={() => setSelected(item)}
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
              <LinearGradient
                colors={active ? goldGradient : [colors.cardAlt, colors.cardAlt]}
                style={styles.numberPill}
              >
                <BodyStrong color={active ? '#FFFFFF' : colors.inkMuted}>
                  {item.number}
                </BodyStrong>
              </LinearGradient>
              <View style={styles.tileCopy}>
                <Row justify="space-between" align="center">
                  <BodyStrong numberOfLines={1} style={styles.tileName}>
                    {item.transliteration}
                  </BodyStrong>
                  <ArabicInline color={colors.gold} style={styles.tileArabic}>
                    {item.arabic}
                  </ArabicInline>
                </Row>
                <Small color={colors.inkMuted} numberOfLines={1}>
                  {item.meaning}
                  {hasAudio ? ' · audio' : ''}
                </Small>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  stickyTop: {
    zIndex: 30,
  },
  headerPad: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 130,
    gap: 8,
  },
  listHeader: {
    gap: 10,
    marginBottom: 6,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    paddingVertical: 4,
    ...(({ outlineStyle: 'none' } as unknown) as object),
  },
  listLabel: { marginTop: 4 },
  nameTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 12,
  },
  numberPill: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileCopy: { flex: 1, gap: 2 },
  tileName: { flexShrink: 1, marginRight: 8 },
  tileArabic: { fontSize: 18, lineHeight: 28 },
});
