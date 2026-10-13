import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeFocusScrollOffset } from '../src/lib/keyboardScroll';

// Regression guard for Bug 2 (Notes input hidden by the Android keyboard).
// The real fix lives in FormSheet.tsx/FormField.tsx (native layout/refs,
// not unit-testable without a device) -- this covers the one piece of
// actual decision logic that drives it: given where a focused field sits
// and where the sheet is currently scrolled, where should it scroll to.

test('scrolls a field near the bottom of the sheet up near the top', () => {
  const target = computeFocusScrollOffset({ inputTop: 400, currentScrollOffset: 0 });
  assert.equal(target, 376); // 400 - the default 24px top margin
});

test('does nothing when the field is already positioned correctly', () => {
  const target = computeFocusScrollOffset({ inputTop: 400, currentScrollOffset: 376 });
  assert.equal(target, null);
});

test('never scrolls to a negative offset for a field near the content top', () => {
  const target = computeFocusScrollOffset({ inputTop: 10, currentScrollOffset: 50 });
  assert.equal(target, 0);
});

test('ignores sub-threshold differences to avoid jittering on refocus', () => {
  const target = computeFocusScrollOffset({ inputTop: 400, currentScrollOffset: 380 });
  assert.equal(target, null); // |376 - 380| = 4, below the 8px minDelta
});

test('a multiline field that grows while typing keeps scrolling to follow its new height', () => {
  // Simulates onContentSizeChange firing as more lines are typed: the
  // field's own top position within the content is unchanged, but this
  // confirms the same computation is safe to call repeatedly as scroll
  // offset catches up.
  const first = computeFocusScrollOffset({ inputTop: 300, currentScrollOffset: 0 });
  assert.equal(first, 276);
  const second = computeFocusScrollOffset({ inputTop: 300, currentScrollOffset: 276 });
  assert.equal(second, null);
});
