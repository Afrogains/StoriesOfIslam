import { BookOpen, Pause, Play, Star, Sun } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import ModeToggle from '../components/ModeToggle';
import { kidsStories, lessonOfTheDay, type KidsStoryCard } from '../data/mockHome';
import { palette } from '../theme/tokens';

const tintColor: Record<KidsStoryCard['tint'], string> = {
  sunset: palette.kids.sunset,
  teal: palette.kids.teal,
  sky: palette.kids.sky,
  coral: palette.kids.coral,
};

export default function KidsModeScreen() {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [progress] = useState(0.28);

  const nowPlaying =
    kidsStories.find((story) => story.id === playingId) ?? lessonOfTheDay;
  const isPlaying = playingId != null;

  return (
    <View className="flex-1 bg-kids-cream">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 120 }}
      >
        <View className="mb-4 flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-base text-kids-sunset">Assalamu Alaikum, friend</Text>
            <Text className="mt-1 text-3xl font-extrabold text-kids-ink">Kids Mode</Text>
            <Text className="mt-1 text-base text-kids-ink">Stories that are kind and true</Text>
          </View>
          <ModeToggle />
        </View>

        <View className="mb-5 rounded-[28px] bg-kids-butter p-5">
          <View className="mb-3 flex-row items-center gap-2">
            <Sun size={20} color={palette.kids.sunset} />
            <Text className="text-sm font-bold uppercase tracking-wide text-kids-sunset">
              Lesson of the Day
            </Text>
          </View>
          <Text className="text-2xl font-extrabold leading-8 text-kids-ink">
            {lessonOfTheDay.lesson}
          </Text>
          <Text className="mt-3 text-base leading-7 text-kids-ink">
            From {lessonOfTheDay.title}
          </Text>
        </View>

        {kidsStories.map((story) => {
          const active = playingId === story.id;
          const tint = tintColor[story.tint];
          return (
            <Pressable
              key={story.id}
              onPress={() => setPlayingId(active ? null : story.id)}
              className="mb-4 rounded-[28px] bg-white p-5"
              style={{ borderWidth: 3, borderColor: active ? tint : '#FFEDD5' }}
              accessibilityRole="button"
              accessibilityLabel={`${story.title}. ${story.summary}`}
            >
              <View className="mb-3 flex-row items-center justify-between">
                <View
                  className="h-14 w-14 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${tint}22` }}
                >
                  <Star size={22} color={tint} fill={tint} />
                </View>
                <Pressable
                  onPress={() => setPlayingId(active ? null : story.id)}
                  className="h-14 w-14 items-center justify-center rounded-full"
                  style={{ backgroundColor: tint }}
                  accessibilityRole="button"
                  accessibilityLabel={active ? `Pause ${story.title}` : `Play ${story.title}`}
                >
                  {active ? (
                    <Pause size={22} color="#FFF7ED" fill="#FFF7ED" />
                  ) : (
                    <Play size={22} color="#FFF7ED" fill="#FFF7ED" />
                  )}
                </Pressable>
              </View>
              <Text className="text-2xl font-extrabold text-kids-ink">{story.title}</Text>
              <Text className="mt-1 text-right text-xl text-kids-teal">{story.titleAr}</Text>
              <Text className="mt-2 text-sm font-semibold text-kids-sunset">
                {story.figureName} · {story.durationLabel}
              </Text>
              <Text className="mt-3 text-lg leading-7 text-kids-ink">{story.summary}</Text>
              <View className="mt-4 rounded-2xl bg-kids-cream px-4 py-3">
                <Text className="text-xs font-bold uppercase text-kids-teal">Lesson</Text>
                <Text className="mt-1 text-base font-semibold leading-6 text-kids-ink">
                  {story.lesson}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 bg-kids-teal px-4 pb-5 pt-3">
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => setPlayingId(isPlaying ? null : nowPlaying.id)}
            className="h-12 w-12 items-center justify-center rounded-full bg-white"
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? 'Pause story' : 'Play story'}
          >
            {isPlaying ? (
              <Pause size={20} color={palette.kids.teal} fill={palette.kids.teal} />
            ) : (
              <Play size={20} color={palette.kids.teal} fill={palette.kids.teal} />
            )}
          </Pressable>
          <View className="flex-1">
            <Text className="text-sm font-bold text-white" numberOfLines={1}>
              {nowPlaying.title}
            </Text>
            <View className="mt-2 h-2 overflow-hidden rounded-full bg-white/30">
              <View
                className="h-2 rounded-full bg-kids-butter"
                style={{ width: `${progress * 100}%` }}
              />
            </View>
          </View>
          <BookOpen size={20} color="#FFF7ED" />
        </View>
      </View>
    </View>
  );
}
