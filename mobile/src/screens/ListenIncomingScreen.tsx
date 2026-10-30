import { BookOpen, Headphones, X } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import ListenIncomingNotice from '../components/ListenIncomingNotice';
import {
  LISTEN_INCOMING_OVERLINE,
  LISTEN_INCOMING_TITLE,
} from '../data/listenIncoming';
import type { StoryItem } from '../types/catalog';
import { sectionsMeta } from '../data/catalogMeta';
import { useMobileLayout } from '../hooks/useMobileLayout';
import { radius, sectionAccent } from '../theme/tokens';
import {
  BodyStrong,
  Caption,
  GradientButton,
  Overline,
  Title,
  useTheme,
} from '../components/ui';

type ListenIncomingScreenProps = {
  story: StoryItem;
  onClose: () => void;
  onRead: () => void;
};

/** Full-screen placeholder if Listen is opened while the feature is incoming. */
export default function ListenIncomingScreen({
  story,
  onClose,
  onRead,
}: ListenIncomingScreenProps) {
  const { colors, isDark } = useTheme();
  const { topInset } = useMobileLayout();
  const accent = sectionAccent(story.sectionSlug, isDark);
  const meta = sectionsMeta[story.sectionSlug];

  return (
    <View style={[styles.screen, { backgroundColor: colors.paper }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: isDark ? colors.card : '#F7F3EA',
            borderBottomColor: colors.border,
            paddingTop: topInset + 10,
          },
        ]}
      >
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={({ pressed }) => [
            styles.iconBtn,
            {
              backgroundColor: isDark ? colors.cardAlt : '#FFFFFF',
              borderColor: colors.border,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <X size={18} color={colors.ink} />
        </Pressable>
        <View style={styles.headerMeta}>
          <Overline color={accent.primary}>{LISTEN_INCOMING_OVERLINE}</Overline>
          <Caption color={colors.inkMuted} numberOfLines={1}>
            {LISTEN_INCOMING_TITLE}
          </Caption>
        </View>
        <View style={[styles.iconBtn, { backgroundColor: accent.surface, borderColor: accent.primary }]}>
          <Headphones size={16} color={accent.primary} />
        </View>
      </View>

      <View style={styles.body}>
        <Caption color={colors.inkSubtle}>{meta.title}</Caption>
        <Title style={styles.title}>{story.title}</Title>
        <BodyStrong color={colors.inkMuted} style={styles.figure}>
          {story.figureName} · {story.honorific}
        </BodyStrong>
        <ListenIncomingNotice />
        <GradientButton
          label="Read this story"
          icon={BookOpen}
          gradient={accent.accentGradient}
          onPress={onRead}
          accessibilityLabel={`Read story: ${story.title}`}
          style={styles.readBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerMeta: { flex: 1, minWidth: 0, gap: 2 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 28,
    gap: 12,
  },
  title: { marginTop: 2 },
  figure: { marginBottom: 8 },
  readBtn: { marginTop: 8, width: '100%' },
});
