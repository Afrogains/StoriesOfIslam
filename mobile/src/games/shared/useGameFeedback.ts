import { useMemo } from 'react';
import { Platform, Vibration } from 'react-native';

export type FeedbackEvent = 'tap' | 'select' | 'success' | 'bonus' | 'error' | 'levelComplete';

const PATTERNS: Record<FeedbackEvent, number | number[]> = {
  tap: 8,
  select: 12,
  success: [0, 18, 60, 28],
  bonus: [0, 12, 40, 12, 40, 24],
  error: [0, 40, 50, 40],
  levelComplete: [0, 30, 70, 30, 70, 60],
};

/**
 * Haptic triggers for both games. Uses the core Vibration API so it ships without a new
 * native module; every event is also forwarded to `onEvent`, the hook point for sound.
 */
export function useGameFeedback(options: { enabled?: boolean; onEvent?: (event: FeedbackEvent) => void } = {}) {
  const { enabled = true, onEvent } = options;
  return useMemo(() => {
    const fire = (event: FeedbackEvent) => {
      onEvent?.(event);
      if (!enabled || Platform.OS === 'web') return;
      try {
        Vibration.vibrate(PATTERNS[event]);
      } catch {
        // Some devices deny vibration; feedback is best-effort.
      }
    };
    return {
      tap: () => fire('tap'),
      select: () => fire('select'),
      success: () => fire('success'),
      bonus: () => fire('bonus'),
      error: () => fire('error'),
      levelComplete: () => fire('levelComplete'),
    };
  }, [enabled, onEvent]);
}
