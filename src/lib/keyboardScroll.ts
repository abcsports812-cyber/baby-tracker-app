function fitsInViewport(inputHeight: number, viewportHeight: number, topMargin: number, bottomMargin: number): boolean {
  return inputHeight + topMargin + bottomMargin <= viewportHeight;
}

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
  /** The ScrollView's own visible (layout) height -- not its content height.
   * Only trustworthy for deciding whether the field fits on screen at all;
   * see computeFocusScrollOffset's doc comment for why it's never used to
   * compute how close to the *bottom* of that space something may sit. */
  viewportHeight: number;
  /** Gap to leave above the field's top edge once scrolled into place. */
  topMargin?: number;
  /** Gap to leave below the field's bottom edge once scrolled into place
   * -- only used while the whole field still fits on screen. */
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
 * cause.
 *
 * Once the field no longer fits, this follows its growing bottom edge
 * (where the cursor is) -- but pins that edge near the TOP of the
 * viewport, not its bottom. An earlier version pinned it near the
 * *bottom* (`viewportHeight - bottomMargin`), on the assumption that
 * `viewportHeight` (from the ScrollView's own `onLayout`) reflects the
 * space actually left *above* the keyboard. That's only true if the
 * Dialog window's native resize (SOFT_INPUT_ADJUST_RESIZE, set
 * unconditionally on Modal's window) reliably triggers a fresh Yoga
 * layout pass under this app's edge-to-edge display mode -- which isn't
 * something this app can rely on consistently across devices. If it
 * doesn't fire, `viewportHeight` stays at the sheet's *un-shrunk* height,
 * and "just above what I think is the bottom" lands exactly where the
 * keyboard actually is. Anchoring near the TOP instead needs no such
 * assumption: the top of whatever's currently visible is, by construction,
 * as far as possible from a keyboard that's anchored to the bottom,
 * regardless of whether the measured viewport height is keyboard-aware.
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

  const fits = fitsInViewport(inputHeight, viewportHeight, topMargin, bottomMargin);

  let target: number | null = null;

  if (fits) {
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
    // visible at once, so always follow the bottom (the cursor), but pin
    // it near the top of the viewport rather than the bottom. See the doc
    // comment above for why: it's the only placement that's safe without
    // knowing how much of the viewport's bottom is actually covered by
    // the keyboard.
    target = Math.max(fieldBottom - topMargin, 0);
  }

  if (target == null || Math.abs(target - currentScrollOffset) < minDelta) {
    return null;
  }
  return target;
}

export interface ExtraBottomPaddingParams {
  /** The focused field's current rendered height. */
  inputHeight: number;
  /** The ScrollView's own visible (layout) height. */
  viewportHeight: number;
  topMargin?: number;
  bottomMargin?: number;
}

/**
 * How much extra bottom padding (if any) the ScrollView's content needs
 * reserved so that a `computeFocusScrollOffset` target for this field can
 * actually be reached, instead of being silently clamped short by the
 * native ScrollView's own `[0, contentHeight - viewportHeight]` bound.
 *
 * `scrollTo({ y: target })` only ever reaches `target` if the ScrollView's
 * real content is tall enough to scroll that far. In FormSheet's Notes
 * form specifically, the content *after* the "Note" field (a favorite
 * toggle, a photo picker, an optional milestone-chip row, and the
 * ScrollView's own small content padding) only adds up to roughly
 * 198-316px -- verified directly against app/notes/index.tsx's actual
 * styles (spacing.md/lg paddings, the 100px/140px photo placeholder/
 * preview heights, the milestone chip row), not estimated. Once the Note
 * field grows past roughly half a typical ~500px sheet viewport, that's
 * nowhere near enough trailing content for computeFocusScrollOffset's
 * top-anchored target to be reachable -- the scroll clamps, and the
 * cursor gets stuck in the viewport's lower half-to-two-thirds, which is
 * exactly where a keyboard commonly sits.
 *
 * Reserving a full `viewportHeight` of extra bottom padding is provably
 * always enough regardless of how little real content follows the field:
 * the worst-case shortfall (zero trailing content at all) is
 * `viewportHeight - topMargin`, strictly less than `viewportHeight`.
 * Zero whenever the field already fits -- computeFocusScrollOffset's
 * "fits" branch never needs more range than already exists, so reserving
 * extra space there would only add blank scroll space for no benefit.
 */
export function neededExtraBottomPadding({
  inputHeight,
  viewportHeight,
  topMargin = 24,
  bottomMargin = 24,
}: ExtraBottomPaddingParams): number {
  return fitsInViewport(inputHeight, viewportHeight, topMargin, bottomMargin) ? 0 : viewportHeight;
}

export interface ClampScrollOffsetParams {
  target: number;
  /** The ScrollView's actual total content height (including whatever
   * extra bottom padding, if any, is currently reserved). */
  contentHeight: number;
  viewportHeight: number;
}

/** Models native ScrollView.scrollTo()'s own clamping: it can never
 * scroll past the end of its actual content. Used to verify, in tests,
 * that a given (contentHeight, viewportHeight) pair actually lets a
 * computeFocusScrollOffset target be reached -- not just that the target
 * itself is a sensible number in isolation. */
export function clampScrollOffset({ target, contentHeight, viewportHeight }: ClampScrollOffsetParams): number {
  const maxScrollOffset = Math.max(contentHeight - viewportHeight, 0);
  return Math.min(Math.max(target, 0), maxScrollOffset);
}
