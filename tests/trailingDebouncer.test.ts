import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTrailingDebouncer } from '../src/lib/trailingDebouncer';

// Regression guard for the Diaper modal shaking bug: Android dispatches several
// intermediate WindowInsets readings while the IME's own show/hide animation is in
// progress, and each one used to trigger its own immediate, independently-animated
// scroll/padding decision -- a burst of overlapping, constantly-retargeted scrollTo
// calls that looked like continuous shaking. These tests cover the debouncer itself,
// using real (short) timeouts -- it has no React/RN dependency, so this is a genuine
// end-to-end test of the actual production utility, not a model of it.

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

test('a single scheduled call runs after the delay', async () => {
  const debouncer = createTrailingDebouncer(15);
  let calls = 0;
  debouncer.schedule(() => {
    calls += 1;
  });
  assert.equal(calls, 0); // hasn't run yet
  await wait(30);
  assert.equal(calls, 1);
});

test('REGRESSION: a burst of rapid schedule() calls collapses into exactly one run, using the LAST one', async () => {
  const debouncer = createTrailingDebouncer(15);
  const seen: number[] = [];

  // Models a burst of intermediate IME-animation height readings arriving
  // faster than the debounce window.
  for (const value of [40, 90, 150, 210, 260, 280]) {
    debouncer.schedule(() => {
      seen.push(value);
    });
  }

  await wait(30);

  assert.deepEqual(seen, [280]); // only the final, settled reading was ever acted on
});

test('cancel() prevents a pending call from ever running', async () => {
  const debouncer = createTrailingDebouncer(15);
  let calls = 0;
  debouncer.schedule(() => {
    calls += 1;
  });
  debouncer.cancel();
  await wait(30);
  assert.equal(calls, 0);
});

test('REGRESSION: unmount cancels a pending debounced restore, so it can\'t fire against a gone component', async () => {
  // Models KeyboardAwareScroll.tsx's unmount effect: a keyboard-height reading
  // arrives and schedules a restore, then the owning FormSheet/Screen unmounts
  // before the debounce window elapses (the effect's cleanup calls cancel()).
  // Without this, the scheduled restore's closure would still run later, reading
  // refs (scrollRef, innerViewRef) for a component that's no longer mounted.
  const debouncer = createTrailingDebouncer(15);
  let restoreCalls = 0;
  const scheduleRestore = () => debouncer.schedule(() => { restoreCalls += 1; });

  scheduleRestore(); // a keyboard-height reading arrives
  debouncer.cancel(); // the unmount effect's cleanup runs before the debounce settles

  await wait(30);

  assert.equal(restoreCalls, 0);
});

test('a later, independent schedule() after a previous call already ran works normally', async () => {
  const debouncer = createTrailingDebouncer(15);
  const seen: number[] = [];

  debouncer.schedule(() => seen.push(1));
  await wait(30);
  debouncer.schedule(() => seen.push(2));
  await wait(30);

  assert.deepEqual(seen, [1, 2]); // independent, not stuck after the first run
});

test('cancel() after a call has already fired is a harmless no-op', async () => {
  const debouncer = createTrailingDebouncer(15);
  let calls = 0;
  debouncer.schedule(() => {
    calls += 1;
  });
  await wait(30);
  assert.equal(calls, 1);
  debouncer.cancel(); // nothing pending -- must not throw or affect anything
  assert.equal(calls, 1);
});
