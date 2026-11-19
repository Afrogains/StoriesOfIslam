import { Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Shared mobile spacing so every tab clears notches, status bars, and the
 * custom bottom tab bar with one coherent rhythm.
 *
 * Scene content already sits above the tab bar in the navigator flex layout,
 * so scroll padding only needs breathing room — not a second copy of the tab
 * bar height. The Names sticky deck is an absolute overlay inside the scene,
 * so its list needs dedicated clearance.
 */
export const LAYOUT = {
  screenPadX: 16,
  screenPadTop: 12,
  /** Extra space after the last scroll item above the tab bar. */
  contentPadBottom: 72,
  tabBarPadTop: 8,
  tabBarContentHeight: 52,
  /** Floor when the OS reports a tiny/zero bottom inset (common on Android). */
  minBottomInset: 18,
  /**
   * Floor when safe-area top is 0 (Android before layout, Expo web). Prefer the
   * real status-bar height on Android when available.
   */
  minTopInset:
    Platform.OS === 'android'
      ? Math.max(StatusBar.currentHeight ?? 28, 28)
      : Platform.OS === 'web'
        ? 28
        : 20,
  /** Gap between the Names sticky deck and the top edge of the tab bar. */
  stickyDeckGap: 20,
  /** Idle Names deck height plus breathing room. */
  namesIdleClearance: 148,
  /** Minimized Names player (compact transport) plus breathing room. */
  namesMiniClearance: 196,
  /**
   * Listen/read mode expands with the player or notes. Pad so the last name
   * tiles remain reachable above the overlay.
   */
  namesDeckClearance: 320,
  /** Extra trailing inset so horizontal pill rows can scroll fully into view. */
  pillEndPad: 28,
} as const;

export function useMobileLayout() {
  const insets = useSafeAreaInsets();

  const topInset = Math.max(insets.top, LAYOUT.minTopInset);
  const topPad = topInset + LAYOUT.screenPadTop;

  const tabBarPadBottom = Math.max(insets.bottom, LAYOUT.minBottomInset);
  const tabBarHeight =
    LAYOUT.tabBarPadTop + LAYOUT.tabBarContentHeight + tabBarPadBottom;

  const scrollPadBottom = LAYOUT.contentPadBottom;
  const stickyBottom = LAYOUT.stickyDeckGap;
  const namesListPadBottom = LAYOUT.namesDeckClearance + stickyBottom;
  const namesListPadBottomIdle = LAYOUT.namesIdleClearance + stickyBottom;
  const namesListPadBottomMini = LAYOUT.namesMiniClearance + stickyBottom;

  return {
    insets,
    topInset,
    /** Bottom system inset (gesture bar / 3-button nav) with a safe floor. */
    bottomInset: tabBarPadBottom,
    topPad,
    tabBarPadTop: LAYOUT.tabBarPadTop,
    tabBarPadBottom,
    tabBarHeight,
    scrollPadBottom,
    padX: LAYOUT.screenPadX,
    stickyBottom,
    namesListPadBottom,
    namesListPadBottomIdle,
    namesListPadBottomMini,
    pillEndPad: LAYOUT.pillEndPad,
    /** Shared ScrollView / FlatList content insets for standard tabs. */
    screenContent: {
      paddingTop: topPad,
      paddingHorizontal: LAYOUT.screenPadX,
      paddingBottom: scrollPadBottom,
    },
  };
}
