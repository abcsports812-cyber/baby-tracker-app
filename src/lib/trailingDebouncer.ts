export interface TrailingDebouncer {
  /** Cancels any pending call and schedules `fn` to run after the debounce
   * delay, unless superseded by another `schedule()` call before then. */
  schedule: (fn: () => void) => void;
  /** Cancels any pending call without scheduling a new one. */
  cancel: () => void;
}

/**
 * A plain trailing-edge debouncer: only the LAST call to schedule() within
 * any `delayMs` window actually runs, once no further call arrives within
 * that window. Used to collapse a burst of events -- e.g. the several
 * intermediate keyboard-height readings Android dispatches while the IME's
 * own show/hide animation is in progress -- into a single action against
 * the final, settled value, instead of reacting to every intermediate one.
 *
 * Built on plain setTimeout/clearTimeout (available identically in both
 * Node and the React Native runtime), with no React or RN dependency, so
 * this is directly unit-testable with real (short) timeouts.
 */
export function createTrailingDebouncer(delayMs: number): TrailingDebouncer {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return {
    schedule(fn: () => void) {
      if (timer != null) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        timer = null;
        fn();
      }, delayMs);
    },
    cancel() {
      if (timer != null) {
        clearTimeout(timer);
        timer = null;
      }
    },
  };
}
