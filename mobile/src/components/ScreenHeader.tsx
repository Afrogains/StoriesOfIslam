import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import ModeToggle from './ModeToggle';
import { ArabicInline, Display, Overline, Small, useTheme } from './ui';

/**
 * Shared screen header. Keeps the eyebrow → title → support-line rhythm
 * identical on every tab so the app reads as one product.
 */
export default function ScreenHeader({
  eyebrow,
  title,
  subtitle,
  arabic,
  arabicColor,
  trailing,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  arabic?: string;
  arabicColor?: string;
  /** Replaces the default mode toggle when a screen needs its own control. */
  trailing?: ReactNode;
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.header}>
      <View style={styles.text}>
        <Overline>{eyebrow}</Overline>
        <Display style={styles.title}>{title}</Display>
        {arabic ? (
          <ArabicInline color={arabicColor ?? colors.gold} align="left" style={styles.arabic}>
            {arabic}
          </ArabicInline>
        ) : null}
        {subtitle ? <Small style={styles.subtitle}>{subtitle}</Small> : null}
      </View>

      {trailing ?? <ModeToggle />}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
    gap: 12,
  },
  text: { flex: 1 },
  title: { marginTop: 2 },
  arabic: { marginTop: 2 },
  subtitle: { marginTop: 4 },
});
