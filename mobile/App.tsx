import './global.css';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, View } from 'react-native';
import { AppModeProvider, useAppMode } from './src/hooks/useAppMode';
import HomeScreen from './src/screens/HomeScreen';
import KidsModeScreen from './src/screens/KidsModeScreen';
import { palette } from './src/theme/tokens';

function Shell() {
  const { isKids } = useAppMode();

  return (
    <View style={styles.page}>
      <StatusBar style={isKids ? 'dark' : 'dark'} />
      <View
        style={[
          styles.phone,
          { backgroundColor: isKids ? palette.kids.cream : palette.standard.paper },
        ]}
        accessibilityLabel="Stories of Islam mobile preview"
      >
        {isKids ? <KidsModeScreen /> : <HomeScreen />}
      </View>
    </View>
  );
}

export default function App() {
  return (
    <AppModeProvider>
      <Shell />
    </AppModeProvider>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#0C0A09',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { minHeight: '100vh' as unknown as number } : {}),
  },
  phone: {
    flex: 1,
    width: '100%',
    maxWidth: 430,
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? {
          width: 390,
          maxHeight: 844,
          height: 844,
          marginVertical: 24,
          borderRadius: 28,
          borderWidth: 8,
          borderColor: '#1C1917',
        }
      : {}),
  },
});
