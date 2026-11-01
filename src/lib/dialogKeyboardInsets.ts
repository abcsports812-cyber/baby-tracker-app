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
