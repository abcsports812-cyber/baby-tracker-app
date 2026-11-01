import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeFocusScrollOffset } from '../src/lib/keyboardScroll';

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
  // This is the actual Notes bug: a field pinned only to its top position
  // stops scrolling the moment it's first brought into view, and then
  // silently fails to follow the text as it grows past the bottom of the
  // visible area -- which is indistinguishable, from the user's
  // perspective, from "the keyboard is covering what I'm typing".
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
  assert.notEqual(grown, null); // must NOT be stuck at the old target -- the old bug
  assert.equal(grown, 574); // (450+500) - 400 + 24
  scrollOffset = grown!;

  // Keeps typing further -- must keep following the bottom edge again.
  const grownMore = computeFocusScrollOffset({ inputTop, inputHeight: 700, currentScrollOffset: scrollOffset, viewportHeight });
  assert.notEqual(grownMore, null);
  assert.equal(grownMore, 774); // (450+700) - 400 + 24
  scrollOffset = grownMore!;

  // No further typing (height unchanged) -- shouldn't jitter.
  const steady = computeFocusScrollOffset({ inputTop, inputHeight: 700, currentScrollOffset: scrollOffset, viewportHeight });
  assert.equal(steady, null);
});

test('a field taller than the viewport does not oscillate between top- and bottom-visibility', () => {
  // Once a field doesn't fit, the function should always target
  // bottom-visibility -- never flip back to targeting the (now
  // necessarily off-screen) top, which would fight the bottom-tracking
  // scroll on the very next keystroke.
  const params = { inputTop: 100, inputHeight: 700, viewportHeight: 500 };
  const first = computeFocusScrollOffset({ ...params, currentScrollOffset: 0 });
  assert.equal(first, 324); // (100+700) - 500 + 24
  const second = computeFocusScrollOffset({ ...params, currentScrollOffset: first! });
  assert.equal(second, null); // already correctly positioned, stays put
});
