import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildCoverageReport, parseOptions, selectMatches } from '../cli/importNamesPlaylist';
import {
  buildNameIndex,
  formatDurationLabel,
  mapPodcastEpisodesToNames,
  matchPlaylist,
  nameSkeleton,
  parsePodcastFeed,
  parseVideoTitle,
  vttToText,
  type DivineNameRecord,
  type PlaylistVideo,
} from './matching';
import { safeError } from './sources';

const names = JSON.parse(
  readFileSync(resolve(__dirname, '../../db/divine-names.json'), 'utf8'),
) as DivineNameRecord[];

const video = (videoId: string, title: string, position = 0): PlaylistVideo => ({
  videoId,
  title,
  position,
  durationSeconds: 3000,
});

const feed = `<?xml version="1.0"?><rss><channel>
<item><title>Allah Is The Only Source Of Happiness The Names #12 As- Salaam</title>
<enclosure url="https://podcasts.muslimcentral.com/mikaeel-smith/salaam.mp3" length="43051588" type="audio/mpeg"/>
<itunes:duration>59:47</itunes:duration></item>
<item><title>Allah Blesses You While You Ignore Him  The Names Class 12 Al-Wahha&#772;B</title>
<enclosure url="https://podcasts.muslimcentral.com/mikaeel-smith/wahhab.mp3" length="43017714" type="audio/mpeg"/></item>
<item><title>The Names #42</title>
<enclosure url="https://podcasts.muslimcentral.com/mikaeel-smith/42-dup.mp3" length="1" type="audio/mpeg"/></item>
<item><title>The Names #42 Al-Mumin Does Your Presence Bring Peace</title>
<enclosure url="https://podcasts.muslimcentral.com/mikaeel-smith/42.mp3" length="1" type="audio/mpeg"/></item>
<item><title>Whose Approval Are You Seeking  The Names #11 Al-MuIzz &amp; Al-Mudhil</title>
<enclosure url="https://podcasts.muslimcentral.com/mikaeel-smith/11.mp3" length="1" type="audio/mpeg"/></item>
</channel></rss>`;

describe('The Names playlist matching', () => {
  it('keeps the backend Name list in sync with the mobile app', () => {
    const mobile = readFileSync(resolve(__dirname, '../../mobile/src/data/theNames.ts'), 'utf8');
    const pattern = /number: (\d+), arabic: '[^']+', transliteration: '([^']+)'/g;
    const parsed = [...mobile.matchAll(pattern)].map((match) => ({
      number: Number(match[1]),
      transliteration: match[2],
    }));
    expect(parsed).toEqual(names.map(({ number, transliteration }) => ({ number, transliteration })));
    expect(names).toHaveLength(99);
  });

  it('normalises transliteration variants to one key', () => {
    expect(nameSkeleton('As - Salaam')).toBe(nameSkeleton('As-Salam'));
    expect(nameSkeleton('Al - Hakeem')).toBe(nameSkeleton('Al-Hakim'));
    expect(nameSkeleton('Al-Dhāhir')).toBe(nameSkeleton('Az-Zahir'));
    expect(nameSkeleton('Al- Daarr')).toBe(nameSkeleton('Ad-Darr'));
    expect(nameSkeleton("Al-Mu'izz")).toBe(nameSkeleton('Al-Mu’izz'));
  });

  it('resolves names that collide after normalisation only when the spelling is exact', () => {
    const index = buildNameIndex(names);
    expect(index.resolve('Al-Majid')).toEqual({ numbers: [48], ambiguous: false });
    expect(index.resolve('Al-Maajid')).toEqual({ numbers: [65], ambiguous: false });
    expect(index.resolve('Al Majeed').ambiguous).toBe(true);
    expect(index.resolve('Al-Aliyy').numbers).toEqual([36]);
    expect(index.resolve('Al-Waliyy').numbers).toEqual([55]);
    expect(index.resolve('Al-Wali').numbers).toEqual([77]);
  });

  it('parses class numbers and multiple names from playlist titles', () => {
    expect(parseVideoTitle('Allah Loves When You Call Upon Him | The Names Class 16: Al-Karib & Al-Mujeeb | Shaykh Mikaeel Smith'))
      .toEqual({ classNumber: 16, nameTokens: ['Al-Karib', 'Al-Mujeeb'] });
    expect(parseVideoTitle('Your Past Is Gone | The Names: Class 32 | Shaykh Mikaeel Smith'))
      .toEqual({ classNumber: 32, nameTokens: [] });
    expect(parseVideoTitle('The Names | Shaykh Mikaeel Smith | Class 3').classNumber).toBe(3);
  });

  it('maps videos to names and podcast episodes, reporting what it cannot map', () => {
    const episodes = parsePodcastFeed(feed);
    expect(episodes[0]).toMatchObject({ sizeBytes: 43051588, durationSeconds: 3587 });
    const matches = matchPlaylist(
      [
        video('asi0ipVACMU', 'Allah Is The Only Source of Happiness | The Names Class 12: As- Salaam | Shaykh Mikaeel Smith'),
        video('hflDhDO1flI', 'Allah Blesses You While You Ignore Him | The Names Class 13: Al-Wahhāb | Shaykh Mikaeel Smith'),
        video('4YQmSUvhcT4', 'Does Your Presence Bring Peace? | The Names Class 42: Al-Mumin | Shaykh Mikaeel Smith'),
        video('cKX__dX2UjY', "Whose Approval Are You Seeking? | The Names Class 11: Al-Mu'izz & Al-Mudhil | Shaykh Mikaeel Smith"),
        video('qsFr7aZlsz8', 'Allah Loves When You Call Upon Him | The Names Class 16: Al-Karib & Al-Mujeeb | Shaykh Mikaeel Smith'),
        video('e0v6q6dZh4I', 'Your Heart Can Still Change. | The Names Class 43: Al-Muqalib | Shaykh Mikaeel Smith'),
        video('TVQiCs2E5nQ', 'The Names | Shaykh Mikaeel Smith | Class 3'),
      ],
      episodes,
      names,
    );
    const byId = Object.fromEntries(matches.map((match) => [match.video.videoId, match]));
    expect(byId.asi0ipVACMU.nameNumbers).toEqual([5]);
    expect(byId.asi0ipVACMU.podcast?.audioUrl).toContain('salaam.mp3');
    expect(byId.hflDhDO1flI.nameNumbers).toEqual([16]);
    expect(byId.hflDhDO1flI.podcast?.audioUrl).toContain('wahhab.mp3');
    expect(byId['4YQmSUvhcT4'].podcast?.audioUrl).toContain('/42.mp3');
    expect(byId.cKX__dX2UjY.nameNumbers).toEqual([24, 25]);
    expect(byId.qsFr7aZlsz8).toMatchObject({ nameNumbers: [44], unmatchedTokens: ['Al-Karib'] });
    expect(byId.e0v6q6dZh4I).toMatchObject({ nameNumbers: [], unmatchedTokens: ['Al-Muqalib'] });

    const coverage = buildCoverageReport(matches, names);
    expect(coverage.unmatchedVideos.map((entry) => entry.videoId)).toEqual(['e0v6q6dZh4I', 'TVQiCs2E5nQ']);
    expect(coverage.partiallyMatchedVideos[0]).toMatchObject({ videoId: 'qsFr7aZlsz8', matched: [44] });
    expect(coverage.namesWithoutVideo).toHaveLength(99 - 6);
  });

  it('supports manual mapping overrides and name/class filters', () => {
    const matches = matchPlaylist(
      [
        video('TVQiCs2E5nQ', 'The Names | Shaykh Mikaeel Smith | Class 3'),
        video('cKX__dX2UjY', "Whose Approval? | The Names Class 11: Al-Mu'izz & Al-Mudhil | x"),
      ],
      [],
      names,
      { TVQiCs2E5nQ: [1] },
    );
    expect(matches[0].nameNumbers).toEqual([1]);
    expect(selectMatches(matches, { names: new Set([25]), classes: null, limit: null }))
      .toMatchObject([{ video: { videoId: 'cKX__dX2UjY' }, nameNumbers: [25] }]);
    expect(selectMatches(matches, { names: null, classes: new Set([3]), limit: null })).toHaveLength(1);
  });

  it('maps titled podcast episodes onto Name numbers, including latest releases', () => {
    const xml = `<?xml version="1.0"?><rss><channel>
<item><title>The Names #46 Al-Qahar – Your Greatest Victory Starts Within</title>
<enclosure url="https://podcasts.muslimcentral.com/mikaeel-smith/qahar.mp3" type="audio/mpeg"/>
<itunes:duration>47:26</itunes:duration></item>
<item><title>The Names #45 Al-Warith</title>
<enclosure url="https://podcasts.muslimcentral.com/mikaeel-smith/warith.mp3" type="audio/mpeg"/>
<itunes:duration>53:25</itunes:duration></item>
<item><title>The Names #44 Al-Barr - There is Good In Your Hardship</title>
<enclosure url="https://podcasts.muslimcentral.com/mikaeel-smith/barr.mp3" type="audio/mpeg"/></item>
<item><title>The Names #42</title>
<enclosure url="https://podcasts.muslimcentral.com/mikaeel-smith/42-generic.mp3" type="audio/mpeg"/></item>
<item><title>The Names #43 Al-Muqalib - Your Heart Can Still Change</title>
<enclosure url="https://podcasts.muslimcentral.com/mikaeel-smith/muqalib.mp3" type="audio/mpeg"/></item>
</channel></rss>`;
    const episodes = parsePodcastFeed(xml);
    const { byNumber, unmatchedTokens } = mapPodcastEpisodesToNames(episodes, names);
    expect(byNumber.get(15)?.episode.audioUrl).toContain('qahar.mp3');
    expect(byNumber.get(97)?.episode.audioUrl).toContain('warith.mp3');
    expect(byNumber.get(79)?.episode.audioUrl).toContain('barr.mp3');
    expect([...byNumber.values()].some((entry) => entry.episode.audioUrl.includes('42-generic'))).toBe(false);
    expect(unmatchedTokens).toContain('Al-Muqalib');
    expect(formatDurationLabel(episodes[0].durationSeconds)).toBe('47:26');
  });

  it('collapses rolling auto-caption cues into text', () => {
    const vtt = [
      'WEBVTT',
      'Kind: captions',
      '',
      '00:00:00.000 --> 00:00:02.000',
      'bismillah alhamdulillah',
      '',
      '00:00:02.000 --> 00:00:04.000',
      'bismillah alhamdulillah today we',
      '',
      '00:00:04.000 --> 00:00:06.000',
      'today we<00:00:05.000><c> talk about</c> as-salam',
    ].join('\n');
    expect(vttToText(vtt)).toBe('bismillah alhamdulillah today we talk about as-salam');
  });
});

describe('names import CLI safety', () => {
  it('redacts credentials from errors before they are logged or reported', () => {
    const message = safeError(
      new Error('GET https://www.googleapis.com/youtube/v3/playlistItems?part=x&key=AIzaSECRET123 Bearer sk-abcdefghijklmnop'),
    );
    expect(message).not.toContain('AIzaSECRET123');
    expect(message).not.toContain('sk-abcdefghijklmnop');
    expect(message).toContain('key=[REDACTED]');
  });

  it('builds a reviewer-facing description from curated meaning, not a transcript', async () => {
    const { approvedDescription } = await import('../cli/approveNamesMedia');
    const text = approvedDescription(
      {
        number: 5,
        arabic: '',
        transliteration: 'As-Salam',
        meaning: 'The Source of Peace',
        reflection: 'True safety and peace come from Him.',
      },
      12,
    );
    expect(text).toContain('As-Salam — The Source of Peace');
    expect(text).toContain('Class 12');
    expect(text).not.toMatch(/transcript|segment/i);
    expect(text.length).toBeGreaterThan(40);
  });

  it('parses dry-run, filters and manual maps', () => {
    const options = parseOptions(['--dry-run', '--names=5,16', '--map=TVQiCs2E5nQ:1,2', '--batch-size=2'])!;
    expect(options).toMatchObject({ dryRun: true, batchSize: 2, overrides: { TVQiCs2E5nQ: [1, 2] } });
    expect([...options.names!]).toEqual([5, 16]);
    expect(() => parseOptions(['--map=broken'])).toThrow();
    expect(parseOptions(['--help'])).toBeNull();
  });
});
