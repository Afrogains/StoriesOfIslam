import { Moon, Sun } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';
import { useAppMode } from '../hooks/useAppMode';
import { alpha, getColors, radius } from '../theme/tokens';

/** Smooth light/dark appearance toggle for the navigation header. */
export default function ModeToggle() {
  const { isDark, toggleColorScheme } = useAppMode();
  const colors = getColors(isDark);

  return (
    <Pressable
      onPress={toggleColorScheme}
      accessibilityRole="switch"
      accessibilityState={{ checked: isDark }}
      accessibilityLabel={`Switch to ${isDark ? 'light' : 'dark'} appearance`}
      style={({ pressed }) => [
        styles.themeSwitch,
        {
          backgroundColor: isDark ? alpha('#FBBF24', 0.14) : alpha('#064E3B', 0.1),
          borderColor: isDark ? alpha('#FBBF24', 0.35) : alpha('#064E3B', 0.25),
        },
        pressed && styles.pressed,
      ]}
    >
      {isDark ? <Sun size={16} color="#FDE68A" /> : <Moon size={16} color="#064E3B" />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  themeSwitch: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.82 },
});
