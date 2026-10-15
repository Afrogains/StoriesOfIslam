import { Headphones } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import {
  LISTEN_INCOMING_BODY,
  LISTEN_INCOMING_OVERLINE,
  LISTEN_INCOMING_TITLE,
} from '../data/listenIncoming';
import { alpha, radius } from '../theme/tokens';
import { Body, Caption, Overline, Row, useTheme } from './ui';

/** Compact coming-soon panel for Listen entry points that still need to expand. */
export default function ListenIncomingNotice({
  tone = 'light',
}: {
  tone?: 'light' | 'dark';
}) {
  const { colors, isDark } = useTheme();
  const dark = tone === 'dark';
  const ink = dark ? '#E2E8F0' : colors.ink;
  const muted = dark ? '#94A3B8' : colors.inkMuted;
  const gold = dark ? '#FDE68A' : colors.gold;

  return (
    <View
      style={[
        styles.panel,
        {
          backgroundColor: dark
            ? 'rgba(15,23,42,0.4)'
            : isDark
              ? alpha(colors.gold, 0.12)
              : colors.goldSoft,
          borderColor: dark ? 'rgba(253,230,138,0.22)' : colors.gold,
        },
      ]}
      accessibilityRole="text"
      accessibilityLabel={`${LISTEN_INCOMING_TITLE}. ${LISTEN_INCOMING_BODY}`}
    >
      <Row gap={8} align="center">
        <Headphones size={14} color={gold} />
        <Overline color={gold}>{LISTEN_INCOMING_OVERLINE}</Overline>
      </Row>
      <Caption color={ink} style={styles.title}>
        {LISTEN_INCOMING_TITLE}
      </Caption>
      <Body color={muted} style={styles.body}>
        {LISTEN_INCOMING_BODY}
      </Body>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 12,
    gap: 6,
  },
  title: { fontWeight: '800', marginTop: 2 },
  body: { lineHeight: 19 },
});
