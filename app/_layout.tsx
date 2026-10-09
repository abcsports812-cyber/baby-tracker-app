import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, Stack, SplashScreen, type ErrorBoundaryProps } from 'expo-router';
import * as SystemUI from 'expo-system-ui';
import { StatusBar } from 'expo-status-bar';
import { Button } from '../src/components/ui/Button';
import { fontSize, palette, spacing } from '../src/theme';
import { useAppReady } from '../src/hooks/useAppReady';
import { useSettingsStore } from '../src/store';
import { ToastHost } from '../src/components/ui/Toast';
import { seedDefaultMilestones } from '../src/lib/seed';
import { migrateBabyProfiles } from '../src/lib/babyScope';
import { configureBackgroundAudio } from '../src/lib/audioMode';
import { MiniPlayer } from '../src/components/sounds/MiniPlayer';
import { SoundPlayerSheet } from '../src/components/sounds/SoundPlayerSheet';
import { useSoundPlayerStore, useSoundSheetStore } from '../src/store/soundPlayer';

/** Expo Router's supported per-route error boundary — exporting it from the
 * root layout catches errors thrown anywhere in this file's own render tree
 * (including RootLayout itself), giving every screen a shared crash fallback
 * instead of a blank/white screen. `retry` remounts the failed subtree, so a
 * transient error (e.g. a bad navigation state) can recover without forcing
 * a full app reload. */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.errorScreen}>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorMessage}>
          Zoni Baby ran into an unexpected problem. Your data is safe on this device — try again below.
        </Text>
        {__DEV__ && (
          <Text style={styles.errorDetail} numberOfLines={4}>
            {error.message}
          </Text>
        )}
        <Button label="Try again" onPress={() => { retry(); }} style={{ marginTop: spacing.xl }} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

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

const styles = StyleSheet.create({
  errorScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: palette.cream,
  },
  errorTitle: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: palette.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: fontSize.md,
    color: palette.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
  errorDetail: {
    fontSize: fontSize.xs,
    color: palette.textFaint,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
