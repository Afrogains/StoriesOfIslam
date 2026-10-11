import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Shared mobile spacing so screens and the tab bar clear notches / home indicators. */
export const LAYOUT = {
  screenPadX: 16,
  screenPadTop: 8,
  /** Extra scroll clearance above the custom tab bar. */
  scrollPadBottom: 108,
  tabBarBaseHeight: 58,
  stickyDeckGap: 10,
} as const;

export function useMobileLayout() {
  const insets = useSafeAreaInsets();
  const topPad = Math.max(insets.top, 10) + LAYOUT.screenPadTop;
  const tabBarPadBottom = Math.max(insets.bottom, 8);
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
  };
}
