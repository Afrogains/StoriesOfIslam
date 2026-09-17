import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Headphones,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
} from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  NativeSyntheticEvent,
  NativeTouchEvent,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import {
  THE_NAMES_ARTWORK_URL,
  type NameAudioEpisode,
} from '../data/theNamesAudio';
import type { DivineName } from '../data/theNames';
import { THE_NAMES_SERIES } from '../data/theNames';
import { formatClock } from '../types/reader';
import { alpha, brandGradients, radius, shadow } from '../theme/tokens';
import {
  Body,
  Caption,
  Mono,
  Overline,
  PlayButton,
  Row,
  Small,
  useTheme,
} from './ui';

type NamesAudioPlayerProps = {
  name: DivineName;
  episode: NameAudioEpisode | null;
};

export default function NamesAudioPlayer({ name, episode }: NamesAudioPlayerProps) {
  const { colors, isDark } = useTheme();
  const goldGradient = brandGradients.gold[isDark ? 'dark' : 'light'];
  const barWidth = useRef(1);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  const player = useAudioPlayer(
    episode?.audioUrl ? { uri: episode.audioUrl } : null,
    { updateInterval: 250, keepAudioSessionActive: true },
  );
  const status = useAudioPlayerStatus(player);
  const ready = status.isLoaded;

  useEffect(() => {
    if (!status.isLoaded) return;
    setPositionMs(Math.round(status.currentTime * 1000));
    if (status.duration) setDurationMs(Math.round(status.duration * 1000));
    setPlaying(status.playing);
  }, [status]);

  useEffect(() => {
    let alive = true;
    setAudioError(null);
    setPositionMs(0);
    setDurationMs(0);
    setPlaying(false);

    if (!episode?.audioUrl) {
      return () => {
        alive = false;
      };
    }

    (async () => {
      try {
        await setAudioModeAsync({
          allowsRecording: false,
          playsInSilentMode: true,
          shouldPlayInBackground: true,
          interruptionMode: 'doNotMix',
          shouldRouteThroughEarpiece: false,
        });
        if (!alive) return;
        player.setActiveForLockScreen(true, {
          title: `${name.transliteration} · ${name.meaning}`,
          artist: THE_NAMES_SERIES.credit,
          artworkUrl: THE_NAMES_ARTWORK_URL,
        });
      } catch {
        if (alive) {
          setAudioError('Audio could not be loaded. Check your connection and try again.');
        }
      }
    })();

    return () => {
      alive = false;
      try {
        player.pause();
        player.clearLockScreenControls();
      } catch {
        // Player may already be released when switching names.
      }
    };
  }, [episode?.audioUrl, name.transliteration, name.meaning, player]);

  const togglePlay = () => {
    if (!ready || !episode) return;
    if (playing) player.pause();
    else player.play();
  };

  const seekTo = async (ms: number) => {
    if (!ready) return;
    const clamped = Math.max(0, Math.min(ms, durationMs || ms));
    await player.seekTo(clamped / 1000);
    setPositionMs(clamped);
  };

  const onScrub = (event: NativeSyntheticEvent<NativeTouchEvent>) => {
    const ratio = Math.max(0, Math.min(1, event.nativeEvent.locationX / barWidth.current));
    void seekTo(ratio * (durationMs || 0));
  };

  const progress = durationMs ? positionMs / durationMs : 0;

  if (!episode) {
    return (
      <View
        style={[
          styles.shell,
          {
            backgroundColor: isDark ? alpha(colors.gold, 0.1) : colors.goldSoft,
            borderColor: colors.border,
          },
        ]}
        accessibilityLabel="Podcast audio coming soon"
      >
        <Row gap={10} align="center">
          <View style={[styles.iconWrap, { backgroundColor: alpha(colors.gold, 0.18) }]}>
            <Headphones size={16} color={colors.gold} />
          </View>
          <View style={styles.copy}>
            <Overline color={colors.gold}>Podcast episode</Overline>
            <Small color={colors.inkMuted} style={styles.comingSoon}>
              Audio for {name.transliteration} is not in the published series yet.
              Episodes from {THE_NAMES_SERIES.credit} unlock as they are released.
            </Small>
          </View>
        </Row>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.shell,
        {
          backgroundColor: colors.cardAlt,
          borderColor: colors.border,
        },
        shadow('sm', isDark),
      ]}
      accessibilityLabel={`Podcast player for ${name.transliteration}`}
    >
      <Row gap={10} align="center">
        <View style={[styles.iconWrap, { backgroundColor: alpha(colors.gold, 0.18) }]}>
          <Headphones size={16} color={colors.gold} />
        </View>
        <View style={styles.copy}>
          <Overline color={colors.gold}>
            {episode.episodeNumber != null
              ? `Episode ${episode.episodeNumber}`
              : 'Podcast episode'}
            {episode.durationLabel ? ` · ${episode.durationLabel}` : ''}
          </Overline>
          <Body numberOfLines={2} style={styles.episodeTitle}>
            {episode.episodeTitle}
          </Body>
          <Caption color={colors.inkMuted} numberOfLines={1}>
            {episode.source}
          </Caption>
        </View>
      </Row>

      {audioError ? (
        <Caption color={colors.inkMuted} style={styles.error}>
          {audioError}
        </Caption>
      ) : null}

      <Row gap={12} align="center" style={styles.transport}>
        <PlayButton
          playing={playing}
          onPress={togglePlay}
          gradient={goldGradient}
          size={48}
          icons={{ play: Play, pause: Pause }}
          disabled={!ready}
          accessibilityLabel={playing ? 'Pause episode' : 'Play episode'}
        />

        <View style={styles.progressBlock}>
          <Mono color={colors.inkMuted}>
            {formatClock(positionMs)} / {formatClock(durationMs)}
          </Mono>
          <Pressable
            onLayout={(event) => {
              barWidth.current = event.nativeEvent.layout.width || 1;
            }}
            onPress={onScrub}
            style={[styles.scrubTrack, { backgroundColor: alpha(colors.ink, 0.12) }]}
            accessibilityRole="adjustable"
            accessibilityLabel="Playback progress"
            accessibilityValue={{
              now: Math.round(positionMs / 1000),
              min: 0,
              max: Math.round(durationMs / 1000),
            }}
          >
            <LinearGradient
              colors={goldGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.scrubFill, { width: `${progress * 100}%` }]}
            />
          </Pressable>
        </View>
      </Row>

      <Row gap={8} style={styles.skipRow}>
        <SkipChip
          label="15"
          icon={RotateCcw}
          onPress={() => void seekTo(positionMs - 15_000)}
          accessibilityLabel="Rewind 15 seconds"
          disabled={!ready}
          colors={colors}
        />
        <SkipChip
          label="15"
          icon={RotateCw}
          onPress={() => void seekTo(positionMs + 15_000)}
          accessibilityLabel="Forward 15 seconds"
          disabled={!ready}
          colors={colors}
        />
        <Caption color={colors.inkSubtle} style={styles.bgHint}>
          Continues when the app is minimized
        </Caption>
      </Row>
    </View>
  );
}

function SkipChip({
  label,
  icon: Icon,
  onPress,
  accessibilityLabel,
  disabled,
  colors,
}: {
  label: string;
  icon: typeof RotateCcw;
  onPress: () => void;
  accessibilityLabel: string;
  disabled?: boolean;
  colors: { card: string; ink: string; border: string };
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.skipChip,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
        },
      ]}
    >
      <Icon size={12} color={colors.ink} />
      <Caption>{label}</Caption>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 14,
    gap: 12,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, gap: 2 },
  comingSoon: { lineHeight: 18 },
  episodeTitle: { lineHeight: 20 },
  error: { lineHeight: 18 },
  transport: { marginTop: 2 },
  progressBlock: { flex: 1, gap: 6 },
  scrubTrack: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  scrubFill: { height: 5, borderRadius: 3 },
  skipRow: { alignItems: 'center' },
  skipChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  bgHint: { flex: 1, marginLeft: 4 },
});
