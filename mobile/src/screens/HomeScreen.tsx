import {
  BookOpen,
  Clock,
  Flame,
  Heart,
  Headphones,
  Library,
  Search,
  SlidersHorizontal,
  Sparkles,
  Users,
} from 'lucide-react-native';
import { useMemo, useState, type ComponentType } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import ModeToggle from '../components/ModeToggle';
import {
  continueListening,
  dailyVerse,
  homeMetrics,
  quickAccess,
  type HomeMetric,
  type MediaFilter,
  type QuickAccessItem,
} from '../data/mockHome';
import { palette } from '../theme/tokens';

const metricIcon: Record<HomeMetric['id'], ComponentType<{ size: number; color: string }>> = {
  listened: Headphones,
  streak: Flame,
  favorites: Heart,
  hours: Clock,
};

const accessIcon: Record<QuickAccessItem['id'], ComponentType<{ size: number; color: string }>> = {
  'qisas-al-anbiya': BookOpen,
  'seerah-shamail': Sparkles,
  sahabah: Users,
  gleanings: Library,
};

const accessTint: Record<QuickAccessItem['id'], string> = {
  'qisas-al-anbiya': palette.standard.emerald,
  'seerah-shamail': palette.standard.gold,
  sahabah: '#0F766E',
  gleanings: '#CA8A04',
};

const filters: { id: MediaFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'audio', label: 'Audio' },
  { id: 'text', label: 'Text' },
];

export default function HomeScreen() {
  const [query, setQuery] = useState('');
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>('all');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filterHint = useMemo(() => {
    const q = query.trim();
    if (!q && mediaFilter === 'all') return 'Search stories, figures, and sources';
    if (q) return `Searching “${q}” · ${mediaFilter}`;
    return `Filter · ${mediaFilter}`;
  }, [query, mediaFilter]);

  return (
    <View className="flex-1 bg-paper">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-5 flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-sm text-muted">Assalamu Alaikum</Text>
            <Text className="mt-1 text-2xl font-bold text-ink">Peace upon you</Text>
            <Text className="mt-0.5 text-right text-base text-muted">السلام عليكم</Text>
          </View>
          <ModeToggle />
        </View>

        <View className="mb-5 rounded-3xl bg-emerald p-4">
          <Text className="text-xs font-semibold uppercase tracking-wide text-emerald-light">
            Daily verse
          </Text>
          <Text className="mt-2 text-lg font-semibold leading-7 text-paper">
            {dailyVerse.textEn}
          </Text>
          <Text className="mt-1 text-right text-xl leading-8 text-gold-soft">
            {dailyVerse.textAr}
          </Text>
          <Text className="mt-2 text-xs text-emerald-light">{dailyVerse.source}</Text>
        </View>

        <View className="mb-3 flex-row items-center rounded-2xl bg-card px-3 py-2">
          <Search size={18} color={palette.standard.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={filterHint}
            placeholderTextColor={palette.standard.muted}
            className="ml-2 flex-1 py-2 text-base text-ink"
            accessibilityLabel="Search stories"
          />
          <Pressable
            onPress={() => setFiltersOpen((open) => !open)}
            className="rounded-full bg-emerald-light p-2"
            accessibilityRole="button"
            accessibilityLabel="Toggle search filters"
          >
            <SlidersHorizontal size={16} color={palette.standard.emerald} />
          </Pressable>
        </View>

        {filtersOpen ? (
          <View className="mb-5 flex-row gap-2">
            {filters.map((filter) => {
              const active = mediaFilter === filter.id;
              return (
                <Pressable
                  key={filter.id}
                  onPress={() => setMediaFilter(filter.id)}
                  className={`rounded-full px-3 py-1.5 ${active ? 'bg-emerald' : 'bg-emerald-light'}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text className={`text-xs font-semibold ${active ? 'text-paper' : 'text-emerald'}`}>
                    {filter.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View className="mb-5" />
        )}

        <Text className="mb-3 text-sm font-semibold text-ink">Your listening</Text>
        <View className="mb-6 flex-row flex-wrap justify-between gap-y-3">
          {homeMetrics.map((metric) => {
            const Icon = metricIcon[metric.id];
            return (
              <View key={metric.id} className="w-[48%] rounded-2xl bg-card p-4">
                <Icon size={18} color={palette.standard.gold} />
                <Text className="mt-3 text-2xl font-bold text-ink">{metric.value}</Text>
                <Text className="mt-1 text-xs text-muted">{metric.label}</Text>
              </View>
            );
          })}
        </View>

        <Text className="mb-3 text-sm font-semibold text-ink">Quick access</Text>
        <View className="mb-6 flex-row flex-wrap justify-between gap-y-3">
          {quickAccess.map((item) => {
            const Icon = accessIcon[item.id];
            return (
              <Pressable
                key={item.id}
                className="w-[48%] rounded-2xl bg-card p-4"
                accessibilityRole="button"
                accessibilityLabel={item.title}
              >
                <View
                  className="mb-3 h-9 w-9 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${accessTint[item.id]}22` }}
                >
                  <Icon size={18} color={accessTint[item.id]} />
                </View>
                <Text className="text-base font-bold text-ink">{item.title}</Text>
                <Text className="mt-0.5 text-xs text-muted">{item.subtitle}</Text>
                <Text className="mt-2 text-xs font-semibold text-emerald">{item.count}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text className="mb-3 text-sm font-semibold text-ink">Continue listening</Text>
        <Pressable
          className="rounded-3xl bg-ink p-4"
          accessibilityRole="button"
          accessibilityLabel={`Continue ${continueListening.title}`}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-base font-bold text-paper">{continueListening.title}</Text>
              <Text className="mt-0.5 text-right text-sm text-gold-soft">
                {continueListening.titleAr}
              </Text>
              <Text className="mt-2 text-xs text-muted">{continueListening.figureName}</Text>
            </View>
            <View className="h-11 w-11 items-center justify-center rounded-full bg-emerald">
              <Headphones size={18} color={palette.standard.paper} />
            </View>
          </View>
          <View className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
            <View
              className="h-1.5 rounded-full bg-gold"
              style={{ width: `${continueListening.progress * 100}%` }}
            />
          </View>
          <Text className="mt-2 text-xs text-gold-soft">{continueListening.remainingLabel}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
