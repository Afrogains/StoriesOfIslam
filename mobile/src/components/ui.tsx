import { LinearGradient } from 'expo-linear-gradient';
import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useAppMode } from '../hooks/useAppMode';
import {
  BODY_FONT_FAMILY,
  DISPLAY_FONT_FAMILY,
  alpha,
  getColors,
  radius,
  shadow,
  type ThemeColors,
  type,
} from '../theme/tokens';

/** Icons always come from lucide, so alias its own component type. */
type IconType = LucideIcon;

/**
 * `dataSet` is a react-native-web extension used here to hook global CSS
 * (Arabic font stack, tabular numerals) without duplicating it per component.
 */
function webDataSet(data: Record<string, string>) {
  return { dataSet: data } as unknown as { testID?: string };
}

/** Single entry point for theme state — every component below reads from this. */
export function useTheme() {
  const { isDark } = useAppMode();
  const colors = getColors(isDark);
  return { colors, isDark };
}

/* ---------------------------------------------------------------- typography */

type TextProps = {
  children: ReactNode;
  color?: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  align?: TextStyle['textAlign'];
};

function makeText(variant: keyof typeof type, defaultTone: 'ink' | 'inkMuted' | 'inkSubtle') {
  return function Typo({ children, color, style, numberOfLines, align }: TextProps) {
    const { colors } = useTheme();
    const base = type[variant] as TextStyle;
    const isArabic = variant.startsWith('arabic');

    return (
      <Text
        numberOfLines={numberOfLines}
        style={[
          base,
          !isArabic && {
            fontFamily: variant === 'display' || variant === 'title' ? DISPLAY_FONT_FAMILY : BODY_FONT_FAMILY,
          },
          { color: color ?? colors[defaultTone] },
          align ? { textAlign: align } : null,
          style,
        ]}
        {...(isArabic ? { accessibilityLanguage: 'ar', ...webDataSet({ fontArabic: 'true' }) } : null)}
      >
        {children}
      </Text>
    );
  };
}

export const Display = makeText('display', 'ink');
export const Title = makeText('title', 'ink');
export const Heading = makeText('heading', 'ink');
export const Body = makeText('body', 'inkMuted');
export const BodyStrong = makeText('bodyStrong', 'ink');
export const Small = makeText('small', 'inkMuted');
export const Caption = makeText('caption', 'inkSubtle');
export const Overline = makeText('overline', 'inkSubtle');

/** Arabic text at four sizes. Always right-aligned RTL with generous leading. */
export const ArabicDisplay = makeText('arabicDisplay', 'ink');
export const ArabicTitle = makeText('arabicTitle', 'ink');
export const ArabicBody = makeText('arabicBody', 'ink');
export const ArabicInline = makeText('arabicInline', 'ink');

/** Timestamps and durations — tabular figures so digits don't shift width. */
export function Mono({ children, color, style }: TextProps) {
  const { colors } = useTheme();
  return (
    <Text
      {...webDataSet({ tabular: 'true' })}
      style={[type.caption, { fontFamily: BODY_FONT_FAMILY, color: color ?? colors.inkSubtle }, style]}
    >
      {children}
    </Text>
  );
}

/* --------------------------------------------------------------- containers */

export function Card({
  children,
  style,
  tone = 'card',
  padding = 18,
  accent,
  elevation = 'sm',
  onPress,
  accessibilityLabel,
  disabled = false,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  tone?: 'card' | 'cardAlt' | 'paperAlt';
  padding?: number;
  /** Draws a soft accent-tinted border instead of the neutral one. */
  accent?: string;
  elevation?: 'none' | 'sm' | 'md' | 'lg';
  onPress?: () => void;
  accessibilityLabel?: string;
  disabled?: boolean;
}) {
  const { colors, isDark } = useTheme();

  const surface: ViewStyle = {
    backgroundColor: colors[tone] ?? colors.card,
    borderColor: accent && !isDark ? alpha(accent, 0.22) : colors.border,
    borderWidth: 1,
    borderRadius: radius['2xl'],
    padding,
    ...(elevation === 'none' ? {} : shadow(elevation, isDark)),
  };

  if (!onPress) return <View style={[surface, style]}>{children}</View>;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [surface, pressed && styles.pressed, style]}
    >
      {children}
    </Pressable>
  );
}

/* -------------------------------------------------------------------- chips */

export function Badge({
  label,
  color,
  background,
  icon: Icon,
  style,
}: {
  label: string;
  color: string;
  background?: string;
  icon?: IconType;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: background ?? alpha(color, 0.14) },
        style,
      ]}
    >
      {Icon ? <Icon size={11} color={color} /> : null}
      <Text style={[type.overline, { fontFamily: BODY_FONT_FAMILY, color, letterSpacing: 0.7 }]}>
        {label}
      </Text>
    </View>
  );
}

/** Outlined chip for neutral metadata such as authenticity grade. */
export function OutlineBadge({
  label,
  color,
  icon: Icon,
}: {
  label: string;
  color: string;
  icon?: IconType;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.badge, { backgroundColor: colors.cardAlt, borderWidth: 1, borderColor: colors.border }]}>
      {Icon ? <Icon size={11} color={color} /> : null}
      <Text style={[type.overline, { fontFamily: BODY_FONT_FAMILY, color: colors.inkMuted, letterSpacing: 0.7 }]}>
        {label}
      </Text>
    </View>
  );
}

/** Filter chip. Fills with a gradient when selected. */
export function Pill({
  label,
  selected,
  onPress,
  icon: Icon,
  gradient,
  bold,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: IconType;
  gradient: readonly [string, string, ...string[]];
  /** Emphasized chip styling for dense filter rows. */
  bold?: boolean;
}) {
  const { colors } = useTheme();
  const inner = (
    <>
      {Icon ? <Icon size={14} color={selected ? '#FFFFFF' : gradient[0]} /> : null}
      <Text
        style={[
          type.caption,
          {
            fontFamily: BODY_FONT_FAMILY,
            fontWeight: bold ? '800' : '700',
            color: selected ? '#FFFFFF' : colors.ink,
          },
        ]}
      >
        {label}
      </Text>
    </>
  );

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      {selected ? (
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.pill, bold && styles.pillBold, { borderColor: 'transparent' }]}
        >
          {inner}
        </LinearGradient>
      ) : (
        <View
          style={[
            styles.pill,
            bold && styles.pillBold,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {inner}
        </View>
      )}
    </Pressable>
  );
}

/* ------------------------------------------------------------------ actions */

export function GradientButton({
  label,
  onPress,
  gradient,
  icon: Icon,
  size = 'md',
  textColor = '#FFFFFF',
  style,
  accessibilityLabel,
  disabled,
}: {
  label: string;
  onPress?: () => void;
  gradient: readonly [string, string, ...string[]];
  icon?: IconType;
  size?: 'sm' | 'md' | 'lg';
  textColor?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  disabled?: boolean;
}) {
  const { isDark } = useTheme();
  const metrics = {
    sm: { paddingVertical: 7, paddingHorizontal: 14, fontSize: 11, iconSize: 12 },
    md: { paddingVertical: 11, paddingHorizontal: 18, fontSize: 13, iconSize: 15 },
    lg: { paddingVertical: 14, paddingHorizontal: 22, fontSize: 14, iconSize: 17 },
  }[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [pressed && styles.pressed, disabled && styles.disabled, style]}
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradientButton,
          {
            paddingVertical: metrics.paddingVertical,
            paddingHorizontal: metrics.paddingHorizontal,
          },
          shadow('sm', isDark),
        ]}
      >
        {Icon ? <Icon size={metrics.iconSize} color={textColor} fill={textColor} /> : null}
        <Text
          style={{
            fontFamily: BODY_FONT_FAMILY,
            fontSize: metrics.fontSize,
            fontWeight: '800',
            color: textColor,
            letterSpacing: 0.1,
          }}
        >
          {label}
        </Text>
      </LinearGradient>
    </Pressable>
  );
}

/** Outlined text/icon CTA used alongside GradientButton (e.g. Read Story). */
export function OutlineButton({
  label,
  onPress,
  icon: Icon,
  accessibilityLabel,
  disabled,
}: {
  label: string;
  onPress?: () => void;
  icon?: IconType;
  accessibilityLabel?: string;
  disabled?: boolean;
}) {
  const { colors, isDark } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.outlineButton,
        {
          borderColor: colors.border,
          backgroundColor: isDark ? colors.cardAlt : colors.card,
        },
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {Icon ? <Icon size={14} color={colors.emerald} /> : null}
      <Text
        style={{
          fontFamily: BODY_FONT_FAMILY,
          fontSize: 12,
          fontWeight: '800',
          color: colors.ink,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** Circular gradient play/pause control. */
export function PlayButton({
  playing,
  onPress,
  gradient,
  size = 46,
  icons,
  accessibilityLabel,
  disabled = false,
}: {
  playing: boolean;
  onPress: () => void;
  gradient: readonly [string, string, ...string[]];
  size?: number;
  icons: { play: IconType; pause: IconType };
  accessibilityLabel?: string;
  disabled?: boolean;
}) {
  const { isDark } = useTheme();
  const Icon = playing ? icons.pause : icons.play;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (playing ? 'Pause' : 'Play')}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [pressed && styles.pressed, disabled && styles.disabled]}
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            alignItems: 'center',
            justifyContent: 'center',
          },
          shadow('md', isDark),
        ]}
      >
        <Icon size={size * 0.44} color="#FFFFFF" fill="#FFFFFF" />
      </LinearGradient>
    </Pressable>
  );
}

/* -------------------------------------------------------------- decorations */

/** Rounded icon tile with a tinted backdrop. */
export function IconBubble({
  icon: Icon,
  color,
  background,
  size = 40,
  iconSize,
  rounded = radius.md,
}: {
  icon: IconType;
  color: string;
  background?: string;
  size?: number;
  iconSize?: number;
  rounded?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: rounded,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: background ?? alpha(color, 0.13),
      }}
    >
      <Icon size={iconSize ?? size * 0.5} color={color} />
    </View>
  );
}

export function SectionHeading({
  label,
  trailing,
  onTrailingPress,
  trailingColor,
}: {
  label: string;
  trailing?: string;
  onTrailingPress?: () => void;
  trailingColor?: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.sectionHeading}>
      <Text style={[type.overline, { fontFamily: BODY_FONT_FAMILY, color: colors.inkSubtle }]}>
        {label}
      </Text>
      {trailing ? (
        <Pressable onPress={onTrailingPress} disabled={!onTrailingPress} accessibilityRole={onTrailingPress ? 'button' : undefined}>
          <Text
            style={[
              type.caption,
              { fontFamily: BODY_FONT_FAMILY, fontWeight: '700', color: trailingColor ?? colors.inkMuted },
            ]}
          >
            {trailing}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function ProgressBar({
  value,
  color,
  trackColor,
  height = 6,
  gradient,
}: {
  /** 0 – 1 */
  value: number;
  color?: string;
  trackColor?: string;
  height?: number;
  gradient?: readonly [string, string, ...string[]];
}) {
  const { colors } = useTheme();
  const pct = `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%` as const;

  return (
    <View
      style={{
        height,
        borderRadius: height,
        backgroundColor: trackColor ?? colors.trackBg,
        overflow: 'hidden',
      }}
      accessibilityRole="progressbar"
      accessibilityValue={{ now: Math.round(value * 100), min: 0, max: 100 }}
    >
      {gradient ? (
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ height, width: pct, borderRadius: height }}
        />
      ) : (
        <View style={{ height, width: pct, borderRadius: height, backgroundColor: color ?? colors.emerald }} />
      )}
    </View>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return <View style={[{ height: 1, backgroundColor: colors.border }, style]} />;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  gradient,
}: {
  icon: IconType;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  gradient: readonly [string, string, ...string[]];
}) {
  const { colors } = useTheme();
  return (
    <Card style={styles.emptyState} padding={28}>
      <IconBubble icon={Icon} color={colors.inkSubtle} background={colors.subtleBg} size={52} rounded={radius.xl} />
      <Heading style={{ marginTop: 14, textAlign: 'center' }}>{title}</Heading>
      <Small style={{ marginTop: 6, textAlign: 'center' }}>{description}</Small>
      {actionLabel && onAction ? (
        <GradientButton label={actionLabel} onPress={onAction} gradient={gradient} size="sm" style={{ marginTop: 16 }} />
      ) : null}
    </Card>
  );
}

/* -------------------------------------------------------------------- utils */

export function Row({
  children,
  gap = 8,
  style,
  align = 'center',
  justify,
}: {
  children: ReactNode;
  gap?: number;
  style?: StyleProp<ViewStyle>;
  align?: ViewStyle['alignItems'];
  justify?: ViewStyle['justifyContent'];
}) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: align, justifyContent: justify, gap }, style]}>
      {children}
    </View>
  );
}

export type { IconType, ThemeColors };

const styles = StyleSheet.create({
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.5 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  pillBold: { borderWidth: 2, paddingVertical: 9 },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: radius.pill,
  },
  outlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: 9,
    paddingHorizontal: 12,
    minHeight: 40,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  emptyState: { alignItems: 'center', marginVertical: 24 },
});
