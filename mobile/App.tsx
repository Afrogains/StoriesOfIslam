import './global.css';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Baby, Bookmark, Compass, Home, Radio } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppModeProvider, useAppMode } from './src/hooks/useAppMode';
import { LibraryProvider, useLibrary } from './src/hooks/useLibrary';
import ExploreScreen from './src/screens/ExploreScreen';
import HomeScreen from './src/screens/HomeScreen';
import KidsModeScreen from './src/screens/KidsModeScreen';
import LibraryScreen from './src/screens/LibraryScreen';
import RandomStoryPodcastScreen from './src/screens/RandomStoryPodcastScreen';
import {
  BODY_FONT_FAMILY,
  alpha,
  brandGradients,
  getColors,
  radius,
  shadow,
} from './src/theme/tokens';

type Tab = 'home' | 'explore' | 'podcast' | 'library' | 'kids';

type TabConfig = {
  id: Tab;
  label: string;
  icon: typeof Home;
  /** Which accent family lights up when the tab is active. */
  accent: 'emerald' | 'gold' | 'sunset';
};

const tabs: TabConfig[] = [
  { id: 'home', label: 'Home', icon: Home, accent: 'emerald' },
  { id: 'explore', label: 'Explore', icon: Compass, accent: 'emerald' },
  { id: 'podcast', label: 'Podcast', icon: Radio, accent: 'gold' },
  { id: 'library', label: 'Library', icon: Bookmark, accent: 'emerald' },
  { id: 'kids', label: 'Kids', icon: Baby, accent: 'sunset' },
];

function Shell() {
  const { isKids, isDark, setMode } = useAppMode();
  const { savedCount } = useLibrary();
  const [activeTab, setActiveTab] = useState<Tab>('home');

  const colors = getColors(isDark, isKids);

  const handleTabPress = (tab: Tab) => {
    setActiveTab(tab);
    setMode(tab === 'kids' ? 'kids' : 'standard');
  };

  // Kids mode owns the whole surface: switching it on from the header toggle
  // should swap the screen even if a standard tab is selected.
  const effectiveTab: Tab = isKids ? 'kids' : activeTab;

  const renderScreen = () => {
    switch (effectiveTab) {
      case 'kids':
        return <KidsModeScreen />;
      case 'explore':
        return <ExploreScreen />;
      case 'podcast':
        return <RandomStoryPodcastScreen />;
      case 'library':
        return <LibraryScreen />;
      case 'home':
      default:
        return <HomeScreen />;
    }
  };

  const accentFor = (accent: TabConfig['accent']) => {
    if (accent === 'sunset') return isDark ? '#FB923C' : '#EA580C';
    if (accent === 'gold') return isDark ? '#FBBF24' : '#B45309';
    return isDark ? '#2DD4BF' : '#0F766E';
  };

  const inactiveColor = isDark ? alpha(colors.inkSubtle, 0.8) : colors.inkSubtle;

  return (
    <View style={[styles.page, { backgroundColor: isDark ? '#02060C' : '#12100E' }]}>
      <StatusBar style="light" />

      <View
        style={[
          styles.phone,
          {
            backgroundColor: colors.paper,
            borderColor: isDark ? '#111C18' : '#1C1917',
          },
        ]}
        accessibilityLabel="Stories of Islam mobile preview"
      >
        <View style={styles.content}>{renderScreen()}</View>

        <View
          style={[
            styles.navBar,
            {
              backgroundColor: colors.navBg,
              borderTopColor: colors.navBorder,
            },
            shadow('lg', isDark),
          ]}
          accessibilityRole="tablist"
          accessibilityLabel="Primary navigation"
        >
          {tabs.map((tab) => {
            const active = effectiveTab === tab.id;
            const accent = accentFor(tab.accent);
            const Icon = tab.icon;
            const showBadge = tab.id === 'library' && savedCount > 0;

            return (
              <Pressable
                key={tab.id}
                onPress={() => handleTabPress(tab.id)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${tab.label} tab`}
                style={({ pressed }) => [styles.navItem, pressed && styles.navItemPressed]}
              >
                <View style={styles.iconSlot}>
                  {active ? (
                    <LinearGradient
                      colors={
                        tab.accent === 'sunset'
                          ? brandGradients.kidsSunset
                          : tab.accent === 'gold'
                          ? brandGradients.gold[isDark ? 'dark' : 'light']
                          : brandGradients.emerald[isDark ? 'dark' : 'light']
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.activePill}
                    >
                      <Icon size={18} color="#FFFFFF" />
                    </LinearGradient>
                  ) : (
                    <Icon size={19} color={inactiveColor} />
                  )}

                  {showBadge ? (
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: colors.gold, borderColor: colors.navBg },
                      ]}
                    >
                      <Text style={styles.badgeText}>{savedCount > 9 ? '9+' : savedCount}</Text>
                    </View>
                  ) : null}
                </View>

                <Text
                  style={[
                    styles.navLabel,
                    {
                      color: active ? accent : inactiveColor,
                      fontWeight: active ? '800' : '600',
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default function App() {
  return (
    <AppModeProvider>
      <LibraryProvider>
        <Shell />
      </LibraryProvider>
    </AppModeProvider>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { minHeight: '100vh' as unknown as number } : {}),
  },
  phone: {
    flex: 1,
    width: '100%',
    maxWidth: 430,
    overflow: 'hidden',
    position: 'relative',
    ...(Platform.OS === 'web'
      ? {
          width: 402,
          maxHeight: 868,
          height: 868,
          marginVertical: 24,
          borderRadius: 44,
          borderWidth: 9,
        }
      : {}),
  },
  content: { flex: 1 },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderTopWidth: 1,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    gap: 3,
  },
  navItemPressed: { opacity: 0.6 },
  iconSlot: { height: 30, justifyContent: 'center', alignItems: 'center' },
  activePill: {
    width: 42,
    height: 28,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -1,
    right: -6,
    minWidth: 15,
    height: 15,
    paddingHorizontal: 3,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: BODY_FONT_FAMILY,
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 11,
  },
  navLabel: {
    fontFamily: BODY_FONT_FAMILY,
    fontSize: 9.5,
    letterSpacing: 0.2,
  },
});
