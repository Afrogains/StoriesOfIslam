import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChevronDown } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { alpha, radius, shadow } from '../theme/tokens';
import { BodyStrong, Caption, useTheme } from './ui';

/** Header row that expands to show its content; the open state survives restarts. */
export default function CollapsiblePanel({
  storageKey,
  title,
  summary,
  icon: Icon,
  tint,
  defaultOpen = false,
  children,
}: {
  storageKey: string;
  title: string;
  summary?: string;
  icon: LucideIcon;
  tint: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const { colors, isDark } = useTheme();
  const [open, setOpen] = useState(defaultOpen);
  const key = `stories.home.panel.${storageKey}`;

  useEffect(() => {
    void AsyncStorage.getItem(key).then((value) => {
      if (value === '1' || value === '0') setOpen(value === '1');
    });
  }, [key]);

  const toggle = () => {
    setOpen((current) => {
      void AsyncStorage.setItem(key, current ? '0' : '1');
      return !current;
    });
  };

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={toggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${title}${summary ? `, ${summary}` : ''}. ${open ? 'Collapse' : 'Expand'}`}
        style={({ pressed }) => [
          styles.header,
          { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
          shadow('sm', isDark),
        ]}
      >
        <View style={[styles.icon, { backgroundColor: alpha(tint, isDark ? 0.2 : 0.12) }]}>
          <Icon size={16} color={tint} strokeWidth={2.25} />
        </View>
        <View style={styles.copy}>
          <BodyStrong numberOfLines={1}>{title}</BodyStrong>
          {summary ? (
            <Caption color={colors.inkMuted} numberOfLines={1}>
              {summary}
            </Caption>
          ) : null}
        </View>
        <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
          <ChevronDown size={18} color={colors.inkMuted} />
        </View>
      </Pressable>
      {open ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 10 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: radius.xl,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  icon: { width: 34, height: 34, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0, gap: 1 },
  body: { marginTop: 10 },
});
