import { Modal } from 'react-native';
import { useEffect } from 'react';
import AudioPlayerScreen from '../screens/AudioPlayerScreen';
import ReaderScreen from '../screens/ReaderScreen';
import { markLastActiveStory } from '../hooks/useLastActiveStory';
import type { StoryItem } from '../types/catalog';

export type StorySessionMode = 'read' | 'listen' | null;

type StorySessionModalProps = {
  story: StoryItem | null;
  mode: StorySessionMode;
  onChangeMode: (mode: StorySessionMode) => void;
};

/** Shared read/listen session host for Home, Explore, and Library. */
export default function StorySessionModal({ story, mode, onChangeMode }: StorySessionModalProps) {
  useEffect(() => {
    if (story && mode) void markLastActiveStory(story.id);
  }, [story, mode]);

  if (!story || !mode) return null;

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => onChangeMode(null)}
    >
      {mode === 'read' ? (
        <ReaderScreen
          story={story}
          onClose={() => onChangeMode(null)}
          onSwitchToListening={() => onChangeMode('listen')}
        />
      ) : (
        <AudioPlayerScreen
          story={story}
          onClose={() => onChangeMode(null)}
          onSwitchToReading={() => onChangeMode('read')}
        />
      )}
    </Modal>
  );
}
