import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  dialogKeyboardAction,
  INITIAL_DIALOG_KEYBOARD_INSETS_STATE,
  reduceDialogKeyboardInsets,
} from '../src/lib/dialogKeyboardInsets';

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
