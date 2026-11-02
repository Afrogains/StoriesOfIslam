import { Platform } from 'react-native';
import { applyLexicon } from './lexicon';

export type SpeechEngineOptions = {
  rate?: number;
  pitch?: number;
  lang?: string;
};

type SpeechHandle = {
  cancel: () => void;
};

function getSpeechSynthesis(): SpeechSynthesis | null {
  if (Platform.OS !== 'web') return null;
  if (typeof window === 'undefined') return null;
  if (!('speechSynthesis' in window)) return null;
  return window.speechSynthesis;
}

/** True when the runtime can narrate cues without a prebuilt MP3. */
export function isClientTtsAvailable(): boolean {
  return getSpeechSynthesis() != null;
}

/**
 * Speak one cue with the browser Speech Synthesis API.
 * Returns a handle that cancels the utterance; resolves when speech ends.
 */
export function speakText(
  text: string,
  options: SpeechEngineOptions = {},
): { handle: SpeechHandle; done: Promise<'ended' | 'cancelled' | 'unavailable'> } {
  const synth = getSpeechSynthesis();
  const spoken = applyLexicon(text.trim());
  if (!synth || !spoken) {
    return {
      handle: { cancel: () => undefined },
      done: Promise.resolve(synth ? 'ended' : 'unavailable'),
    };
  }

  let settled = false;
  let resolveDone: (value: 'ended' | 'cancelled' | 'unavailable') => void = () => undefined;
  const done = new Promise<'ended' | 'cancelled' | 'unavailable'>((resolve) => {
    resolveDone = resolve;
  });

  const finish = (reason: 'ended' | 'cancelled' | 'unavailable') => {
    if (settled) return;
    settled = true;
    resolveDone(reason);
  };

  const utterance = new SpeechSynthesisUtterance(spoken);
  utterance.rate = Math.max(0.7, Math.min(options.rate ?? 1, 1.6));
  utterance.pitch = options.pitch ?? 1;
  utterance.lang = options.lang ?? 'en-US';
  utterance.onend = () => finish('ended');
  utterance.onerror = () => finish('cancelled');

  // Chrome occasionally keeps a stuck paused state after cancel().
  try {
    synth.resume();
  } catch {
    /* ignore */
  }
  synth.speak(utterance);

  return {
    handle: {
      cancel: () => {
        try {
          synth.cancel();
        } catch {
          /* ignore */
        }
        finish('cancelled');
      },
    },
    done,
  };
}

export function cancelAllSpeech(): void {
  const synth = getSpeechSynthesis();
  if (!synth) return;
  try {
    synth.cancel();
  } catch {
    /* ignore */
  }
}
