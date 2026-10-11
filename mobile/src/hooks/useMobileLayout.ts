import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Shared mobile spacing so screens and the tab bar clear notches / home indicators. */
export const LAYOUT = {
  screenPadX: 16,
  screenPadTop: 12,
  /** Extra scroll clearance above the custom tab bar. */
  scrollPadBottom: 120,
  tabBarBaseHeight: 56,
  /** Clearance above tab bar for the Names sticky deck. */
  stickyDeckGap: 12,
  /** Extra list padding so Names tiles clear the floating deck. */
  namesDeckClearance: 168,
} as const;

export function useMobileLayout() {
  const insets = useSafeAreaInsets();
  // Real devices often report a small top inset; keep a firm minimum under the status bar.
  const topPad = Math.max(insets.top, 28) + LAYOUT.screenPadTop;
  const tabBarPadBottom = Math.max(insets.bottom, 10);
  const tabBarHeight = LAYOUT.tabBarBaseHeight + tabBarPadBottom;
  const scrollPadBottom = LAYOUT.scrollPadBottom + tabBarPadBottom;

  return {
    insets,
    topPad,
    tabBarPadBottom,
    tabBarHeight,
    scrollPadBottom,
    padX: LAYOUT.screenPadX,
    stickyBottom: LAYOUT.stickyDeckGap,
    namesListPadBottom: scrollPadBottom + LAYOUT.namesDeckClearance,
  };
}
