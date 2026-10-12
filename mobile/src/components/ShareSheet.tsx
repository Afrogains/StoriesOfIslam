import {
  Copy,
  Mail,
  MessageCircle,
  MessageSquare,
  Send,
  Share2,
} from 'lucide-react-native';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  shareToChannel,
  type ShareChannelId,
  type SharePayload,
} from '../services/share';
import {
  BODY_FONT_FAMILY,
  alpha,
  radius,
  shadow,
} from '../theme/tokens';
import { Body, Caption, Overline, Small, Title, useTheme } from './ui';

type Channel = {
  id: ShareChannelId;
  label: string;
  color: string;
  ink: string;
  Icon: typeof Share2;
};

const CHANNELS: Channel[] = [
  { id: 'whatsapp', label: 'WhatsApp', color: '#25D366', ink: '#FFFFFF', Icon: MessageCircle },
  { id: 'x', label: 'X', color: '#0F1419', ink: '#FFFFFF', Icon: Share2 },
  { id: 'snapchat', label: 'Snapchat', color: '#FFFC00', ink: '#0F1419', Icon: MessageSquare },
  { id: 'telegram', label: 'Telegram', color: '#229ED9', ink: '#FFFFFF', Icon: Send },
  { id: 'messages', label: 'Messages', color: '#34C759', ink: '#FFFFFF', Icon: MessageSquare },
  { id: 'email', label: 'Email', color: '#EA4335', ink: '#FFFFFF', Icon: Mail },
  { id: 'copy', label: 'Copy', color: '#0F766E', ink: '#FFFFFF', Icon: Copy },
  { id: 'more', label: 'More', color: '#334155', ink: '#FFFFFF', Icon: Share2 },
];

type ShareSheetProps = {
  visible: boolean;
  payload: SharePayload | null;
  onClose: () => void;
};

export default function ShareSheet({ visible, payload, onClose }: ShareSheetProps) {
  const { colors, isDark } = useTheme();
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) setStatus(null);
  }, [visible]);

  const preview = useMemo(() => {
    if (!payload) return '';
    return payload.text.length > 280 ? `${payload.text.slice(0, 279).trimEnd()}…` : payload.text;
  }, [payload]);

  const send = useCallback(
    async (channel: ShareChannelId) => {
      if (!payload) return;
      const result = await shareToChannel(channel, payload);
      if (result.hint) {
        setStatus(result.hint);
        return;
      }
      if (channel === 'more') onClose();
      else setStatus(`Opened ${channel === 'x' ? 'X' : channel}`);
    },
    [onClose, payload],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        style={[styles.scrim, { backgroundColor: colors.scrim }]}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Dismiss share sheet"
      >
        <Pressable
          onPress={() => undefined}
          style={[
            styles.sheet,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
            shadow('lg', isDark),
          ]}
        >
          <View style={[styles.handle, { backgroundColor: alpha(colors.inkSubtle, 0.35) }]} />
          <Overline color={colors.emerald}>Share</Overline>
          <Title style={styles.title} numberOfLines={2}>
            {payload?.title ?? 'Stories of Islam'}
          </Title>
          <ScrollView
            style={styles.previewScroll}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
          >
            <Small color={colors.inkMuted} style={styles.preview}>
              {preview}
            </Small>
          </ScrollView>

          <View style={styles.grid}>
            {CHANNELS.map((channel) => (
              <Pressable
                key={channel.id}
                onPress={() => void send(channel.id)}
                accessibilityRole="button"
                accessibilityLabel={`Share via ${channel.label}`}
                style={({ pressed }) => [styles.cell, pressed && styles.pressed]}
              >
                <View style={[styles.icon, { backgroundColor: channel.color }]}>
                  <channel.Icon size={18} color={channel.ink} strokeWidth={2.25} />
                </View>
                <Caption color={colors.inkMuted} style={styles.cellLabel}>
                  {channel.label}
                </Caption>
              </Pressable>
            ))}
          </View>

          {status ? (
            <Body color={colors.emerald} style={styles.status}>
              {status}
            </Body>
          ) : (
            <Caption color={colors.inkSubtle} style={styles.hint}>
              WhatsApp, X, Snapchat, and the rest of your apps
            </Caption>
          )}

          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close share sheet"
            style={({ pressed }) => [
              styles.cancel,
              { borderColor: colors.border, backgroundColor: colors.cardAlt },
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.cancelLabel, { color: colors.ink }]}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

type ShareHostState = {
  openShare: (payload: SharePayload) => void;
};

const ShareHostContext = createContext<ShareHostState | null>(null);

export function ShareHostProvider({ children }: { children: ReactNode }) {
  const [payload, setPayload] = useState<SharePayload | null>(null);
  const openShare = useCallback((next: SharePayload) => {
    setPayload(next);
  }, []);
  return (
    <ShareHostContext.Provider value={{ openShare }}>
      {children}
      <ShareSheet visible={Boolean(payload)} payload={payload} onClose={() => setPayload(null)} />
    </ShareHostContext.Provider>
  );
}

export function useShareSheet() {
  const context = useContext(ShareHostContext);
  if (!context) {
    throw new Error('useShareSheet must be used inside a ShareHostProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 18,
  },
  sheet: {
    borderRadius: radius['2xl'],
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 16,
    gap: 8,
    maxHeight: '86%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 6,
  },
  title: { fontSize: 18, lineHeight: 24 },
  previewScroll: { maxHeight: 120 },
  preview: { lineHeight: 18 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  cell: {
    width: '25%',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellLabel: { fontWeight: '700' },
  status: { textAlign: 'center', fontWeight: '700' },
  hint: { textAlign: 'center' },
  cancel: {
    marginTop: 6,
    borderWidth: 1,
    borderRadius: radius.xl,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelLabel: {
    fontFamily: BODY_FONT_FAMILY,
    fontWeight: '800',
    fontSize: 14,
  },
  pressed: { opacity: 0.86 },
});
