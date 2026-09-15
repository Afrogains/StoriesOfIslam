import { describe, expect, it } from 'vitest';
import { VoiceSynthesisService, VOICE_PROFILES } from './VoiceSynthesisService';

describe('VoiceSynthesisService pronunciation', () => {
  it('applies the Arabic terminology lexicon case-insensitively', () => {
    const spoken = VoiceSynthesisService.applyLexicon(
      'A hadith scholar studied the Seerah and said SubhanAllah.',
    );
    expect(spoken).toContain('ha-deeth');
    expect(spoken).toContain('see-rah');
    expect(spoken).toContain('sub-haan al-laah');
  });

  it('escapes SSML-sensitive characters', () => {
    const ssml = VoiceSynthesisService.buildSsml(
      { id: 'turn-1', speaker: 'host_a', text: 'Knowledge & patience < pride', arabicTerms: [] },
      VOICE_PROFILES.host_a,
    );
    expect(ssml).toContain('&amp;');
    expect(ssml).toContain('&lt;');
  });
});
