/**
 * Given a visibility reading from DialogKeyboardObserver (backed by
 * modules/dialog-keyboard-insets' native WindowInsets listener), which action
 * KeyboardAwareScroll.tsx's useKeyboardAwareScrollRefs should take. Extracted as its
 * own pure function, rather than left inline, so the actual branching used in
 * production (handleDialogKeyboardChange) is what's covered by tests, not a parallel
 * copy of it.
 */
export type DialogKeyboardAction = 'restore' | 'clear';

export function dialogKeyboardAction(visible: boolean): DialogKeyboardAction {
  return visible ? 'restore' : 'clear';
}

export interface DialogKeyboardInsetsState {
  visible: boolean | null;
  /** Raw native pixels, mirroring DialogKeyboardInsetsView.kt's own `lastHeightPx` --
   * the Kotlin dedupe check happens before the px->dp conversion applied at emission,
   * so this model dedupes in the same (px) unit. Not the same unit as
   * effectiveViewportHeight's `keyboardHeightDp` parameter below. */
  height: number;
}

/** Mirrors DialogKeyboardInsetsView.kt's initial `lastVisible = null` / `lastHeight = -1`
 * fields, and the same reset it performs in onDetachedFromWindow. */
export const INITIAL_DIALOG_KEYBOARD_INSETS_STATE: DialogKeyboardInsetsState = {
  visible: null,
  height: -1,
};

export interface DialogKeyboardInsetsReading {
  visible: boolean;
  height: number;
}

export interface DialogKeyboardInsetsReduction {
  state: DialogKeyboardInsetsState;
  /** null when this reading was a duplicate of the last one and nothing should fire. */
  event: DialogKeyboardInsetsReading | null;
}

/**
 * A pure-TypeScript model of DialogKeyboardInsetsView.kt's onApplyWindowInsetsListener
 * dedupe logic -- the actual decision ("did anything change since last time?") lives in
 * Kotlin and runs on-device, so this doesn't execute that code; it mirrors its exact
 * semantics so the algorithm itself (not just the JS side's reaction to it) has a
 * regression guard, the same way clampScrollOffset models native ScrollView.scrollTo()'s
 * clamping without being able to call into it directly from Node.
 *
 * Guards against two real risks: (1) a WindowInsets dispatch for an unrelated change
 * (status/navigation bar, rotation) re-announcing the same keyboard state and causing
 * duplicate restore/clear calls across the bridge, and (2) the opposite mistake -- a
 * dedupe that never resets would, after the view detaches and reattaches while the
 * keyboard is already open, wrongly suppress re-announcing that same (visible: true,
 * height: X) state to the new instance. Resetting to INITIAL_DIALOG_KEYBOARD_INSETS_STATE
 * on detach (mirroring Kotlin's onDetachedFromWindow) avoids that.
 */
export function reduceDialogKeyboardInsets(
  state: DialogKeyboardInsetsState,
  reading: DialogKeyboardInsetsReading,
): DialogKeyboardInsetsReduction {
  if (reading.visible === state.visible && reading.height === state.height) {
    return { state, event: null };
  }
  return {
    state: { visible: reading.visible, height: reading.height },
    event: reading,
  };
}

/**
 * The space actually free of the keyboard, for a ScrollView living inside a FormSheet
 * Modal. `measuredViewportHeight` (the ScrollView's own onLayout height) never shrinks
 * when the keyboard opens there -- the Modal's Dialog window is forced edge-to-edge
 * whenever the app-wide edge-to-edge flag is on (see ReactModalHostView.kt's
 * `navigationBarTranslucent` getter), and under edge-to-edge, SOFT_INPUT_ADJUST_RESIZE
 * doesn't actually resize the window; the IME only arrives as an inset. So
 * measuredViewportHeight stays at its pre-keyboard size the entire time the keyboard is
 * open, stale by exactly the keyboard's height -- this corrects for that using the real
 * height DialogKeyboardObserver reports, which computeFocusScrollOffset/
 * neededExtraBottomPadding need in order to target the space that's actually visible,
 * not the space the ScrollView merely occupies.
 *
 * BOTH parameters must already be in React Native logical pixels ("dp"/"points"), the
 * same unit onLayout/measureLayout/scrollTo use. `keyboardHeightDp` is NOT the raw
 * value WindowInsetsCompat reports on the native side (that's physical pixels, which
 * scale with display density and would silently over-subtract here on any device
 * denser than 1.0x) -- DialogKeyboardInsetsView.kt converts it exactly once, via
 * PixelUtil.pxToDp(), before it ever reaches JS. Nothing on the JS side should ever
 * divide it by density again.
 */
export function effectiveViewportHeight(measuredViewportHeight: number, keyboardHeightDp: number): number {
  return Math.max(measuredViewportHeight - keyboardHeightDp, 0);
}

/**
 * Pure-TS model of PixelUtil.toDIPFromPixel -- react-native's own px->dp conversion
 * (`value / density`), the exact formula DialogKeyboardInsetsView.kt applies via its
 * `pxToDp()` extension before emitting `heightDp`. This doesn't run on-device or
 * execute that Kotlin code; it exists purely to give the conversion formula itself (and
 * its density-independence) a regression guard, the same way reduceDialogKeyboardInsets
 * models the native dedupe logic and clampScrollOffset models native ScrollView
 * clamping -- none of them run the real native code, only its documented behavior.
 */
export function imeHeightPxToDp(imeHeightPx: number, density: number): number {
  return imeHeightPx / density;
}
