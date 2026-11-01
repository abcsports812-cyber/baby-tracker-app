export interface FocusScrollParams {
  /** The focused field's Y position relative to the scroll content. */
  inputTop: number;
  /** The focused field's current rendered height. For an unbounded
   * multiline field (no maxHeight) this grows as the user types, which is
   * exactly the case this needs to track -- see computeFocusScrollOffset's
   * doc comment. */
  inputHeight: number;
  /** The ScrollView's current contentOffset.y. */
  currentScrollOffset: number;
  /** The ScrollView's own visible (layout) height -- not its content height. */
  viewportHeight: number;
  /** Gap to leave above the field's top edge once scrolled into place. */
  topMargin?: number;
  /** Gap to leave below the field's bottom edge once scrolled into place. */
  bottomMargin?: number;
  /** Skip scrolling if the adjustment is smaller than this many px, to avoid jittering on every re-focus/keystroke. */
  minDelta?: number;
}

/**
 * Where a FormSheet's (or Screen's) ScrollView should scroll to so a
 * just-focused -- or growing, multiline -- field stays clear of the
 * on-screen keyboard.
 *
 * Deliberately independent of the keyboard's actual height: on Android,
 * content rendered inside a `Modal` sits in its own Dialog window, and the
 * `Keyboard` module's `keyboardDidShow`/`keyboardDidHide` events are only
 * ever emitted from the Activity's root view (see ReactRootView.java's
 * `CustomGlobalLayoutListener`), not from a Dialog's content -- so neither
 * `KeyboardAvoidingView` nor `ScrollView`'s own built-in keyboard-aware
 * scrolling can be trusted to fire inside a FormSheet.
 *
 * Must track the field's height, not just its top: an unbounded multiline
 * field (e.g. Notes' body, which has no maxHeight) grows taller with every
 * line typed, while its top position never moves. A version of this
 * function that only ever re-centered on `inputTop` would scroll correctly
 * on the first focus and then never again -- once the field grows past
 * whatever's visible below that fixed top, the actively-typed text renders
 * below the scroll viewport and is invisible, which looks identical to
 * "the keyboard is covering it" even though the keyboard isn't the direct
 * cause. So once the field no longer fits the available viewport, this
 * follows its growing bottom edge (where the cursor is) instead of its top.
 */
export function computeFocusScrollOffset({
  inputTop,
  inputHeight,
  currentScrollOffset,
  viewportHeight,
  topMargin = 24,
  bottomMargin = 24,
  minDelta = 8,
}: FocusScrollParams): number | null {
  const visibleTop = currentScrollOffset;
  const visibleBottom = currentScrollOffset + viewportHeight;
  const fieldTop = inputTop;
  const fieldBottom = inputTop + inputHeight;

  const fitsInViewport = inputHeight + topMargin + bottomMargin <= viewportHeight;

  let target: number | null = null;

  if (fitsInViewport) {
    // Short enough to show in full: scroll the minimum needed, in
    // whichever direction, to bring whichever edge is currently out of
    // view back in. Doesn't move anything if both edges are already
    // visible, so this never fights a scroll the user is doing by hand.
    if (fieldTop < visibleTop + topMargin) {
      target = Math.max(fieldTop - topMargin, 0);
    } else if (fieldBottom > visibleBottom - bottomMargin) {
      target = Math.max(fieldBottom - viewportHeight + bottomMargin, 0);
    }
  } else {
    // Taller than the available space -- the top and bottom can't both be
    // visible at once, so always prioritize the bottom: that's where the
    // cursor is while the field is actively being typed into. (Never falls
    // back to top-visibility here, even transiently, so a long field can't
    // oscillate between the two as it grows.)
    target = Math.max(fieldBottom - viewportHeight + bottomMargin, 0);
  }

  if (target == null || Math.abs(target - currentScrollOffset) < minDelta) {
    return null;
  }
  return target;
}
