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
import { migrateBabyProfiles } from '../src/lib/babyScope';
import { configureBackgroundAudio } from '../src/lib/audioMode';
import { MiniPlayer } from '../src/components/sounds/MiniPlayer';
import { SoundPlayerSheet } from '../src/components/sounds/SoundPlayerSheet';
import { useSoundPlayerStore, useSoundSheetStore } from '../src/store/soundPlayer';

SplashScreen.preventAutoHideAsync().catch(() => {});
SystemUI.setBackgroundColorAsync(palette.cream).catch(() => {});

export default function RootLayout() {
  const ready = useAppReady();
  const onboardingCompleted = useSettingsStore((s) => s.value.onboardingCompleted);

  const openSoundId = useSoundSheetStore((s) => s.openSoundId);
  const sheetContextIds = useSoundSheetStore((s) => s.contextIds);
  const openSheet = useSoundSheetStore((s) => s.open);
  const navigateTo = useSoundSheetStore((s) => s.navigateTo);
  const closeSheet = useSoundSheetStore((s) => s.close);
  const activeSoundIds = useSoundPlayerStore((s) => s.activeSoundIds);

  useEffect(() => {
    if (ready) {
      migrateBabyProfiles();
      seedDefaultMilestones();
      configureBackgroundAudio();
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

        <MiniPlayer
          onPress={() => {
            const activeId = activeSoundIds[0];
            if (activeId) openSheet(activeId, sheetContextIds);
          }}
        />
        <SoundPlayerSheet
          visible={!!openSoundId}
          soundId={openSoundId}
          contextIds={sheetContextIds}
          onNavigate={navigateTo}
          onClose={closeSheet}
        />

        <ToastHost />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
