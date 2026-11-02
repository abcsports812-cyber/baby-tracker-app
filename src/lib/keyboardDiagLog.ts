// TEMPORARY DIAGNOSTIC LOGGING -- added solely to capture real Android device
// behavior for the still-unresolved keyboard shaking investigation. Every call
// is tagged "KBD_DIAG" so a single `adb logcat | grep KBD_DIAG` captures every
// line below alongside the native module's own matching-tagged Log.d calls
// (see DialogKeyboardInsetsView.kt). Remove this file and every `kbdLog(...)`
// call site once the root cause is confirmed from real device logs -- this is
// not meant to ship.
let seq = 0;

export function kbdLog(event: string, data?: Record<string, unknown>): void {
  seq += 1;
  console.log(`KBD_DIAG #${seq} t=${Date.now()} ${event}`, data ?? {});
}
