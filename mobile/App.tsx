import './global.css';
import {
  createBottomTabNavigator,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { Bookmark, Compass, Home, Sparkles } from 'lucide-react-native';
import { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from 'react-native-safe-area-context';
import { AuthProvider } from './src/auth/AuthProvider';
import { CatalogProvider } from './src/data/CatalogProvider';
import { AppModeProvider, useAppMode } from './src/hooks/useAppMode';
import { ShareHostProvider } from './src/components/ShareSheet';
import { HighlightsProvider, useHighlights } from './src/hooks/useHighlights';
import { LibraryProvider, useLibrary } from './src/hooks/useLibrary';
import { useMobileLayout } from './src/hooks/useMobileLayout';
import ExploreScreen from './src/screens/ExploreScreen';
import HomeScreen from './src/screens/HomeScreen';
import LibraryScreen from './src/screens/LibraryScreen';
import NamesScreen from './src/screens/NamesScreen';
import {
  BODY_FONT_FAMILY,
  alpha,
  brandGradients,
  getColors,
  radius,
  shadow,
} from './src/theme/tokens';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

export type RootTabParamList = {
  Home: undefined;
  Explore: undefined;
  Names: undefined;
  Library: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 60_000, gcTime: 24 * 60 * 60 * 1000 },
  },
});

const tabs = {
  Home: { label: 'Home', icon: Home, accent: 'emerald' },
  Explore: { label: 'Explore', icon: Compass, accent: 'emerald' },
  Names: { label: 'Names', icon: Sparkles, accent: 'gold' },
  Library: { label: 'Library', icon: Bookmark, accent: 'emerald' },
} as const;

function PrimaryTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { isDark } = useAppMode();
  const { savedCount } = useLibrary();
  const { highlightCount } = useHighlights();
  const libraryBadge = savedCount + highlightCount;
  const { tabBarPadTop, tabBarPadBottom } = useMobileLayout();
  const colors = getColors(isDark);
  const inactiveColor = isDark ? alpha(colors.inkSubtle, 0.85) : colors.inkSubtle;

  return (
    <View
      style={[
        styles.navBar,
        {
          backgroundColor: colors.navBg,
          borderTopColor: colors.navBorder,
          paddingTop: tabBarPadTop,
          paddingBottom: tabBarPadBottom,
        },
        shadow('lg', isDark),
      ]}
      accessibilityRole="tablist"
    >
      {state.routes.map((route, index) => {
        const config = tabs[route.name as keyof typeof tabs];
        const active = state.index === index;
        const accent =
          config.accent === 'gold'
            ? isDark
              ? '#FBBF24'
              : '#B45309'
            : isDark
              ? '#34D399'
              : '#064E3B';
        const Icon = config.icon;
        return (
          <Pressable
            key={route.key}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            }}
            onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
            accessibilityRole="tab"
            accessibilityState={active ? { selected: true } : {}}
            accessibilityLabel={descriptors[route.key].options.tabBarAccessibilityLabel ?? config.label}
            style={({ pressed }) => [styles.navItem, pressed && styles.navItemPressed]}
          >
            <View style={styles.iconSlot}>
              {active ? (
                <LinearGradient
                  colors={
                    config.accent === 'gold'
                      ? brandGradients.gold[isDark ? 'dark' : 'light']
                      : brandGradients.emerald[isDark ? 'dark' : 'light']
                  }
                  style={styles.activePill}
                >
                  <Icon size={18} color="#FFFFFF" strokeWidth={2.25} />
                </LinearGradient>
              ) : (
                <View style={styles.inactiveIcon}>
                  <Icon size={20} color={inactiveColor} strokeWidth={2} />
                </View>
              )}
              {route.name === 'Library' && libraryBadge > 0 ? (
                <View style={[styles.badge, { backgroundColor: colors.gold, borderColor: colors.navBg }]}>
                  <Text style={styles.badgeText}>{libraryBadge > 9 ? '9+' : libraryBadge}</Text>
                </View>
              ) : null}
            </View>
            <Text
              numberOfLines={1}
              style={[styles.navLabel, { color: active ? accent : inactiveColor }]}
            >
              {config.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function AppNavigator() {
  const { isDark } = useAppMode();
  const linking = {
    prefixes: [Linking.createURL('/'), 'storiesofislam://'],
    config: {
      screens: {
        Home: '',
        Explore: 'explore',
        Names: 'names',
        Library: 'library',
      },
    },
  };

  return (
    <View style={[styles.page, { backgroundColor: isDark ? '#0F172A' : '#FCFBF7' }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.appSurface}>
        <NavigationContainer
          linking={linking}
          theme={isDark ? DarkTheme : DefaultTheme}
          documentTitle={{ formatter: (options) => `${options?.title ?? 'Home'} · Stories of Islam` }}
        >
          <Tab.Navigator
            initialRouteName="Home"
            tabBar={(props) => <PrimaryTabBar {...props} />}
            screenOptions={{ headerShown: false, lazy: true }}
          >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Explore" component={ExploreScreen} />
            <Tab.Screen name="Names" component={NamesScreen} options={{ title: 'The Names' }} />
            <Tab.Screen name="Library" component={LibraryScreen} />
          </Tab.Navigator>
        </NavigationContainer>
      </View>
    </View>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Inter: require('@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf'),
    PlusJakartaSans: require(
      '@expo-google-fonts/plus-jakarta-sans/400Regular/PlusJakartaSans_400Regular.ttf',
    ),
    UthmanicHafs: require('./assets/fonts/UthmanicHafs1Ver18.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CatalogProvider>
            <AppModeProvider>
              <LibraryProvider>
                <HighlightsProvider>
                  <ShareHostProvider>
                    <AppNavigator />
                  </ShareHostProvider>
                </HighlightsProvider>
              </LibraryProvider>
            </AppModeProvider>
          </CatalogProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: 'center',
    ...(Platform.OS === 'web' ? { minHeight: '100vh' as unknown as number } : {}),
  },
  appSurface: {
    flex: 1,
    width: '100%',
    maxWidth: 720,
    overflow: 'hidden',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    gap: 3,
    paddingHorizontal: 2,
  },
  navItemPressed: { opacity: 0.65 },
  iconSlot: {
    width: 44,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveIcon: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePill: {
    width: 44,
    height: 28,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: 0,
    minWidth: 16,
    height: 16,
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
  },
  navLabel: {
    fontFamily: BODY_FONT_FAMILY,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
});
