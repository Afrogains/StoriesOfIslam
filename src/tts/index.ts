/**
 * Cloud TTS package — production multi-speaker synthesis used by the worker.
 * The mobile client keeps a mirrored lexicon under `mobile/src/tts` so
 * on-device narration stays consistent when MP3s are not yet published.
 */
export {
  VoiceSynthesisService,
  VOICE_PROFILES,
  PRONUNCIATION_LEXICON,
  type VoiceProviderId,
  type VoiceSynthesisOptions,
  type SynthesizedEpisodeAudio,
} from '../services/VoiceSynthesisService';
