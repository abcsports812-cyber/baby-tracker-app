import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Redirect, Stack, SplashScreen } from 'expo-router';
import * as SystemUI from 'expo-system-ui';
import { StatusBar } from 'expo-status-bar';
import { palette } from '../src/theme';
import { useAppReady } from '../src/hooks/useAppReady';
import { useSettingsStore } from '../src/store';
import { ToastHost } from '../src/components/ui/Toast';
import { seedDefaultMilestones } from '../src/lib/seed';

SplashScreen.preventAutoHideAsync().catch(() => {});
SystemUI.setBackgroundColorAsync(palette.cream).catch(() => {});

export default function RootLayout() {
  const ready = useAppReady();
  const onboardingCompleted = useSettingsStore((s) => s.value.onboardingCompleted);

  useEffect(() => {
    if (ready) {
      seedDefaultMilestones();
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.cream } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        </Stack>
        {!onboardingCompleted && <Redirect href="/onboarding" />}
        <ToastHost />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
