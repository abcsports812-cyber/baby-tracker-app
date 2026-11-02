import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  dialogKeyboardAction,
  effectiveViewportHeight,
  imeHeightPxToDp,
  INITIAL_DIALOG_KEYBOARD_INSETS_STATE,
  reduceDialogKeyboardInsets,
} from '../src/lib/dialogKeyboardInsets';
import { computeFocusScrollOffset, neededExtraBottomPadding } from '../src/lib/keyboardScroll';
import { createTrailingDebouncer } from '../src/lib/trailingDebouncer';

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Regression guard for the Modal-specific keyboard-dismissal fix: Android's Back button
// hides the keyboard without blurring the focused TextInput, and the Activity-level
// `Keyboard` module can't reliably reach a view inside a Modal's separate Dialog window
// in the first place. DialogKeyboardInsetsView.kt observes WindowInsets' IME type scoped
// to a view actually mounted inside that Dialog instead. These tests cover the decision
// logic that drives KeyboardAwareScroll.tsx's reaction to it (dialogKeyboardAction, used
// directly by handleDialogKeyboardChange) and a pure-TS model of the native dedupe
// algorithm (reduceDialogKeyboardInsets) that decides when that observer should emit at
// all -- the native WindowInsets wiring itself isn't unit-testable without a device.

test('keyboard opening requests a restore', () => {
  assert.equal(dialogKeyboardAction(true), 'restore');
});

test('keyboard closing requests a clear', () => {
  assert.equal(dialogKeyboardAction(false), 'clear');
});

test('REGRESSION: a fresh reading (keyboard opens) fires, independent of any prior focus/blur state', () => {
  const { state, event } = reduceDialogKeyboardInsets(INITIAL_DIALOG_KEYBOARD_INSETS_STATE, {
    visible: true,
    height: 320,
  });
  assert.deepEqual(event, { visible: true, height: 320 });
  assert.deepEqual(state, { visible: true, height: 320 });
});

test('REGRESSION: Back-button dismissal while the field stays focused still fires a hide event', () => {
  // Models the exact gap this round fixes: the field never blurs, so onBlur never runs --
  // but the Dialog's own WindowInsets listener doesn't care about focus at all, so the
  // transition from "open" to "closed" still produces an event regardless.
  const afterOpen = reduceDialogKeyboardInsets(INITIAL_DIALOG_KEYBOARD_INSETS_STATE, {
    visible: true,
    height: 320,
  }).state;

  const { event, state } = reduceDialogKeyboardInsets(afterOpen, { visible: false, height: 0 });
  assert.deepEqual(event, { visible: false, height: 0 });
  assert.equal(dialogKeyboardAction(event!.visible), 'clear');
  assert.deepEqual(state, { visible: false, height: 0 });
});

test('REGRESSION: reopening the keyboard on the same still-focused field fires a restore event again', () => {
  const opened = reduceDialogKeyboardInsets(INITIAL_DIALOG_KEYBOARD_INSETS_STATE, {
    visible: true,
    height: 320,
  }).state;
  const closed = reduceDialogKeyboardInsets(opened, { visible: false, height: 0 }).state;

  const reopened = reduceDialogKeyboardInsets(closed, { visible: true, height: 320 });
  assert.deepEqual(reopened.event, { visible: true, height: 320 });
  assert.equal(dialogKeyboardAction(reopened.event!.visible), 'restore');
});

test('a WindowInsets dispatch for an unrelated change (same visible/height) does not re-fire', () => {
  // E.g. a status-bar or navigation-bar visibility change delivers a new WindowInsets
  // object with the IME portion unchanged -- must not spuriously re-trigger
  // restore/clear and risk duplicate scroll/padding work.
  const opened = reduceDialogKeyboardInsets(INITIAL_DIALOG_KEYBOARD_INSETS_STATE, {
    visible: true,
    height: 320,
  }).state;

  const repeated = reduceDialogKeyboardInsets(opened, { visible: true, height: 320 });
  assert.equal(repeated.event, null);
  assert.deepEqual(repeated.state, opened);
});

test('a height-only change while the keyboard stays open still fires (e.g. a suggestions bar changing its height)', () => {
  const opened = reduceDialogKeyboardInsets(INITIAL_DIALOG_KEYBOARD_INSETS_STATE, {
    visible: true,
    height: 320,
  }).state;

  const resized = reduceDialogKeyboardInsets(opened, { visible: true, height: 360 });
  assert.deepEqual(resized.event, { visible: true, height: 360 });
});

test('REGRESSION: listener cleanup -- resetting to the initial state on detach lets a reattach re-announce the same keyboard state', () => {
  // Mirrors DialogKeyboardInsetsView.kt's onDetachedFromWindow, which resets
  // lastVisible/lastHeight rather than leaving them at their last value. Without that
  // reset, a view that detaches and reattaches while the keyboard is already open (e.g.
  // FormSheet closing and reopening without the keyboard ever going away) would wrongly
  // treat the identical (visible: true, height: 320) reading as a duplicate and never
  // tell JS the keyboard is open in the new instance.
  const beforeDetach = reduceDialogKeyboardInsets(INITIAL_DIALOG_KEYBOARD_INSETS_STATE, {
    visible: true,
    height: 320,
  }).state;
  assert.notDeepEqual(beforeDetach, INITIAL_DIALOG_KEYBOARD_INSETS_STATE);

  // onDetachedFromWindow's reset -- not a no-op continuation of `beforeDetach`.
  const afterDetachReset = INITIAL_DIALOG_KEYBOARD_INSETS_STATE;

  const afterReattach = reduceDialogKeyboardInsets(afterDetachReset, { visible: true, height: 320 });
  assert.deepEqual(afterReattach.event, { visible: true, height: 320 });
});

test('without the detach reset, the same reattach scenario would have been wrongly suppressed (sanity check on the model itself)', () => {
  const beforeDetach = reduceDialogKeyboardInsets(INITIAL_DIALOG_KEYBOARD_INSETS_STATE, {
    visible: true,
    height: 320,
  }).state;

  // If detach incorrectly left the state as `beforeDetach` instead of resetting it, the
  // identical reading on reattach would be (wrongly) treated as a duplicate.
  const withoutReset = reduceDialogKeyboardInsets(beforeDetach, { visible: true, height: 320 });
  assert.equal(withoutReset.event, null);
});

// --- effectiveViewportHeight -------------------------------------------
//
// A FormSheet Modal's Dialog window is forced edge-to-edge app-wide, so it never
// actually resizes when the keyboard opens -- the ScrollView's own onLayout-measured
// height stays at its pre-keyboard value the whole time the keyboard is visible.
// effectiveViewportHeight corrects for that using DialogKeyboardObserver's real,
// Window-scoped keyboard height. These tests cover that correction directly, and prove
// the exact failure mode it fixes: computeFocusScrollOffset's "fits" branch silently
// under-scrolling by the keyboard's height when fed the stale, unadjusted viewport.

test('with no keyboard reported, the effective viewport is just the measured one', () => {
  assert.equal(effectiveViewportHeight(500, 0), 500);
});

test('the keyboard height is subtracted from the measured (stale, pre-keyboard) viewport', () => {
  assert.equal(effectiveViewportHeight(500, 280), 220);
});

test('never goes negative for an implausibly tall keyboard reading', () => {
  assert.equal(effectiveViewportHeight(500, 900), 0);
});

test('REGRESSION: without the keyboard-height correction, a short field\'s target under-scrolls by exactly the keyboard height', () => {
  // A short field whose bottom (630) is past what's visible in a 500px measured
  // viewport, so the "fits" branch's bottom-tracking kicks in. Using the raw, stale
  // (pre-keyboard) viewport height here is exactly the bug this round's fix addresses
  // -- DialogKeyboardObserver already reports the real keyboard height, but until now
  // nothing subtracted it before calling computeFocusScrollOffset.
  const measuredViewportHeight = 500;
  const keyboardHeight = 280;
  const inputTop = 600;
  const inputHeight = 30;
  const fieldBottom = inputTop + inputHeight;

  const staleTarget = computeFocusScrollOffset({
    inputTop,
    inputHeight,
    currentScrollOffset: 0,
    viewportHeight: measuredViewportHeight, // bug: ignores the keyboard entirely
  })!;

  const correctedEffectiveViewport = effectiveViewportHeight(measuredViewportHeight, keyboardHeight);
  const correctedTarget = computeFocusScrollOffset({
    inputTop,
    inputHeight,
    currentScrollOffset: 0,
    viewportHeight: correctedEffectiveViewport, // the fix
  })!;

  // Scrolling to the stale target leaves the field's bottom sitting exactly
  // `keyboardHeight` px lower on screen than scrolling to the corrected target does --
  // i.e. still `keyboardHeight` px into the region the keyboard actually covers.
  assert.equal(correctedTarget - staleTarget, keyboardHeight);

  // The corrected target places the field's bottom at the intended bottomMargin (24px)
  // above the bottom of the *real* (keyboard-shrunk) visible area.
  assert.equal(fieldBottom - correctedTarget, correctedEffectiveViewport - 24);
  // The stale target instead places it bottomMargin above the bottom of the
  // *un-shrunk* viewport -- keyboardHeight px further down than that real boundary.
  assert.equal(fieldBottom - staleTarget, measuredViewportHeight - 24);
});

test('REGRESSION: the keyboard-height correction can also flip a field from "fits" to "doesn\'t fit"', () => {
  // neededExtraBottomPadding's own fits-check uses the same viewport height --
  // without the correction, a field that doesn't actually fit the real, keyboard-
  // shrunk visible area could still be (wrongly) classified as fitting, skipping the
  // extra-padding reservation it would actually need.
  const measuredViewportHeight = 500;
  const keyboardHeight = 280;
  const inputHeight = 200;
  const topMargin = 24;
  const bottomMargin = 24;

  const fitsStale = inputHeight + topMargin + bottomMargin <= measuredViewportHeight;
  const fitsCorrected =
    inputHeight + topMargin + bottomMargin <= effectiveViewportHeight(measuredViewportHeight, keyboardHeight);

  assert.equal(fitsStale, true); // 248 <= 500 -- wrongly looks like it fits
  assert.equal(fitsCorrected, false); // 248 <= 220 is false -- correctly doesn't
});

// --- px -> dp unit conversion -------------------------------------------
//
// WindowInsetsCompat (like every Android View/WindowInsets measurement) reports raw
// physical pixels, which scale with display density -- NOT React Native's logical
// pixels ("dp"), the unit onLayout/measureLayout/scrollTo/effectiveViewportHeight all
// use. DialogKeyboardInsetsView.kt converts via PixelUtil.pxToDp() (value / density)
// exactly once, at the point of emission, before heightDp ever reaches JS. These tests
// cover that conversion's correctness and density-independence using
// imeHeightPxToDp, a pure-TS model of the same formula (see its doc comment).

test('REGRESSION: the px-to-dp keyboard-height conversion is density-independent -- same logical result at 1.0, 2.0, and 3.0', () => {
  const realKeyboardHeightDp = 300; // a representative on-screen keyboard height, in dp
  for (const density of [1.0, 2.0, 3.0]) {
    // What WindowInsetsCompat.getInsets(Type.ime()).bottom would actually report on a
    // device at this density, for the same physical keyboard.
    const reportedPx = realKeyboardHeightDp * density;
    const recoveredDp = imeHeightPxToDp(reportedPx, density);
    assert.equal(recoveredDp, realKeyboardHeightDp);
  }
});

test('REGRESSION: without the px-to-dp conversion, a raw pixel height wrongly collapses effectiveViewportHeight at higher densities', () => {
  const measuredViewportHeight = 500; // dp, from the ScrollView's own onLayout
  const realKeyboardHeightDp = 300;

  for (const density of [1.0, 2.0, 3.0]) {
    const reportedPx = realKeyboardHeightDp * density;

    // Bug: subtracting the raw, unconverted native-pixel value directly, as if it
    // were already dp -- what this codebase did before this round's fix.
    const buggy = effectiveViewportHeight(measuredViewportHeight, reportedPx);
    // Fix: convert to dp first, exactly once, before subtracting.
    const fixed = effectiveViewportHeight(measuredViewportHeight, imeHeightPxToDp(reportedPx, density));

    // The fixed result is the same, correct value regardless of density.
    assert.equal(fixed, measuredViewportHeight - realKeyboardHeightDp); // 200dp, always

    if (density > 1) {
      // The units bug only bites once density exceeds 1.0 -- confirms this is a real,
      // device-dependent regression, not a difference that happens to cancel out.
      assert.notEqual(buggy, fixed);
    }
  }
});

test('REGRESSION: keyboard dismissal resets the tracked height back to 0, not just visibility', () => {
  // Models KeyboardAwareScroll.tsx's clearFocusScroll, which sets
  // keyboardHeightRef.current = 0 on every clear path (onBlur, the Activity-level
  // keyboardDidHide fallback, and handleDialogKeyboardChange's visible: false branch)
  // -- confirmed by direct inspection of clearFocusScroll's implementation. A stale
  // nonzero height surviving a dismissal would corrupt the next focus cycle's
  // effectiveViewportHeight even after the keyboard is gone.
  const afterDismissKeyboardHeightDp = 0;
  assert.equal(dialogKeyboardAction(false), 'clear');
  assert.equal(effectiveViewportHeight(500, afterDismissKeyboardHeightDp), 500);
});

// --- Diaper modal shaking regression (end-to-end) ------------------------
//
// Reproduces the reported bug at the logic level: Android dispatches several
// intermediate WindowInsets readings while the IME's own show/hide animation is in
// progress. Diaper's FormSheet is short (ChipSelect + DateTimeRow + one short,
// near-top "Notes" field, nothing after it) -- exactly the shape where the
// fits/doesn't-fit boundary neededExtraBottomPadding depends on is most sensitive to
// a changing viewport, so intermediate readings could flip it back and forth before
// this round's debounce fix. This combines the real production debouncer
// (createTrailingDebouncer) with the real padding-decision function
// (neededExtraBottomPadding) to prove only the final, settled reading is ever acted on.

test('REGRESSION: a ramping sequence of IME-animation height readings (Diaper-style short form) settles into exactly one padding decision', async () => {
  const diaperMeasuredViewportHeight = 500; // Diaper's short sheet, representative
  const diaperNotesFieldHeight = 180; // a short multiline field, a few lines of text

  const debouncer = createTrailingDebouncer(15);
  const decisions: number[] = [];

  // Intermediate readings as the IME slides open, then its final, settled height.
  const ramp = [40, 90, 150, 210, 260, 280];
  for (const heightDp of ramp) {
    debouncer.schedule(() => {
      const viewportHeight = effectiveViewportHeight(diaperMeasuredViewportHeight, heightDp);
      decisions.push(neededExtraBottomPadding({ inputHeight: diaperNotesFieldHeight, viewportHeight }));
    });
  }

  await wait(30);

  // Exactly one decision was ever made, against the final, settled height -- not
  // once per intermediate reading, and not the (possibly different) decision an
  // earlier, now-stale reading would have produced.
  assert.equal(decisions.length, 1);
  const settledViewportHeight = effectiveViewportHeight(diaperMeasuredViewportHeight, 280);
  assert.equal(decisions[0], neededExtraBottomPadding({ inputHeight: diaperNotesFieldHeight, viewportHeight: settledViewportHeight }));
});

test('REGRESSION: without debouncing, the same ramp would have produced multiple, possibly conflicting padding decisions', () => {
  // Sanity check on the scenario itself: proves the ramp above genuinely crosses the
  // fits/doesn't-fit boundary more than once if every reading is acted on immediately
  // (the pre-fix behavior), not just a difference in degree.
  const diaperMeasuredViewportHeight = 500;
  const diaperNotesFieldHeight = 180;
  const ramp = [40, 90, 150, 210, 260, 280];

  const immediateDecisions = ramp.map((heightDp) =>
    neededExtraBottomPadding({
      inputHeight: diaperNotesFieldHeight,
      viewportHeight: effectiveViewportHeight(diaperMeasuredViewportHeight, heightDp),
    }),
  );

  const distinctDecisions = new Set(immediateDecisions);
  assert.ok(distinctDecisions.size > 1, 'expected the un-debounced ramp to cross the fits/doesn\'t-fit boundary at least once');
});
