import './global.css';
import { Inter_400Regular } from '@expo-google-fonts/inter';
import { PlusJakartaSans_400Regular } from '@expo-google-fonts/plus-jakarta-sans';
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
import { Baby, Bookmark, Compass, Home, Radio } from 'lucide-react-native';
import { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/auth/AuthProvider';
import { CatalogProvider } from './src/data/CatalogProvider';
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

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

export type RootTabParamList = {
  Home: undefined;
  Explore: undefined;
  Podcast: undefined;
  Library: undefined;
  Kids: undefined;
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
  Podcast: { label: 'Podcast', icon: Radio, accent: 'gold' },
  Library: { label: 'Library', icon: Bookmark, accent: 'emerald' },
  Kids: { label: 'Kids', icon: Baby, accent: 'sunset' },
} as const;

function PrimaryTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { isDark, isKids, setMode } = useAppMode();
  const { savedCount } = useLibrary();
  const colors = getColors(isDark, isKids);
  const inactiveColor = isDark ? alpha(colors.inkSubtle, 0.8) : colors.inkSubtle;

  return (
    <View
      style={[
        styles.navBar,
        { backgroundColor: colors.navBg, borderTopColor: colors.navBorder },
        shadow('lg', isDark),
      ]}
      accessibilityRole="tablist"
    >
      {state.routes.map((route, index) => {
        const config = tabs[route.name as keyof typeof tabs];
        const active = state.index === index;
        const accent =
          config.accent === 'sunset'
            ? isDark ? '#FB923C' : '#EA580C'
            : config.accent === 'gold'
              ? isDark ? '#FBBF24' : '#B45309'
              : isDark ? '#2DD4BF' : '#0F766E';
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
                setMode(route.name === 'Kids' ? 'kids' : 'standard');
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
                    config.accent === 'sunset'
                      ? brandGradients.kidsSunset
                      : config.accent === 'gold'
                        ? brandGradients.gold[isDark ? 'dark' : 'light']
                        : brandGradients.emerald[isDark ? 'dark' : 'light']
                  }
                  style={styles.activePill}
                >
                  <Icon size={18} color="#FFFFFF" />
                </LinearGradient>
              ) : (
                <Icon size={19} color={inactiveColor} />
              )}
              {route.name === 'Library' && savedCount > 0 ? (
                <View style={[styles.badge, { backgroundColor: colors.gold, borderColor: colors.navBg }]}>
                  <Text style={styles.badgeText}>{savedCount > 9 ? '9+' : savedCount}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.navLabel, { color: active ? accent : inactiveColor }]}>
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
        Podcast: 'podcast',
        Library: 'library',
        Kids: 'kids',
      },
    },
  };

  return (
    <View style={[styles.page, { backgroundColor: isDark ? '#02060C' : '#E9E3D6' }]}>
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
            <Tab.Screen name="Podcast" component={RandomStoryPodcastScreen} />
            <Tab.Screen name="Library" component={LibraryScreen} />
            <Tab.Screen name="Kids" component={KidsModeScreen} />
          </Tab.Navigator>
        </NavigationContainer>
      </View>
    </View>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Inter: Inter_400Regular,
    PlusJakartaSans: PlusJakartaSans_400Regular,
    UthmanicHafs: require('./assets/fonts/UthmanicHafs1Ver18.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CatalogProvider>
            <AppModeProvider>
              <LibraryProvider>
                <AppNavigator />
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
  navItemPressed: { opacity: 0.65 },
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
  },
  navLabel: {
    fontFamily: BODY_FONT_FAMILY,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
