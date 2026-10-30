export interface DivineNameRecord {
  number: number;
  arabic: string;
  transliteration: string;
  meaning: string;
}

export interface PlaylistVideo {
  videoId: string;
  title: string;
  position: number;
  durationSeconds: number | null;
}

export interface PodcastEpisode {
  title: string;
  audioUrl: string;
  sizeBytes: number | null;
  durationSeconds: number | null;
}

export interface VideoNameMatch {
  video: PlaylistVideo;
  classNumber: number | null;
  nameNumbers: number[];
  /** Name tokens found in the title that are not among the app's 99 Names. */
  unmatchedTokens: string[];
  ambiguousTokens: string[];
  podcast: PodcastEpisode | null;
}

/** Spellings that the generic skeleton cannot resolve to a single Name. */
const ALIASES: Record<string, number> = {
  aliy: 36,
};

/** Spelling-insensitive key: "As - Salaam", "As-Salam" and "al salam" all become "salam". */
export function nameSkeleton(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[’'ʾʿ`‘]/g, '')
    .replace(/\s*-\s*/g, '-')
    .trim()
    .replace(/^(al|ar|as|an|at|ad|adh|ash|az|aal)[-\s]+/, '')
    .replace(/[^a-z]/g, '')
    .replace(/dh/g, 'z')
    .replace(/(.)\1+/g, '$1')
    .replace(/e/g, 'i')
    .replace(/ou/g, 'u');
}

function strictKey(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}

export interface NameIndex {
  resolve(token: string): { numbers: number[]; ambiguous: boolean };
}

export function buildNameIndex(names: DivineNameRecord[]): NameIndex {
  const bySkeleton = new Map<string, DivineNameRecord[]>();
  for (const name of names) {
    const key = nameSkeleton(name.transliteration);
    bySkeleton.set(key, [...(bySkeleton.get(key) ?? []), name]);
  }
  return {
    resolve(token) {
      const key = nameSkeleton(token);
      if (ALIASES[key]) return { numbers: [ALIASES[key]], ambiguous: false };
      const candidates = bySkeleton.get(key) ?? [];
      if (candidates.length <= 1) {
        return { numbers: candidates.map((name) => name.number), ambiguous: false };
      }
      const exact = candidates.filter(
        (name) => strictKey(name.transliteration) === strictKey(token),
      );
      if (exact.length === 1) return { numbers: [exact[0].number], ambiguous: false };
      return { numbers: candidates.map((name) => name.number), ambiguous: true };
    },
  };
}

/** "Hook | The Names Class 16: Al-Karib & Al-Mujeeb | Shaykh …" → class 16, ["Al-Karib","Al-Mujeeb"]. */
export function parseVideoTitle(title: string): { classNumber: number | null; nameTokens: string[] } {
  const match = /The Names?\s*:?\s*Class\s*#?\s*(\d+)\s*:?\s*([^|]*)/i.exec(title);
  if (!match) {
    const loose = /Class\s*#?\s*(\d+)/i.exec(title);
    return { classNumber: loose ? Number(loose[1]) : null, nameTokens: [] };
  }
  return { classNumber: Number(match[1]), nameTokens: splitNameTokens(match[2]) };
}

function splitNameTokens(segment: string): string[] {
  return segment
    .split(/\s*(?:&|\band\b|,)\s*/i)
    .map((token) => token.replace(/\s*-\s*/g, '-').trim())
    .filter((token) => /[a-z]/i.test(token) && token.length <= 40);
}

/** Podcast titles mix "#09", "Class 30" and free text; extract every Name-like token. */
export function podcastNameTokens(title: string): string[] {
  const plain = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const tokens = plain.match(/\b(?:Al|Ar|As|An|At|Ad|Ash|Az)\s*-\s*[A-Za-zʾ'’]+/g) ?? [];
  return tokens.map((token) => token.replace(/\s*-\s*/g, '-'));
}

export function podcastClassNumber(title: string): number | null {
  const match = /(?:#|Class\s*#?\s*)(\d{1,3})/i.exec(title);
  return match ? Number(match[1]) : null;
}

export function formatDurationLabel(seconds: number | null): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return '';
  const whole = Math.round(seconds);
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const secs = whole % 60;
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

export type NamedPodcastEpisode = {
  episode: PodcastEpisode;
  classNumber: number | null;
};

/**
 * Map published podcast episodes onto the 99 Names using title tokens.
 * Generic titles such as "The Names #42" are skipped until a titled release exists.
 * When two titled episodes mention the same Name, the more specific title wins.
 */
export function mapPodcastEpisodesToNames(
  episodes: PodcastEpisode[],
  names: DivineNameRecord[],
): { byNumber: Map<number, NamedPodcastEpisode>; unmatchedTokens: string[] } {
  const index = buildNameIndex(names);
  const scored = new Map<number, NamedPodcastEpisode & { score: number }>();
  const unmatchedTokens = new Set<string>();

  for (const episode of episodes) {
    const tokens = podcastNameTokens(episode.title);
    if (!tokens.length) continue;
    const classNumber = podcastClassNumber(episode.title);
    const numbers: number[] = [];
    for (const token of tokens) {
      const resolved = index.resolve(token);
      if (resolved.ambiguous || !resolved.numbers.length) unmatchedTokens.add(token);
      else numbers.push(...resolved.numbers);
    }
    const unique = [...new Set(numbers)];
    if (!unique.length) continue;
    const score = unique.length * 2 + tokens.length + episode.title.length / 80;
    for (const nameNumber of unique) {
      const previous = scored.get(nameNumber);
      if (!previous || score > previous.score) {
        scored.set(nameNumber, { episode, classNumber, score });
      }
    }
  }

  const byNumber = new Map<number, NamedPodcastEpisode>();
  for (const [nameNumber, value] of scored) {
    byNumber.set(nameNumber, { episode: value.episode, classNumber: value.classNumber });
  }
  return { byNumber, unmatchedTokens: [...unmatchedTokens] };
}

function hookWords(title: string): Set<string> {
  const hook = title.split('|')[0] ?? '';
  return new Set(
    hook
      .toLowerCase()
      .replace(/[’']/g, '')
      .replace(/[^a-z\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 3),
  );
}

export function matchPodcastEpisode(
  video: PlaylistVideo,
  classNumber: number | null,
  nameNumbers: number[],
  episodes: PodcastEpisode[],
  index: NameIndex,
): PodcastEpisode | null {
  const videoHook = hookWords(video.title);
  let best: { episode: PodcastEpisode; score: number } | null = null;
  for (const episode of episodes) {
    let score = 0;
    if (classNumber != null && podcastClassNumber(episode.title) === classNumber) score += 2;
    const episodeNames = new Set(
      podcastNameTokens(episode.title).flatMap((token) => index.resolve(token).numbers),
    );
    if (nameNumbers.length && nameNumbers.every((number) => episodeNames.has(number))) score += 2;
    const words = hookWords(episode.title);
    const shared = [...videoHook].filter((word) => words.has(word)).length;
    const hookRatio = videoHook.size ? shared / videoHook.size : 0;
    if (videoHook.size >= 3 && hookRatio >= 0.8) score += 3;
    else if (hookRatio >= 0.6) score += 2;
    if (score > (best?.score ?? 0)) best = { episode, score };
  }
  return best && best.score >= 3 ? best.episode : null;
}

export function matchPlaylist(
  videos: PlaylistVideo[],
  episodes: PodcastEpisode[],
  names: DivineNameRecord[],
  overrides: Record<string, number[]> = {},
): VideoNameMatch[] {
  const index = buildNameIndex(names);
  return videos.map((video) => {
    const { classNumber, nameTokens } = parseVideoTitle(video.title);
    const nameNumbers: number[] = [];
    const unmatchedTokens: string[] = [];
    const ambiguousTokens: string[] = [];
    for (const token of nameTokens) {
      const resolved = index.resolve(token);
      if (resolved.ambiguous) ambiguousTokens.push(token);
      else if (resolved.numbers.length) nameNumbers.push(...resolved.numbers);
      else unmatchedTokens.push(token);
    }
    const finalNumbers = overrides[video.videoId] ?? [...new Set(nameNumbers)];
    return {
      video,
      classNumber,
      nameNumbers: finalNumbers,
      unmatchedTokens: overrides[video.videoId] ? [] : unmatchedTokens,
      ambiguousTokens: overrides[video.videoId] ? [] : ambiguousTokens,
      podcast: matchPodcastEpisode(video, classNumber, finalNumbers, episodes, index),
    };
  });
}

function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .trim();
}

function parseDuration(raw: string | undefined): number | null {
  if (!raw) return null;
  const parts = raw.trim().split(':').map(Number);
  if (parts.some((part) => Number.isNaN(part))) return null;
  return parts.reduce((total, part) => total * 60 + part, 0);
}

export function parsePodcastFeed(xml: string): PodcastEpisode[] {
  const items = xml.match(/<item\b[\s\S]*?<\/item>/g) ?? [];
  return items.flatMap((item) => {
    const title = /<title>([\s\S]*?)<\/title>/.exec(item)?.[1];
    const enclosure = /<enclosure\b([^>]*)\/?>/.exec(item)?.[1] ?? '';
    const url = /url="([^"]+)"/.exec(enclosure)?.[1];
    if (!title || !url) return [];
    const length = /length="(\d+)"/.exec(enclosure)?.[1];
    return [{
      title: decodeXml(title),
      audioUrl: decodeXml(url),
      sizeBytes: length ? Number(length) : null,
      durationSeconds: parseDuration(/<itunes:duration>([^<]+)<\/itunes:duration>/.exec(item)?.[1]),
    }];
  });
}

/** Collapse rolling auto-caption cues ("a b", "a b c") into plain paragraphs. */
export function vttToText(vtt: string): string {
  const lines: string[] = [];
  for (const raw of vtt.split(/\r?\n/)) {
    const line = raw.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
    if (!line || line === 'WEBVTT' || /-->/.test(line) || /^(Kind|Language|NOTE)\b/.test(line)) continue;
    if (/^\d+$/.test(line)) continue;
    if (lines[lines.length - 1] === line) continue;
    lines.push(line);
  }
  const words: string[] = [];
  for (const line of lines) {
    const lineWords = line.split(/\s+/);
    let overlap = Math.min(lineWords.length, words.length);
    while (overlap > 0 && words.slice(-overlap).join(' ') !== lineWords.slice(0, overlap).join(' ')) {
      overlap -= 1;
    }
    words.push(...lineWords.slice(overlap));
  }
  return words.join(' ').replace(/\s+([,.!?])/g, '$1').trim();
}
