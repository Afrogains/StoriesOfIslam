/**
 * Shared pronunciation lexicon for client-side TTS.
 * Mirrors the cloud VoiceSynthesisService list so spoken narration
 * matches production synthesis without changing on-screen text.
 */
export const PRONUNCIATION_LEXICON: ReadonlyArray<[RegExp, string]> = [
  [/\bAssalamu\s+Alaikum\b/gi, 'as-sa-laa-mu a-lay-kum'],
  [/\bWa\s+Alaikum\s+Assalam\b/gi, 'wa a-lay-kum as-sa-laam'],
  [/\bSubhanAllah\b/gi, 'sub-haan al-laah'],
  [/\bInshaAllah\b/gi, 'in shaa al-laah'],
  [/\bAlhamdulillah\b/gi, 'al-ham-du-lil-laah'],
  [/\bAllah\b/g, 'al-laah'],
  [/\bMuhammad\b/g, 'mu-ham-mad'],
  [/\bHadith\b/gi, 'ha-deeth'],
  [/\bAhadith\b/gi, 'a-haa-deeth'],
  [/\bSahih\b/gi, 'sa-heeh'],
  [/\bHasan\b/g, 'ha-san'],
  [/\bAthar\b/gi, 'a-thar'],
  [/\bIsnad\b/gi, 'is-naad'],
  [/\bNiyyah\b/gi, 'nee-yah'],
  [/\bIkhlas\b/gi, 'ikh-laas'],
  [/\bIhsan\b/gi, 'ih-saan'],
  [/\bTaqwa\b/gi, 'taq-waa'],
  [/\bTawakkul\b/gi, 'ta-wak-kul'],
  [/\bTawhid\b/gi, 'taw-heed'],
  [/\bTazkiyah\b/gi, 'taz-kee-yah'],
  [/\bZuhd\b/gi, 'zuhd'],
  [/\bSeerah\b/gi, 'see-rah'],
  [/\bShama[’']il\b/gi, 'sha-maa-il'],
  [/\bSahabah\b/gi, 'sa-haa-bah'],
  [/\bTabi[’']un\b/gi, 'taa-bi-oon'],
  [/\bQisas\s+al-Anbiya\b/gi, 'qi-sas al an-bi-yaa'],
  [/\brahimahullah\b/gi, 'ra-hi-ma-hul-laah'],
  [/\bradiyallahu\s+anhu\b/gi, 'ra-di-yal-laa-hu an-hu'],
  [/\bIbn\s+Kathir\b/gi, 'ibn ka-theer'],
  [/\bIbrahim\b/gi, 'ib-raa-heem'],
  [/\bIsmail\b/gi, 'is-maa-eel'],
  [/\bIshaq\b/gi, 'is-haaq'],
  [/\bYaqub\b/gi, 'ya-qoob'],
  [/\bYusuf\b/gi, 'yoo-suf'],
  [/\bMusa\b/gi, 'moo-saa'],
  [/\bHarun\b/gi, 'haa-roon'],
  [/\bDawud\b/gi, 'daa-wood'],
  [/\bSulaiman\b/gi, 'su-lay-maan'],
  [/\bIsa\b/gi, 'ee-saa'],
  [/\bNuh\b/gi, 'nooh'],
  [/\bHud\b/gi, 'hood'],
  [/\bSalih\b/gi, 'saa-lih'],
  [/\bShuaib\b/gi, 'shu-ayb'],
  [/\bYunus\b/gi, 'yoo-nus'],
  [/\bAyyub\b/gi, 'ay-yoob'],
  [/\bZakariyah\b/gi, 'za-ka-riy-ya'],
  [/\bYahya\b/gi, 'yah-yaa'],
];

/** Apply lexicon respellings for spoken output only. */
export function applyLexicon(text: string): string {
  return PRONUNCIATION_LEXICON.reduce(
    (value, [pattern, replacement]) => value.replace(pattern, replacement),
    text,
  );
}
