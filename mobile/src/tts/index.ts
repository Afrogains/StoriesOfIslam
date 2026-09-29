/**
 * Client TTS package — merges browser narration with the cloud
 * VoiceSynthesisService lexicon so Prophets (and other text stories)
 * remain listenable when no published MP3 exists yet.
 */
export { applyLexicon, PRONUNCIATION_LEXICON } from './lexicon';
export { CueNarrator, type CueNarratorListener } from './cueNarrator';
export {
  cancelAllSpeech,
  isClientTtsAvailable,
  speakText,
  type SpeechEngineOptions,
} from './webSpeechEngine';
