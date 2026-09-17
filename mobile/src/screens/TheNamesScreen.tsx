import { LinearGradient } from 'expo-linear-gradient';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Search,
  Sparkles,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import NamesAudioPlayer from '../components/NamesAudioPlayer';
import ScreenHeader from '../components/ScreenHeader';
import {
  ArabicInline,
  Badge,
  Body,
  BodyStrong,
  Caption,
  Card,
  Display,
  IconBubble,
  Overline,
  Row,
  Small,
  Title,
  useTheme,
} from '../components/ui';
import {
  THE_NAMES_SERIES,
  divineNames,
  findName,
  type DivineName,
} from '../data/theNames';
import {
  audioForName,
  nameAudioByNumber,
  namesWithAudioCount,
} from '../data/theNamesAudio';
import { alpha, brandGradients, radius, shadow } from '../theme/tokens';

export default function TheNamesScreen() {
  const { colors, isDark } = useTheme();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<DivineName>(divineNames[0]);
  const goldGradient = brandGradients.gold[isDark ? 'dark' : 'light'];
  const selectedAudio = useMemo(
    () => audioForName(selected.number),
    [selected.number],
  );
  const audioCount = namesWithAudioCount();

  const filtered = useMemo(() => findName(query), [query]);

  const goRelative = (delta: number) => {
    const next = divineNames.find((item) => item.number === selected.number + delta);
    if (next) setSelected(next);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.paper }]}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.number)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <ScreenHeader
              eyebrow="Asma’ul Husna"
              title="The Names"
              arabic="الأسماء الحسنى"
              subtitle="Ninety-nine beautiful names of Allah with clear meanings"
            />

            <LinearGradient
              colors={brandGradients.night[isDark ? 'dark' : 'light']}
              style={[styles.seriesCard, shadow('md', isDark)]}
            >
              <Row gap={8}>
                <Sparkles size={14} color="#FDE68A" />
                <Overline color="#FDE68A">Learning series</Overline>
              </Row>
              <Title color="#FFFFFF" style={styles.seriesTitle}>
                {THE_NAMES_SERIES.credit}
              </Title>
              <Small color="#D6D3D1" style={styles.seriesBody}>
                {THE_NAMES_SERIES.description} Listen to Shaykh Mikaeel Smith’s
                official episodes in-app — playback continues when minimized.
                Named scholar references are for learning attribution only —
                never voice impersonation or endorsement.
              </Small>
            </LinearGradient>

            <Card style={styles.detailCard} padding={20}>
              <Row justify="space-between" align="center">
                <Badge label={`Name ${selected.number} of 99`} color={colors.gold} />
                <Row gap={8}>
                  <Pressable
                    onPress={() => goRelative(-1)}
                    disabled={selected.number <= 1}
                    accessibilityRole="button"
                    accessibilityLabel="Previous name"
                    style={({ pressed }) => [
                      styles.navChip,
                      {
                        backgroundColor: colors.cardAlt,
                        opacity: selected.number <= 1 ? 0.35 : pressed ? 0.7 : 1,
                      },
                    ]}
                  >
                    <ChevronLeft size={16} color={colors.ink} />
                  </Pressable>
                  <Pressable
                    onPress={() => goRelative(1)}
                    disabled={selected.number >= 99}
                    accessibilityRole="button"
                    accessibilityLabel="Next name"
                    style={({ pressed }) => [
                      styles.navChip,
                      {
                        backgroundColor: colors.cardAlt,
                        opacity: selected.number >= 99 ? 0.35 : pressed ? 0.7 : 1,
                      },
                    ]}
                  >
                    <ChevronRight size={16} color={colors.ink} />
                  </Pressable>
                </Row>
              </Row>

              <ArabicInline color={colors.gold} style={styles.detailArabic}>
                {selected.arabic}
              </ArabicInline>
              <Display style={styles.detailTranslit}>{selected.transliteration}</Display>
              <BodyStrong color={colors.emerald} style={styles.detailMeaning}>
                {selected.meaning}
              </BodyStrong>
              <Body style={styles.detailReflection}>{selected.reflection}</Body>

              <NamesAudioPlayer name={selected} episode={selectedAudio} />

              <Row gap={8} style={styles.creditRow}>
                <IconBubble icon={BookOpen} color={colors.gold} size={26} rounded={radius.sm} />
                <Caption color={colors.inkMuted} style={styles.creditText}>
                  Companion study: {THE_NAMES_SERIES.credit}. {audioCount} names
                  currently have official podcast audio from Muslim Central.
                </Caption>
              </Row>
            </Card>

            <View
              style={[
                styles.searchBox,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
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
              accessibilityLabel={`${item.transliteration}, ${item.meaning}${hasAudio ? ', has podcast audio' : ''}`}
              style={({ pressed }) => [
                styles.nameRow,
                {
                  backgroundColor: active
                    ? isDark
                      ? alpha(colors.gold, 0.16)
                      : colors.goldSoft
                    : colors.card,
                  borderColor: active ? colors.gold : colors.border,
                  opacity: pressed ? 0.85 : 1,
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
              <View style={styles.nameCopy}>
                <Row justify="space-between" align="center">
                  <BodyStrong>{item.transliteration}</BodyStrong>
                  <Row gap={8} align="center">
                    {hasAudio ? (
                      <Headphones
                        size={14}
                        color={active ? colors.gold : colors.inkSubtle}
                        accessibilityLabel="Has podcast audio"
                      />
                    ) : null}
                    <ArabicInline color={colors.gold} style={styles.rowArabic}>
                      {item.arabic}
                    </ArabicInline>
                  </Row>
                </Row>
                <Small color={colors.inkMuted}>{item.meaning}</Small>
              </View>
            </Pressable>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 18, paddingBottom: 28 },
  headerBlock: { paddingTop: 4, gap: 14, marginBottom: 8 },
  seriesCard: {
    borderRadius: radius.lg,
    padding: 18,
    gap: 8,
  },
  seriesTitle: { marginTop: 4 },
  seriesBody: { lineHeight: 20 },
  detailCard: { gap: 10 },
  detailArabic: { fontSize: 36, lineHeight: 52, textAlign: 'center', marginTop: 8 },
  detailTranslit: { textAlign: 'center' },
  detailMeaning: { textAlign: 'center', fontSize: 17 },
  detailReflection: { textAlign: 'center', lineHeight: 22 },
  creditRow: { marginTop: 8 },
  creditText: { flex: 1, lineHeight: 18 },
  navChip: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  listLabel: { marginTop: 4 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 12,
  },
  numberPill: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameCopy: { flex: 1, gap: 2 },
  rowArabic: { fontSize: 18, lineHeight: 28 },
  separator: { height: 8 },
});
