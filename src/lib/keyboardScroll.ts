export interface FocusScrollParams {
  /** The focused field's Y position relative to the scroll content. */
  inputTop: number;
  /** The ScrollView's current contentOffset.y. */
  currentScrollOffset: number;
  /** Gap to leave above the field once scrolled into place. */
  topMargin?: number;
  /** Skip scrolling if already within this many px of the target, to avoid jittering on every re-focus. */
  minDelta?: number;
}

/**
 * Where a FormSheet's ScrollView should scroll to so a just-focused (or
 * growing, multiline) field stays clear of the on-screen keyboard.
 *
 * Deliberately independent of the keyboard's actual height: on Android,
 * content rendered inside a `Modal` sits in its own Dialog window, and the
 * `Keyboard` module's `keyboardDidShow`/`keyboardDidHide` events are only
 * ever emitted from the Activity's root view (see ReactRootView.java's
 * `CustomGlobalLayoutListener`), not from a Dialog's content -- so neither
 * `KeyboardAvoidingView` nor `ScrollView`'s own built-in keyboard-aware
 * scrolling can be trusted to fire inside a FormSheet. Scrolling the
 * focused field up near the top of the sheet instead works regardless of
 * whether that event ever arrives, since a bottom-anchored keyboard can't
 * cover content that's already away from the bottom.
 */
export function computeFocusScrollOffset({
  inputTop,
  currentScrollOffset,
  topMargin = 24,
  minDelta = 8,
}: FocusScrollParams): number | null {
  const target = Math.max(inputTop - topMargin, 0);
  if (Math.abs(target - currentScrollOffset) < minDelta) {
    return null;
  }
  return target;
}
