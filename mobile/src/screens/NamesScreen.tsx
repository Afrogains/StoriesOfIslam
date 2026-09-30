import { Headphones, Search } from 'lucide-react-native';
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
  BodyStrong,
  Caption,
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

/** Dense 2-column Names grid with a compact bottom sticky deck. */
export default function NamesScreen() {
  const { colors, isDark } = useTheme();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<DivineName>(divineNames[0]);
  const [deckMode, setDeckMode] = useState<BottomStickyDeckMode>('idle');
  const goldGradient = brandGradients.gold[isDark ? 'dark' : 'light'];
  const audioCount = namesWithAudioCount();

  const filtered = useMemo(() => findName(query), [query]);

  const selectName = (item: DivineName) => {
    setSelected(item);
    setDeckMode('idle');
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.paper }]}>
      <View style={styles.topBar}>
        <ScreenHeader
          eyebrow="Asma’ul Husna"
          title="The Names"
          arabic="الأسماء الحسنى"
        />
        <View
          style={[
            styles.searchBox,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Search size={15} color={colors.inkSubtle} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search names…"
            placeholderTextColor={colors.inkSubtle}
            accessibilityLabel="Search the 99 names"
            style={[styles.searchInput, { color: colors.ink }]}
          />
          <Caption color={colors.inkSubtle}>
            {filtered.length === 99 ? `${audioCount} audio` : `${filtered.length}`}
          </Caption>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.number)}
        numColumns={2}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const active = item.number === selected.number;
          const hasAudio = Boolean(nameAudioByNumber[item.number]);
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
                  <BodyStrong color={active ? '#FFFFFF' : colors.inkMuted} style={styles.numberText}>
                    {item.number}
                  </BodyStrong>
                </LinearGradient>
                {hasAudio ? <Headphones size={12} color={active ? colors.gold : colors.inkSubtle} /> : null}
              </View>
              <ArabicInline color={colors.gold} style={styles.tileArabic} numberOfLines={1}>
                {item.arabic}
              </ArabicInline>
              <BodyStrong numberOfLines={1} style={styles.tileName}>
                {item.transliteration}
              </BodyStrong>
              <Small color={colors.inkMuted} numberOfLines={1}>
                {item.meaning}
              </Small>
            </Pressable>
          );
        }}
      />

      <BottomStickyCard
        name={selected}
        mode={deckMode}
        onListen={() => setDeckMode((prev) => (prev === 'listen' ? 'idle' : 'listen'))}
        onReadNarrations={() =>
          setDeckMode((prev) => (prev === 'read' ? 'idle' : 'read'))
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    paddingVertical: 2,
    ...(({ outlineStyle: 'none' } as unknown) as object),
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 200,
    gap: 8,
  },
  row: {
    gap: 8,
    paddingHorizontal: 4,
  },
  nameTile: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 10,
    gap: 2,
    minHeight: 96,
  },
  tileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  numberPill: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: { fontSize: 11 },
  tileArabic: { fontSize: 18, lineHeight: 26, textAlign: 'right' },
  tileName: { marginTop: 2 },
});
