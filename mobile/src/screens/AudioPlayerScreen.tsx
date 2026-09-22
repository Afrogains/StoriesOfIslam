import { BookOpen } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import SynchronizedAudioReader from '../components/SynchronizedAudioReader';
import { toReaderStory } from '../data/storyAdapters';
import type { StoryItem } from '../types/catalog';
import { radius, sectionAccent, shadow } from '../theme/tokens';
import { Caption, useTheme } from '../components/ui';

type AudioPlayerScreenProps = {
  story: StoryItem;
  onClose: () => void;
  onSwitchToReading: () => void;
};

/**
 * Listening mode surface — dual-host synchronized player plus a control to
 * jump back into full-text reading. Playback position is persisted by
 * SynchronizedAudioReader via AsyncStorage (`stories.progress.*`).
 */
export default function AudioPlayerScreen({
  story,
  onClose,
  onSwitchToReading,
}: AudioPlayerScreenProps) {
  const { isDark } = useTheme();
  const accent = sectionAccent(story.sectionSlug, isDark);

  return (
    <View style={styles.screen}>
      <SynchronizedAudioReader
        story={toReaderStory(story)}
        sectionSlug={story.sectionSlug}
        initiallyExpanded
        onClose={onClose}
      />

      <Pressable
        onPress={onSwitchToReading}
        accessibilityRole="button"
        accessibilityLabel="Switch to reading mode"
        style={[styles.switchBtn, { backgroundColor: accent.primary }, shadow('md', isDark)]}
      >
        <BookOpen size={16} color="#FFFFFF" />
        <Caption color="#FFFFFF" style={styles.switchLabel}>
          Switch to Reading Mode
        </Caption>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  switchBtn: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 96,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: radius.pill,
  },
  switchLabel: { fontWeight: '800' },
});
