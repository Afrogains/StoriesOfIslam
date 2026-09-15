import { LinearGradient } from 'expo-linear-gradient';
import { Baby, BookOpen, Moon, Sun } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppMode } from '../hooks/useAppMode';
import {
  BODY_FONT_FAMILY,
  alpha,
  brandGradients,
  getColors,
  radius,
  shadow,
  type,
} from '../theme/tokens';

export default function ModeToggle() {
  const { mode, setMode, isKids, isDark, toggleColorScheme } = useAppMode();
  const colors = getColors(isDark, isKids);

  const segments = [
    { id: 'standard' as const, label: 'Standard', icon: BookOpen, gradient: brandGradients.emerald[isDark ? 'dark' : 'light'] },
    { id: 'kids' as const, label: 'Kids', icon: Baby, gradient: brandGradients.kidsSunset },
  ];

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={toggleColorScheme}
        accessibilityRole="switch"
        accessibilityState={{ checked: isDark }}
        accessibilityLabel={`Switch to ${isDark ? 'light' : 'dark'} appearance`}
        style={({ pressed }) => [
          styles.themeSwitch,
          {
            backgroundColor: isDark ? alpha('#FBBF24', 0.14) : alpha('#B45309', 0.1),
            borderColor: isDark ? alpha('#FBBF24', 0.35) : alpha('#B45309', 0.25),
          },
          pressed && styles.pressed,
        ]}
      >
        {isDark ? <Moon size={15} color="#FDE68A" /> : <Sun size={15} color="#B45309" />}
      </Pressable>

      <View
        style={[
          styles.segmentTrack,
          { backgroundColor: colors.subtleBg, borderColor: colors.border },
        ]}
        accessibilityRole="tablist"
        accessibilityLabel="Choose reading mode"
      >
        {segments.map((segment) => {
          const active = mode === segment.id;
          const Icon = segment.icon;
          const labelColor = active ? '#FFFFFF' : colors.inkMuted;

          const content = (
            <>
              <Icon size={13} color={labelColor} />
              <Text
                style={[
                  type.caption,
                  { fontFamily: BODY_FONT_FAMILY, fontWeight: '800', color: labelColor },
                ]}
              >
                {segment.label}
              </Text>
            </>
          );

          return (
            <Pressable
              key={segment.id}
              onPress={() => setMode(segment.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${segment.label} mode`}
              style={({ pressed }) => [pressed && styles.pressed]}
            >
              {active ? (
                <LinearGradient
                  colors={segment.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.segment, shadow('sm', isDark)]}
                >
                  {content}
                </LinearGradient>
              ) : (
                <View style={styles.segment}>{content}</View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pressed: { opacity: 0.7 },
  themeSwitch: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    padding: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  segment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
});
