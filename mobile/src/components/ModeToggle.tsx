import { Baby, BookOpen } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { useAppMode } from '../hooks/useAppMode';
import { palette } from '../theme/tokens';

export default function ModeToggle() {
  const { mode, setMode, isKids } = useAppMode();

  return (
    <View
      className={`flex-row rounded-full p-1 ${isKids ? 'bg-white' : 'bg-emerald-light'}`}
      accessibilityRole="tablist"
      accessibilityLabel="App mode"
    >
      <Pressable
        onPress={() => setMode('standard')}
        className={`flex-row items-center gap-1 rounded-full px-3 py-1.5 ${
          mode === 'standard' ? 'bg-emerald' : ''
        }`}
        accessibilityRole="tab"
        accessibilityState={{ selected: mode === 'standard' }}
        accessibilityLabel="Standard mode"
      >
        <BookOpen
          size={14}
          color={mode === 'standard' ? '#FFFCF6' : palette.standard.emerald}
        />
        <Text
          className={`text-xs font-semibold ${
            mode === 'standard' ? 'text-paper' : 'text-emerald'
          }`}
        >
          Standard
        </Text>
      </Pressable>
      <Pressable
        onPress={() => setMode('kids')}
        className={`flex-row items-center gap-1 rounded-full px-3 py-1.5 ${
          mode === 'kids' ? 'bg-kids-sunset' : ''
        }`}
        accessibilityRole="tab"
        accessibilityState={{ selected: mode === 'kids' }}
        accessibilityLabel="Kids mode"
      >
        <Baby size={14} color={mode === 'kids' ? '#FFF7ED' : palette.kids.sunset} />
        <Text
          className={`text-xs font-semibold ${
            mode === 'kids' ? 'text-kids-cream' : 'text-kids-sunset'
          }`}
        >
          Kids
        </Text>
      </Pressable>
    </View>
  );
}
