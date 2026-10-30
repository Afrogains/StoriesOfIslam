import * as Clipboard from 'expo-clipboard';
import { Linking, Platform, Share } from 'react-native';
import type { NawawiHadith } from '../data/nawawiForty';
import { NAWAWI_COLLECTION } from '../data/nawawiForty';
import type { DivineName } from '../data/theNames';
import type { Highlight } from '../types/highlight';
import type { StoryItem } from '../types/catalog';

export const APP_SHARE_URL = 'https://afroclovers.com.ng';

export type SharePayload = {
  title: string;
  text: string;
  url?: string;
};

export type ShareChannelId =
  | 'whatsapp'
  | 'x'
  | 'snapchat'
  | 'telegram'
  | 'messages'
  | 'email'
  | 'copy'
  | 'more';

export type ShareResult = {
  channel: ShareChannelId;
  copied?: boolean;
  hint?: string;
};

export function formatHadithShare(hadith: NawawiHadith): SharePayload {
  const text = [
    `Hadith of the day · ${NAWAWI_COLLECTION.title} · No. ${hadith.n}`,
    hadith.subject,
    '',
    hadith.textAr,
    '',
    hadith.textEn,
    '',
    `— ${hadith.narrator}`,
    hadith.source,
    '',
    `Stories of Islam · ${APP_SHARE_URL}`,
  ].join('\n');
  return {
    title: `Hadith ${hadith.n}: ${hadith.subject}`,
    text,
    url: APP_SHARE_URL,
  };
}

export function formatStoryShare(story: StoryItem): SharePayload {
  const excerpt = (story.keyTakeaway || story.summary || '').trim();
  const text = [
    story.title,
    story.titleAr,
    `${story.figureName} · ${story.honorific}`,
    excerpt ? `\n${excerpt}` : '',
    '',
    story.sourceCitation,
    '',
    `Stories of Islam · ${APP_SHARE_URL}`,
  ]
    .filter((line) => line !== '')
    .join('\n');
  return { title: story.title, text, url: APP_SHARE_URL };
}

export function formatHighlightShare(highlight: Highlight): SharePayload {
  const text = [
    `"${highlight.text}"`,
    '',
    highlight.sourceLabel,
    '',
    `Highlighted in Stories of Islam · ${APP_SHARE_URL}`,
  ].join('\n');
  return { title: highlight.sourceLabel, text, url: APP_SHARE_URL };
}

export function formatNameShare(name: DivineName): SharePayload {
  const text = [
    `The Names · ${name.number}/99`,
    `${name.arabic}  ${name.transliteration}`,
    name.meaning,
    '',
    name.reflection,
    '',
    `Stories of Islam · ${APP_SHARE_URL}`,
  ].join('\n');
  return {
    title: `${name.transliteration} — ${name.meaning}`,
    text,
    url: APP_SHARE_URL,
  };
}

function tweetText(payload: SharePayload): string {
  const url = payload.url ?? APP_SHARE_URL;
  const suffix = ` ${url}`;
  const budget = 260 - suffix.length;
  const body = payload.text.replace(/\n{2,}/g, '\n').trim();
  if (body.length <= budget) return `${body}${suffix}`;
  return `${body.slice(0, Math.max(0, budget - 1)).trimEnd()}…${suffix}`;
}

async function openExternal(url: string): Promise<void> {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }
  await Linking.openURL(url);
}

export async function copyShareText(text: string): Promise<void> {
  await Clipboard.setStringAsync(text);
}

async function systemShare(payload: SharePayload): Promise<boolean> {
  try {
    const result = await Share.share(
      Platform.OS === 'ios'
        ? { title: payload.title, message: payload.text, url: payload.url }
        : { title: payload.title, message: payload.url ? `${payload.text}\n${payload.url}` : payload.text },
    );
    return result.action !== Share.dismissedAction;
  } catch {
    await copyShareText(payload.text);
    return false;
  }
}

export async function shareToChannel(
  channel: ShareChannelId,
  payload: SharePayload,
): Promise<ShareResult> {
  const encoded = encodeURIComponent(payload.text);
  const url = payload.url ?? APP_SHARE_URL;

  switch (channel) {
    case 'whatsapp':
      await openExternal(`https://wa.me/?text=${encoded}`);
      return { channel };
    case 'x':
      await openExternal(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText(payload))}`);
      return { channel };
    case 'telegram':
      await openExternal(
        `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encoded}`,
      );
      return { channel };
    case 'messages': {
      const sms =
        Platform.OS === 'ios' ? `sms:&body=${encoded}` : `sms:?body=${encoded}`;
      await openExternal(sms);
      return { channel };
    }
    case 'email':
      await openExternal(
        `mailto:?subject=${encodeURIComponent(payload.title)}&body=${encoded}`,
      );
      return { channel };
    case 'snapchat':
      await copyShareText(payload.text);
      if (Platform.OS !== 'web') {
        await systemShare(payload);
      }
      return {
        channel,
        copied: true,
        hint: Platform.OS === 'web' ? 'Copied — paste in Snapchat' : 'Copied. Choose Snapchat if it is installed.',
      };
    case 'copy':
      await copyShareText(payload.text);
      return { channel, copied: true, hint: 'Copied to clipboard' };
    case 'more': {
      const shared = await systemShare(payload);
      if (!shared) {
        await copyShareText(payload.text);
        return { channel, copied: true, hint: 'Copied to clipboard' };
      }
      return { channel };
    }
  }
}
