import { Platform } from 'react-native';

export const ARABIC_FONT_FAMILY =
  Platform.OS === 'web' ? 'KFGQPC_uthmanic_script_hafs_r_regular' : 'UthmanicHafs';

/**
 * Web loads Plus Jakarta Sans / Inter via global.css. Native falls back to the
 * platform UI face so the app never renders in a mismatched system serif.
 */
export const DISPLAY_FONT_FAMILY =
  Platform.OS === 'web' ? 'Plus Jakarta Sans, Inter, system-ui, sans-serif' : 'PlusJakartaSans';

export const BODY_FONT_FAMILY =
  Platform.OS === 'web' ? 'Inter, system-ui, sans-serif' : 'Inter';

export type ColorScheme = 'light' | 'dark';
export type SectionSlug = 'qisas-al-anbiya' | 'seerah-shamail' | 'sahabah' | 'gleanings';

/**
 * Typography scale. Arabic sizes are deliberately larger than their Latin
 * counterparts with roomier line boxes — Uthmanic script carries tashkeel above
 * and below the baseline and clips at tight leading.
 */
export const type = {
  display: { fontSize: 26, lineHeight: 32, fontWeight: '800' as const, letterSpacing: -0.6 },
  title: { fontSize: 20, lineHeight: 26, fontWeight: '800' as const, letterSpacing: -0.4 },
  heading: { fontSize: 16, lineHeight: 22, fontWeight: '700' as const, letterSpacing: -0.2 },
  body: { fontSize: 14, lineHeight: 22, fontWeight: '400' as const },
  bodyStrong: { fontSize: 14, lineHeight: 22, fontWeight: '600' as const },
  small: { fontSize: 12, lineHeight: 18, fontWeight: '500' as const },
  caption: { fontSize: 11, lineHeight: 16, fontWeight: '600' as const },
  overline: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '800' as const,
    letterSpacing: 1.1,
    textTransform: 'uppercase' as const,
  },
  arabicDisplay: {
    fontFamily: ARABIC_FONT_FAMILY,
    fontSize: 24,
    lineHeight: 46,
    textAlign: 'right' as const,
    writingDirection: 'rtl' as const,
  },
  arabicTitle: {
    fontFamily: ARABIC_FONT_FAMILY,
    fontSize: 19,
    lineHeight: 38,
    textAlign: 'right' as const,
    writingDirection: 'rtl' as const,
  },
  arabicBody: {
    fontFamily: ARABIC_FONT_FAMILY,
    fontSize: 16,
    lineHeight: 34,
    textAlign: 'right' as const,
    writingDirection: 'rtl' as const,
  },
  arabicInline: {
    fontFamily: ARABIC_FONT_FAMILY,
    fontSize: 14,
    lineHeight: 28,
    writingDirection: 'rtl' as const,
  },
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  '2xl': 26,
  '3xl': 32,
  pill: 999,
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
} as const;

export function shadow(level: 'sm' | 'md' | 'lg', isDark: boolean) {
  const opacity = isDark ? { sm: 0.4, md: 0.5, lg: 0.6 } : { sm: 0.05, md: 0.08, lg: 0.14 };
  const config = {
    sm: { height: 1, radius: 3, elevation: 1 },
    md: { height: 4, radius: 10, elevation: 4 },
    lg: { height: 10, radius: 24, elevation: 10 },
  }[level];

  return {
    shadowColor: isDark ? '#000000' : '#1C1917',
    shadowOffset: { width: 0, height: config.height },
    shadowOpacity: opacity[level],
    shadowRadius: config.radius,
    elevation: config.elevation,
  };
}

export const sectionGradients: Record<
  SectionSlug,
  { light: readonly [string, string, string]; dark: readonly [string, string, string] }
> = {
  'qisas-al-anbiya': {
    light: ['#0F766E', '#115E59', '#042F2C'],
    dark: ['#14B8A6', '#0F766E', '#0D2D29'],
  },
  'seerah-shamail': {
    light: ['#D97706', '#B45309', '#78350F'],
    dark: ['#F59E0B', '#D97706', '#3A1D00'],
  },
  sahabah: {
    light: ['#0284C7', '#0369A1', '#0C4A6E'],
    dark: ['#38BDF8', '#0284C7', '#082F49'],
  },
  gleanings: {
    light: ['#EA580C', '#C2410C', '#7C2D12'],
    dark: ['#FB923C', '#EA580C', '#431407'],
  },
};

/** Two-stop gradients for compact surfaces: pills, buttons, avatars. */
export const accentGradients: Record<SectionSlug, { light: readonly [string, string]; dark: readonly [string, string] }> = {
  'qisas-al-anbiya': { light: ['#0F766E', '#115E59'], dark: ['#2DD4BF', '#0F766E'] },
  'seerah-shamail': { light: ['#D97706', '#B45309'], dark: ['#FBBF24', '#D97706'] },
  sahabah: { light: ['#0284C7', '#0369A1'], dark: ['#38BDF8', '#0284C7'] },
  gleanings: { light: ['#EA580C', '#C2410C'], dark: ['#FB923C', '#EA580C'] },
};

export const kidsGradients: Record<SectionSlug, readonly [string, string]> = {
  'qisas-al-anbiya': ['#F97316', '#FB7185'],
  'seerah-shamail': ['#FBBF24', '#F59E0B'],
  sahabah: ['#38BDF8', '#0284C7'],
  gleanings: ['#0D9488', '#10B981'],
};

/** Shared app-level gradients keyed by intent rather than by section. */
export const brandGradients = {
  emerald: { light: ['#064E3B', '#047857'] as const, dark: ['#10B981', '#064E3B'] as const },
  gold: { light: ['#D97706', '#B45309'] as const, dark: ['#FBBF24', '#D97706'] as const },
  night: { light: ['#1C1917', '#0F172A', '#020617'] as const, dark: ['#121C19', '#0B1220', '#020617'] as const },
  verse: {
    light: ['#0F766E', '#115E59', '#042F2C'] as const,
    dark: ['#0D2D29', '#115E59', '#042F2C'] as const,
  },
  kidsSunset: ['#EA580C', '#FB7185'] as const,
  kidsGold: { light: ['#FEF08A', '#FDE047'] as const, dark: ['#3A1D00', '#2A1506'] as const },
} as const;

/**
 * Every theme implements the same token set, so screens can read any token
 * without narrowing on the active mode.
 */
export type ThemeColors = {
  paper: string;
  paperAlt: string;
  card: string;
  cardAlt: string;
  border: string;
  borderSoft: string;
  ink: string;
  inkMuted: string;
  inkSubtle: string;
  gold: string;
  goldSoft: string;
  goldDark: string;
  emerald: string;
  emeraldLight: string;
  emeraldBg: string;
  azure: string;
  azureLight: string;
  azureBg: string;
  terracotta: string;
  terracottaLight: string;
  terracottaBg: string;
  sunset: string;
  coral: string;
  teal: string;
  sky: string;
  yellow: string;
  purple: string;
  mint: string;
  navBg: string;
  navBorder: string;
  /** Neutral chip / track surface. */
  subtleBg: string;
  trackBg: string;
  scrim: string;
};

const lightColors: ThemeColors = {
  paper: '#FCFBF7',
  paperAlt: '#F7F4EC',
  card: '#FFFFFF',
  cardAlt: '#FBF9F3',
  border: '#E2D9C8',
  borderSoft: '#F0EAD8',
  ink: '#0F172A',
  inkMuted: '#475569',
  inkSubtle: '#64748B',
  gold: '#B45309',
  goldSoft: '#FEF3C7',
  goldDark: '#78350F',
  emerald: '#064E3B',
  emeraldLight: '#D1FAE5',
  emeraldBg: '#ECFDF5',
  azure: '#0284C7',
  azureLight: '#E0F2FE',
  azureBg: '#F0F9FF',
  terracotta: '#C2410C',
  terracottaLight: '#FFEDD5',
  terracottaBg: '#FFF7ED',
  sunset: '#EA580C',
  coral: '#E11D48',
  teal: '#0D9488',
  sky: '#0284C7',
  yellow: '#D97706',
  purple: '#9333EA',
  mint: '#059669',
  navBg: '#FFFFFF',
  navBorder: '#E2D9C8',
  subtleBg: '#F1F5F9',
  trackBg: '#E7E5E4',
  scrim: 'rgba(28, 25, 23, 0.55)',
};

const darkColors: ThemeColors = {
  paper: '#0F172A',
  paperAlt: '#0B1220',
  card: '#11201B',
  cardAlt: '#143028',
  border: '#1E3A32',
  borderSoft: '#172A24',
  ink: '#F8FAFC',
  inkMuted: '#CBD5E1',
  inkSubtle: '#94A3B8',
  gold: '#F59E0B',
  goldSoft: '#78350F',
  goldDark: '#FDE68A',
  emerald: '#10B981',
  emeraldLight: '#064E3B',
  emeraldBg: '#022C22',
  azure: '#38BDF8',
  azureLight: '#0369A1',
  azureBg: '#082F49',
  terracotta: '#FB923C',
  terracottaLight: '#9A3412',
  terracottaBg: '#431407',
  sunset: '#FB923C',
  coral: '#FDA4AF',
  teal: '#2DD4BF',
  sky: '#38BDF8',
  yellow: '#FBBF24',
  purple: '#C084FC',
  mint: '#34D399',
  navBg: '#0B1220',
  navBorder: '#1E3A32',
  subtleBg: '#143028',
  trackBg: '#1E3A32',
  scrim: 'rgba(2, 6, 23, 0.72)',
};

const kidsLightColors: ThemeColors = {
  paper: '#FFF8F0',
  paperAlt: '#FFF1E3',
  card: '#FFFFFF',
  cardAlt: '#FFF7ED',
  border: '#FED7AA',
  borderSoft: '#FFEDD5',
  ink: '#3B1808',
  inkMuted: '#854D0E',
  inkSubtle: '#A16207',
  gold: '#D97706',
  goldSoft: '#FEF3C7',
  goldDark: '#78350F',
  emerald: '#0D9488',
  emeraldLight: '#CCFBF1',
  emeraldBg: '#F0FDFA',
  azure: '#0284C7',
  azureLight: '#E0F2FE',
  azureBg: '#F0F9FF',
  terracotta: '#EA580C',
  terracottaLight: '#FFEDD5',
  terracottaBg: '#FFF7ED',
  sunset: '#EA580C',
  coral: '#E11D48',
  teal: '#0D9488',
  sky: '#0284C7',
  yellow: '#D97706',
  purple: '#9333EA',
  mint: '#059669',
  navBg: '#FFFFFF',
  navBorder: '#FFEDD5',
  subtleBg: '#FFF1E3',
  trackBg: '#FFE4CC',
  scrim: 'rgba(59, 24, 8, 0.5)',
};

const kidsDarkColors: ThemeColors = {
  paper: '#1A0C02',
  paperAlt: '#210E04',
  card: '#2A1506',
  cardAlt: '#331A08',
  border: '#431D0A',
  borderSoft: '#3A1808',
  ink: '#FFEDD5',
  inkMuted: '#FDBA74',
  inkSubtle: '#FB923C',
  gold: '#FBBF24',
  goldSoft: '#78350F',
  goldDark: '#FDE68A',
  emerald: '#2DD4BF',
  emeraldLight: '#115E59',
  emeraldBg: '#0D2D29',
  azure: '#38BDF8',
  azureLight: '#0369A1',
  azureBg: '#082F49',
  terracotta: '#FB923C',
  terracottaLight: '#9A3412',
  terracottaBg: '#431407',
  sunset: '#FB923C',
  coral: '#FDA4AF',
  teal: '#2DD4BF',
  sky: '#38BDF8',
  yellow: '#FBBF24',
  purple: '#C084FC',
  mint: '#34D399',
  navBg: '#210E04',
  navBorder: '#431D0A',
  subtleBg: '#331A08',
  trackBg: '#431D0A',
  scrim: 'rgba(26, 12, 2, 0.72)',
};

export const palette = {
  light: lightColors,
  dark: darkColors,
  kidsLight: kidsLightColors,
  kidsDark: kidsDarkColors,

  standard: {
    paper: '#F8F5EC',
    paperDark: '#090F0D',
    ink: '#0F172A',
    inkLight: '#F8FAFC',
    muted: '#475569',
    mutedLight: '#CBD5E1',
    card: '#FFFFFF',
    border: '#E2D9C8',
    gold: '#B45309',
    goldSoft: '#FEF3C7',
    goldDark: '#78350F',
    emerald: '#0F766E',

    sections: {
      'qisas-al-anbiya': {
        name: 'Qisas al-Anbiya',
        nameAr: 'قصص الأنبياء',
        primary: '#0F766E',
        secondary: '#115E59',
        light: '#E6F4F1',
        border: '#B2E3DC',
        text: '#042F2C',
        badgeBg: '#CCFBF1',
        badgeText: '#0F766E',
        darkPrimary: '#14B8A6',
        darkLight: '#0D2D29',
        darkText: '#5EEAD4',
      },
      'seerah-shamail': {
        name: "Seerah & Shama'il",
        nameAr: 'السيرة والشمائل',
        primary: '#D97706',
        secondary: '#B45309',
        light: '#FEF8E8',
        border: '#FDE68A',
        text: '#78350F',
        badgeBg: '#FEF3C7',
        badgeText: '#92400E',
        darkPrimary: '#F59E0B',
        darkLight: '#3A1D00',
        darkText: '#FDE68A',
      },
      sahabah: {
        name: 'Sahabah',
        nameAr: 'الصحابة',
        primary: '#0284C7',
        secondary: '#0369A1',
        light: '#F0F9FF',
        border: '#BAE6FD',
        text: '#0C4A6E',
        badgeBg: '#E0F2FE',
        badgeText: '#0369A1',
        darkPrimary: '#38BDF8',
        darkLight: '#082F49',
        darkText: '#BAE6FD',
      },
      gleanings: {
        name: 'Narratives & Successors',
        nameAr: 'آثار وتابعون',
        primary: '#C2410C',
        secondary: '#9A3412',
        light: '#FFF7ED',
        border: '#FFEDD5',
        text: '#7C2D12',
        badgeBg: '#FFEDD5',
        badgeText: '#C2410C',
        darkPrimary: '#FB923C',
        darkLight: '#431407',
        darkText: '#FFEDD5',
      },
    },
  },

  kids: {
    cream: '#FFF8F0',
    ink: '#3B1808',
    card: '#FFFFFF',
    border: '#FFEDD5',
    sunset: '#F97316',
    coral: '#FB7185',
    teal: '#0D9488',
    sky: '#0284C7',
    butter: '#FEF08A',
    yellow: '#EAB308',
    purple: '#A855F7',
    mint: '#10B981',

    sections: {
      'qisas-al-anbiya': {
        title: "Prophets' Adventures",
        titleAr: 'قصص الأنبياء',
        primary: '#F97316',
        bg: '#FFF3E8',
        border: '#FFD8BE',
        badgeBg: '#FFEDD5',
        badgeText: '#C2410C',
      },
      'seerah-shamail': {
        title: "Prophet's Kindness",
        titleAr: 'السيرة النبوية',
        primary: '#EAB308',
        bg: '#FEFCE8',
        border: '#FEF08A',
        badgeBg: '#FEF9C3',
        badgeText: '#854D0E',
      },
      sahabah: {
        title: 'Brave Companions',
        titleAr: 'أبطال الصحابة',
        primary: '#0284C7',
        bg: '#F0F9FF',
        border: '#BAE6FD',
        badgeBg: '#E0F2FE',
        badgeText: '#0369A1',
      },
      gleanings: {
        title: 'Gentle Wise Deeds',
        titleAr: 'أخلاق وحكم',
        primary: '#0D9488',
        bg: '#F0FDF4',
        border: '#BBF7D0',
        badgeBg: '#DCFCE7',
        badgeText: '#15803D',
      },
    },
  },
};

export function getColors(isDark: boolean): ThemeColors {
  return isDark ? darkColors : lightColors;
}

/** Section accent resolved for the active colour scheme. */
export function sectionAccent(slug: SectionSlug, isDark: boolean) {
  const section = palette.standard.sections[slug];
  return {
    primary: isDark ? section.darkPrimary : section.primary,
    surface: isDark ? section.darkLight : section.light,
    onSurface: isDark ? section.darkText : section.text,
    badgeBg: isDark ? section.darkLight : section.badgeBg,
    badgeText: isDark ? section.darkText : section.badgeText,
    gradient: sectionGradients[slug][isDark ? 'dark' : 'light'],
    accentGradient: accentGradients[slug][isDark ? 'dark' : 'light'],
  };
}

/** Translucent tint of any hex colour — used for soft badge and icon backdrops. */
export function alpha(hex: string, amount: number) {
  const clamped = Math.round(Math.min(1, Math.max(0, amount)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${clamped}`;
}
