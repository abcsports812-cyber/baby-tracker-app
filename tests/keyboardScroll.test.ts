import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  clampScrollOffset,
  computeFocusScrollOffset,
  isStaleScrollAttempt,
  isViewportMeasurementTrustworthy,
  neededExtraBottomPadding,
} from '../src/lib/keyboardScroll';

// Regression guard for the Notes keyboard bug: typed text becoming hidden
// as the multiline "Note" body field grows. The real fix lives in
// FormSheet.tsx/Screen.tsx/FormField.tsx (native layout/refs, not
// unit-testable without a device) -- this covers the actual decision
// logic that drives it: given where a focused field sits, how tall it
// currently is, and where/how tall the scroll viewport is, where should
// the sheet scroll to.

test('scrolls a field below the viewport down so its bottom becomes visible', () => {
  const target = computeFocusScrollOffset({
    inputTop: 800,
    inputHeight: 90,
    currentScrollOffset: 0,
    viewportHeight: 500,
  });
  assert.equal(target, 414); // (800+90) - 500 + 24
});

test('never scrolls to a negative offset for a field near the content top', () => {
  const target = computeFocusScrollOffset({
    inputTop: 10,
    inputHeight: 90,
    currentScrollOffset: 50,
    viewportHeight: 500,
  });
  assert.equal(target, 0);
});

test('ignores sub-threshold differences to avoid jittering on refocus', () => {
  const target = computeFocusScrollOffset({
    inputTop: 800,
    inputHeight: 90,
    currentScrollOffset: 410, // within 8px of the 414 target
    viewportHeight: 500,
  });
  assert.equal(target, null);
});

test('does nothing when a field is already fully visible with margin to spare', () => {
  const target = computeFocusScrollOffset({
    inputTop: 300,
    inputHeight: 90,
    currentScrollOffset: 0,
    viewportHeight: 500,
  });
  assert.equal(target, null);
});

test('a field that fits the viewport but whose bottom is covered scrolls down to reveal it', () => {
  // 90px field + the 24px top/bottom margins (138 total) comfortably fits
  // a 200px viewport, so this exercises the "fits" branch specifically --
  // its top (150) is already on-screen, but its bottom (240) is past
  // what's visible (viewport ends at 200).
  const target = computeFocusScrollOffset({
    inputTop: 150,
    inputHeight: 90,
    currentScrollOffset: 0,
    viewportHeight: 200,
  });
  assert.equal(target, 64); // (150+90) - 200 + 24
});

test('REGRESSION: a growing multiline field keeps following its bottom edge, not just its fixed top', () => {
  // This is the original Notes bug: a field pinned only to its top
  // position stops scrolling the moment it's first brought into view,
  // and then silently fails to follow the text as it grows past the
  // bottom of the visible area.
  //
  // Models Notes' "Note" field: it sits below Title/Date/Category (so it
  // starts outside the initially-visible viewport) and has no maxHeight,
  // so it grows without bound as the user types.
  const viewportHeight = 400;
  const inputTop = 450;

  const onFocus = computeFocusScrollOffset({ inputTop, inputHeight: 90, currentScrollOffset: 0, viewportHeight });
  assert.equal(onFocus, 164); // (450+90) - 400 + 24
  let scrollOffset = onFocus!;

  // The user keeps typing; the field grows well past what fits below its
  // (fixed) top -- it no longer fits the viewport at all.
  const grown = computeFocusScrollOffset({ inputTop, inputHeight: 500, currentScrollOffset: scrollOffset, viewportHeight });
  assert.notEqual(grown, null); // must NOT be stuck at the old target -- the original bug
  assert.equal(grown, 926); // (450+500) - 24, anchored near the top -- see next test for why
  scrollOffset = grown!;

  // Keeps typing further -- must keep following the bottom edge again.
  const grownMore = computeFocusScrollOffset({ inputTop, inputHeight: 700, currentScrollOffset: scrollOffset, viewportHeight });
  assert.notEqual(grownMore, null);
  assert.equal(grownMore, 1126); // (450+700) - 24
  scrollOffset = grownMore!;

  // No further typing (height unchanged) -- shouldn't jitter.
  const steady = computeFocusScrollOffset({ inputTop, inputHeight: 700, currentScrollOffset: scrollOffset, viewportHeight });
  assert.equal(steady, null);
});

test('REGRESSION: a field too tall to fit anchors its growing edge near the TOP of the viewport, not the bottom', () => {
  // This is the bug that survived the previous fix: anchoring the growing
  // bottom edge near `viewportHeight - bottomMargin` (i.e. near the
  // *bottom* of the measured viewport) assumes `viewportHeight` already
  // excludes whatever space the keyboard covers. On Android, inside a
  // FormSheet's Modal, that assumption doesn't reliably hold (see
  // computeFocusScrollOffset's doc comment) -- so a field positioned
  // "near the bottom of what I measured" can still land directly behind
  // the keyboard whenever the viewport wasn't actually keyboard-shrunk.
  //
  // Anchoring near the TOP instead needs no such assumption: wherever the
  // keyboard actually starts, the top of the visible area is always as
  // far from it as possible.
  const target = computeFocusScrollOffset({
    inputTop: 100,
    inputHeight: 900, // field taller than the viewport even before any keyboard
    currentScrollOffset: 0,
    viewportHeight: 700, // simulates an un-shrunk viewport (the bug condition)
  });
  // Bottom edge (1000) anchored at topMargin (24) from the scroll
  // position -- i.e. near the TOP of the visible area, not at
  // (700 - 24 = 676), which is what the previous, buggy version would
  // have produced.
  assert.equal(target, 976); // (100+900) - 24
});

test('a field taller than the viewport does not oscillate between top- and bottom-visibility', () => {
  // Once a field doesn't fit, the function should always target the same
  // kind of placement -- never flip back to targeting a different edge,
  // which would fight itself on the very next keystroke.
  const params = { inputTop: 100, inputHeight: 700, viewportHeight: 500 };
  const first = computeFocusScrollOffset({ ...params, currentScrollOffset: 0 });
  assert.equal(first, 776); // (100+700) - 24
  const second = computeFocusScrollOffset({ ...params, currentScrollOffset: first! });
  assert.equal(second, null); // already correctly positioned, stays put
});

// --- Native ScrollView scroll-boundary model ---------------------------
//
// `scrollTo({ y: target })` only ever reaches `target` if the ScrollView's
// real content is tall enough -- it clamps to [0, contentHeight -
// viewportHeight] like any native scroll view. The tests above verify
// computeFocusScrollOffset's target in isolation; these verify it's
// actually *reachable* given Notes' real layout, using clampScrollOffset
// to model that native clamp and neededExtraBottomPadding as the fix.
//
// Notes-realistic numbers, verified against app/notes/index.tsx's actual
// styles and src/theme/index.ts's spacing scale (not estimated):
//   aboveHeight (Title + Date + Category, before the "Note" field): 280px
//   belowHeight (favorite toggle + photo picker + the ScrollView's own
//     paddingBottom, no photo set, no milestones -- the worst case, least
//     trailing content): favoriteToggle (spacing.md*2 + ~20px row + 2px
//     border + spacing.lg) + photoPlaceholder (100px height + spacing.lg)
//     + contentContainerStyle paddingBottom (spacing.xl) = ~198px
//   viewportHeight: 500px, representative of the sheet's ScrollView body

const NOTES_ABOVE_HEIGHT = 280;
const NOTES_BELOW_HEIGHT = 198;
const NOTES_VIEWPORT_HEIGHT = 500;

test('REGRESSION: without extra padding, a long note scrolls to a target the native ScrollView cannot reach', () => {
  const inputHeight = 900; // a long, actively-typed note
  const target = computeFocusScrollOffset({
    inputTop: NOTES_ABOVE_HEIGHT,
    inputHeight,
    currentScrollOffset: 0,
    viewportHeight: NOTES_VIEWPORT_HEIGHT,
  })!;

  const contentHeight = NOTES_ABOVE_HEIGHT + inputHeight + NOTES_BELOW_HEIGHT; // no extra padding reserved
  const clamped = clampScrollOffset({ target, contentHeight, viewportHeight: NOTES_VIEWPORT_HEIGHT });
  const cursorScreenPosition = NOTES_ABOVE_HEIGHT + inputHeight - clamped;

  assert.ok(clamped < target, `expected the native clamp to fall short of ${target}, got ${clamped}`);
  // The cursor lands well below the intended 24px top margin -- still
  // deep enough in the lower portion of the viewport to plausibly sit
  // behind the keyboard.
  assert.ok(cursorScreenPosition > 100, `expected the cursor to be stranded below the safe region, got ${cursorScreenPosition}px from top`);
});

test('REGRESSION: a viewportHeight-sized conditional buffer makes the same target reachable, landing the cursor at the intended top margin', () => {
  const inputHeight = 900;
  const target = computeFocusScrollOffset({
    inputTop: NOTES_ABOVE_HEIGHT,
    inputHeight,
    currentScrollOffset: 0,
    viewportHeight: NOTES_VIEWPORT_HEIGHT,
  })!;

  const extraPadding = neededExtraBottomPadding({ inputHeight, viewportHeight: NOTES_VIEWPORT_HEIGHT });
  assert.equal(extraPadding, NOTES_VIEWPORT_HEIGHT); // exactly one viewport's worth, as designed

  const contentHeight = NOTES_ABOVE_HEIGHT + inputHeight + NOTES_BELOW_HEIGHT + extraPadding;
  const clamped = clampScrollOffset({ target, contentHeight, viewportHeight: NOTES_VIEWPORT_HEIGHT });

  assert.equal(clamped, target); // nothing clamped -- fully reachable
  assert.equal(NOTES_ABOVE_HEIGHT + inputHeight - clamped, 24); // cursor lands exactly at topMargin
});

test('no extra padding is reserved for a field that already fits (nothing to clean up after keyboard dismissal in this case)', () => {
  // A short field (e.g. Title, or Growth's optional single-line "Notes")
  // never needs the native-clamp workaround -- computeFocusScrollOffset's
  // own "fits" branch already has enough natural range.
  assert.equal(neededExtraBottomPadding({ inputHeight: 90, viewportHeight: NOTES_VIEWPORT_HEIGHT }), 0);
});

test('repeated growth keeps requesting the same viewportHeight buffer -- no padding oscillation while typing', () => {
  // Once a field has grown past the threshold, every further keystroke
  // must keep asking for the *same* amount of extra padding, not
  // repeatedly grow/shrink it (which would thrash the ScrollView's
  // content size, and with it, scroll position, while the user types).
  const heights = [600, 700, 900, 1500];
  const paddings = heights.map((inputHeight) => neededExtraBottomPadding({ inputHeight, viewportHeight: NOTES_VIEWPORT_HEIGHT }));
  assert.deepEqual(paddings, [NOTES_VIEWPORT_HEIGHT, NOTES_VIEWPORT_HEIGHT, NOTES_VIEWPORT_HEIGHT, NOTES_VIEWPORT_HEIGHT]);
});

test('REGRESSION: after padding is cleared (e.g. on keyboard dismissal), reopening on the same tall field re-requests the same buffer', () => {
  // Models KeyboardAwareScroll's keyboardDidHide -> clearFocusScroll ->
  // keyboardDidShow -> performScroll round trip: clearing the reserved
  // padding must not "stick" and prevent it from being correctly
  // re-requested the next time the same field needs it.
  const inputHeight = 900;
  const viewportHeight = NOTES_VIEWPORT_HEIGHT;
  const afterClear = 0;
  const reRequested = neededExtraBottomPadding({ inputHeight, viewportHeight });
  assert.notEqual(reRequested, afterClear);
  assert.equal(reRequested, viewportHeight);
});

// --- isStaleScrollAttempt -------------------------------------------
//
// Regression guard for the Diaper modal shaking bug's self-triggering feedback loop:
// an older scroll attempt's async measureLayout callback, or its onContentSizeChange
// continuation, must be discarded once a newer attempt has superseded it -- otherwise
// it can apply a decision computed against outdated keyboardHeightRef/
// extraBottomPadding state, re-toggling padding that a newer attempt already settled.

test('a scroll attempt is current (not stale) when its generation matches the latest', () => {
  assert.equal(isStaleScrollAttempt(3, 3), false);
});

test('REGRESSION: an older attempt is stale once a newer one has started', () => {
  // Models an in-flight measureLayout callback (tagged with generation 1) resolving
  // after a fresh focus or a newer debounced keyboard reading has already minted
  // generation 2.
  assert.equal(isStaleScrollAttempt(1, 2), true);
});

test('REGRESSION: an onContentSizeChange continuation is stale if a clear superseded it', () => {
  // Models clearFocusScroll bumping the generation (e.g. on keyboard hide) while an
  // earlier attempt's padding-reservation continuation is still pending.
  const pendingGeneration = 5;
  const afterClear = 6; // clearFocusScroll's generation bump
  assert.equal(isStaleScrollAttempt(pendingGeneration, afterClear), true);
});

test('REGRESSION: keyboard hide during an active scroll invalidates that scroll\'s own generation', () => {
  // Models the exact scenario: a field-focus scroll attempt (generation 1) is
  // animating toward its target when the keyboard is dismissed moments later.
  // clearFocusScroll bumps the generation (here, to 2) as part of handling that
  // dismissal -- generation 1's own measureLayout callback, if it's still
  // in flight, or any onContentSizeChange continuation of it, must now be
  // recognized as stale so it can't apply a decision for a keyboard state that
  // no longer holds.
  const activeScrollGeneration = 1;
  const afterKeyboardHide = 2; // clearFocusScroll's generation bump
  assert.equal(isStaleScrollAttempt(activeScrollGeneration, afterKeyboardHide), true);
});

test('REGRESSION: rapid focus switching across three fields leaves only the last attempt current', () => {
  // Models the user tapping field A, then quickly B, then quickly C --
  // beginScrollAttempt mints a fresh generation each time. Every earlier
  // attempt must be recognized as stale once a later one has started, not
  // just the immediately-preceding one.
  let generation = 0;
  const fieldA = ++generation; // 1
  const fieldB = ++generation; // 2
  const fieldC = ++generation; // 3
  const current = generation; // 3 -- whatever beginScrollAttempt last minted

  assert.equal(isStaleScrollAttempt(fieldA, current), true);
  assert.equal(isStaleScrollAttempt(fieldB, current), true);
  assert.equal(isStaleScrollAttempt(fieldC, current), false); // the latest -- still valid
});

test('isViewportMeasurementTrustworthy: trusts a reading only while no padding is reserved', () => {
  assert.equal(isViewportMeasurementTrustworthy(0), true);
  assert.equal(isViewportMeasurementTrustworthy(1), false);
  assert.equal(isViewportMeasurementTrustworthy(77), false);
  assert.equal(isViewportMeasurementTrustworthy(500), false);
});

// REGRESSION: captured directly from a real Android device log -- a
// repeating ~16ms cycle where the reported viewport height (onLayout) and
// the computed scroll target (performScroll) both grew in lockstep, never
// settling. Root cause: FormSheet's ScrollView (`body`, `flexGrow: 0`,
// inside a `sheet` with no `flex: 1` of its own) sizes itself to its own
// content, so reserving extraBottomPadding grows the ScrollView's own
// onLayout-reported height by roughly the same amount -- and
// neededExtraBottomPadding returns that same viewportHeight back as the
// padding to reserve, so each cycle reserves baseline + the padding from
// the cycle before: P(n+1) = baseline + P(n), diverging by a fixed
// increment forever instead of converging. These two tests characterize
// that divergence directly, then prove isViewportMeasurementTrustworthy's
// guard (wired into KeyboardAwareScroll's onLayout) makes it converge.

test('REGRESSION: feeding neededExtraBottomPadding a self-inflated viewport height diverges without bound', () => {
  // Models the *old*, buggy onLayout behavior: every reservation's own
  // growth is fed straight back in as next cycle's viewportHeight, exactly
  // as FormSheet's flexGrow:0 ScrollView does when nothing stops it.
  const baselineViewport = 360; // the sheet's real available space, pre-reservation
  const inputHeight = 100_000; // absurdly tall so it never "fits" within the cycles below, however much the self-inflated viewport grows

  let viewportHeight = baselineViewport;
  let padding = 0;
  const paddingHistory: number[] = [];

  for (let cycle = 0; cycle < 5; cycle++) {
    // Self-inflation: this cycle's "measured" viewport already includes
    // last cycle's reserved padding, because the ScrollView grew to fit it.
    viewportHeight = baselineViewport + padding;
    padding = neededExtraBottomPadding({ inputHeight, viewportHeight });
    paddingHistory.push(padding);
  }

  // Strictly increasing every single cycle -- never settles on a repeated
  // value, which is exactly the "continuously increasing instead of
  // converging" behavior reported from the device.
  for (let i = 1; i < paddingHistory.length; i++) {
    assert.ok(
      paddingHistory[i] > paddingHistory[i - 1],
      `expected cycle ${i} (${paddingHistory[i]}) to exceed cycle ${i - 1} (${paddingHistory[i - 1]}) -- divergence stalled`,
    );
  }
  // After 5 cycles of adding a full baseline each time, it's grown far
  // past anything a single, correct reservation would ever need.
  assert.ok(paddingHistory[paddingHistory.length - 1] > baselineViewport * 4);
});

test('REGRESSION: a frozen (non-self-inflated) viewport height converges to a stable padding value immediately', () => {
  // Models the *fixed* behavior: onLayout ignores any reading taken while
  // extraBottomPadding is already reserved (isViewportMeasurementTrustworthy),
  // so viewportHeight never reflects this hook's own reservation.
  const baselineViewport = 360;
  const inputHeight = 100_000; // same "never fits" field as the divergence test above, for a direct contrast

  let padding = 0;
  const paddingHistory: number[] = [];

  for (let cycle = 0; cycle < 5; cycle++) {
    // onLayout's guard means the baseline never moves, cycle to cycle,
    // regardless of how much padding is currently reserved.
    assert.equal(isViewportMeasurementTrustworthy(padding), padding === 0);
    padding = neededExtraBottomPadding({ inputHeight, viewportHeight: baselineViewport });
    paddingHistory.push(padding);
  }

  // Stable from the very first cycle onward -- every later cycle recomputes
  // the exact same value instead of drifting.
  assert.ok(paddingHistory.every((value) => value === paddingHistory[0]));
  assert.equal(paddingHistory[0], baselineViewport);
});
