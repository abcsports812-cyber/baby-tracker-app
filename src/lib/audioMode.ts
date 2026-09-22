import { setAudioModeAsync } from 'expo-audio';

let configured = false;

/** Enables background playback for the Sounds feature: soothing sounds keep
 * playing when the app is backgrounded or the screen locks, silent-mode
 * switch is respected, and this app takes exclusive audio focus (required
 * for reliable lock-screen / notification transport controls). Safe to
 * call multiple times; only applies once. */
export async function configureBackgroundAudio() {
  if (configured) return;
  configured = true;
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    });
  } catch {
    // best-effort: playback still works in-foreground if this fails
  }
}
