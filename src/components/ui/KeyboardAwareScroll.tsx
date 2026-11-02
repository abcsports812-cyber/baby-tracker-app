import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, ScrollView, View } from 'react-native';
import { dialogKeyboardAction, effectiveViewportHeight } from '../../lib/dialogKeyboardInsets';
import { computeFocusScrollOffset, isStaleScrollAttempt, neededExtraBottomPadding } from '../../lib/keyboardScroll';
import { createTrailingDebouncer } from '../../lib/trailingDebouncer';
// TEMPORARY DIAGNOSTIC LOGGING -- see keyboardDiagLog.ts. Remove with it.
import { kbdLog } from '../../lib/keyboardDiagLog';

// Android dispatches several intermediate WindowInsets readings while the
// IME's own show/hide animation is in progress, not just one final value --
// see handleDialogKeyboardChange's doc comment below. This collapses a burst
// of those into a single, settled restore attempt.
const KEYBOARD_RESTORE_DEBOUNCE_MS = 120;

export type MeasurableInput = {
  measureLayout: (
    relativeToNativeComponentRef: any,
    onSuccess: (x: number, y: number, width: number, height: number) => void,
    onFail: () => void,
  ) => void;
} | null;

export type ScrollInputIntoView = (input: MeasurableInput) => void;

export interface KeyboardAwareScrollApi {
  scrollIntoView: ScrollInputIntoView;
  /** Called on a field's onBlur, so reserved extra scroll space (see
   * useKeyboardAwareScrollRefs) doesn't linger once nothing needs it. */
  clearFocusScroll: () => void;
}

const KeyboardAwareScrollContext = createContext<KeyboardAwareScrollApi | null>(null);

/** Used by FormField (and any other input) to scroll itself above the
 * keyboard on focus, wherever it's rendered -- inside a FormSheet or a
 * plain full-screen Screen. See useKeyboardAwareScrollRefs below for why
 * this exists instead of KeyboardAvoidingView/ScrollView's own keyboard
 * handling. Returns null outside either (nothing to scroll). */
export function useKeyboardAwareScroll(): KeyboardAwareScrollApi | null {
  return useContext(KeyboardAwareScrollContext);
}

export const KeyboardAwareScrollProvider = KeyboardAwareScrollContext.Provider;

/**
 * Shared by FormSheet (modals/bottom sheets) and Screen (plain full-screen
 * forms): the refs + scroll-to-focused-field logic every keyboard-safe
 * ScrollView in the app needs, so both get identical, independently
 * Fabric-verified behavior instead of two copies of the same fix drifting
 * apart.
 *
 * On Android, a focused field's keyboard-avoidance can't be left to
 * KeyboardAvoidingView or ScrollView's own built-in keyboard handling:
 * - Inside a `Modal` (FormSheet's case), the `Keyboard` module's
 *   `keyboardDidShow`/`keyboardDidHide` events -- which both of those
 *   depend on -- are only emitted from the Activity's root view (see
 *   react-native's ReactRootView.java), not from a Modal's separate
 *   Dialog window, so they don't reliably reach it at all.
 * - Even where those events do fire (a plain Screen, not inside a Modal),
 *   `ScrollView`'s own "scroll to focused input" method
 *   (`scrollResponderScrollNativeHandleToKeyboard`) is never actually
 *   invoked automatically anywhere in react-native's own code -- it's
 *   opt-in, not a default behavior you get for free from ScrollView or
 *   KeyboardAvoidingView.
 *
 * So every focused field scrolls itself into view directly, via a
 * measured layout, independent of either mechanism. That measurement
 * must be taken relative to an actual component *ref*, not a numeric node
 * handle: this app runs on the New Architecture (Fabric --
 * `newArchEnabled=true`), where every host ref is a `ReactNativeElement`,
 * whose `measureLayout` silently no-ops (see react-native's
 * ReactNativeElement.js: `if (!(relativeToNativeNode instanceof
 * ReactNativeElement)) return;`, before calling either callback) when
 * given a legacy `findNodeHandle()` number instead. `innerViewRef`
 * (react-native's documented replacement for `getInnerViewNode`) gives
 * the real element.
 *
 * A computed scroll target is also only useful if the ScrollView's real
 * content is actually tall enough to reach it -- `scrollTo()` clamps to
 * `[0, contentHeight - viewportHeight]` like any native scroll view. For
 * a long, growing field near the end of a short form (Notes' "Note"
 * field, with only a favorite toggle/photo picker/milestone row after
 * it), that clamp bites well before the target computed by
 * `computeFocusScrollOffset` is reachable -- see neededExtraBottomPadding's
 * doc comment. So this also reserves (and later releases) extra bottom
 * padding on the ScrollView's content exactly when a field needs more
 * room than naturally exists below it, sequenced so the padding's own
 * layout change is confirmed committed (via the ScrollView's own
 * `onContentSizeChange`) *before* the actual scrollTo runs -- changing
 * the padding and scrolling in the same frame risks the scrollTo reading
 * the pre-padding content height and clamping short regardless.
 */
export function useKeyboardAwareScrollRefs() {
  const scrollRef = useRef<ScrollView>(null);
  const innerViewRef = useRef<View>(null);
  const scrollOffsetRef = useRef(0);
  const viewportHeightRef = useRef(0);
  const extraBottomPaddingRef = useRef(0);
  const pendingInputRef = useRef<MeasurableInput>(null);
  // The generation of the scroll attempt that's waiting on onContentSizeChange
  // to confirm its padding change landed -- see isStaleScrollAttempt's doc
  // comment and onContentSizeChange below.
  const pendingGenerationRef = useRef(0);
  // Incremented every time a *new* logical scroll attempt begins (a fresh
  // focus, a settled debounced keyboard-height restore, or a clear). Tags
  // each performScroll call so its async measureLayout callback -- and any
  // onContentSizeChange continuation of it -- can recognize if a newer
  // attempt has since superseded it and discard stale results instead of
  // acting on outdated state. See isStaleScrollAttempt.
  const scrollGenerationRef = useRef(0);
  // Whichever input last asked to be scrolled into view, kept set for as
  // long as it's considered focused (cleared only in clearFocusScroll).
  // Lets the best-effort keyboardDidShow listener below re-run the same
  // scroll/padding logic for a field that was already focused before the
  // keyboard reappeared -- e.g. re-tapping an already-focused field, or the
  // keyboard being dismissed and reopened without the field ever blurring.
  const focusedInputRef = useRef<MeasurableInput>(null);
  // Already in RN logical pixels ("dp"), not raw native pixels -- DialogKeyboardObserver
  // / DialogKeyboardInsetsView.kt convert exactly once, at the native source, via
  // DisplayMetrics.density. Set only from handleDialogKeyboardChange's restore path
  // (FormSheet/Modal), reset in clearFocusScroll. Stays 0 for Screen (never mounts
  // DialogKeyboardObserver), so this has no effect there -- see
  // effectiveViewportHeight's doc comment for why it's needed at all: viewportHeightRef
  // never reflects the keyboard for Modal content.
  const keyboardHeightRef = useRef(0);
  // Collapses a burst of keyboard-height readings (the IME's own show/hide
  // animation dispatches several intermediate ones, not just the final
  // value) into a single, settled restore attempt -- see
  // KEYBOARD_RESTORE_DEBOUNCE_MS and handleDialogKeyboardChange.
  const restoreDebouncerRef = useRef(createTrailingDebouncer(KEYBOARD_RESTORE_DEBOUNCE_MS));
  const [extraBottomPadding, setExtraBottomPaddingState] = useState(0);

  const setExtraBottomPadding = useCallback((value: number) => {
    extraBottomPaddingRef.current = value;
    setExtraBottomPaddingState(value);
  }, []);

  // `generation` ties this call to whichever scrollGenerationRef value was
  // current when it was *started* -- either a fresh one (beginScrollAttempt,
  // for a new logical attempt) or an inherited one (onContentSizeChange,
  // continuing an earlier attempt that's still waiting on a padding change
  // to land). Never read scrollGenerationRef.current directly inside here
  // except to compare against it -- see isStaleScrollAttempt.
  const performScroll = useCallback(
    (input: MeasurableInput, generation: number) => {
      if (!input || Platform.OS !== 'android') {
        return;
      }
      const scrollView = scrollRef.current;
      const innerView = innerViewRef.current;
      if (!scrollView || !innerView || viewportHeightRef.current === 0) {
        return;
      }
      input.measureLayout(
        innerView,
        (_x, y, _width, height) => {
          // measureLayout crosses the native bridge asynchronously -- a newer
          // attempt (fresh focus, newer debounced keyboard reading, a clear)
          // can start, and even finish, before this callback resolves. Acting
          // on it anyway would apply a decision computed against outdated
          // keyboardHeightRef/extraBottomPaddingRef state. See
          // isStaleScrollAttempt's doc comment.
          if (isStaleScrollAttempt(generation, scrollGenerationRef.current)) {
            kbdLog('performScroll:stale', { generation, current: scrollGenerationRef.current });
            return;
          }
          // See effectiveViewportHeight's doc comment: viewportHeightRef alone is the
          // ScrollView's pre-keyboard layout height and never shrinks for Modal content,
          // so the keyboard's real height (keyboardHeightRef, Modal-only) must be
          // subtracted to get the space actually free of the keyboard.
          const viewportHeight = effectiveViewportHeight(viewportHeightRef.current, keyboardHeightRef.current);
          const needed = neededExtraBottomPadding({ inputHeight: height, viewportHeight });
          kbdLog('performScroll:measured', {
            generation,
            y,
            height,
            viewportHeight,
            viewportHeightRaw: viewportHeightRef.current,
            keyboardHeightRef: keyboardHeightRef.current,
            needed,
            currentExtraPadding: extraBottomPaddingRef.current,
            currentScrollOffset: scrollOffsetRef.current,
          });

          if (needed !== extraBottomPaddingRef.current) {
            // Reserve (or release) scroll headroom first; wait for
            // onContentSizeChange to confirm that layout actually landed
            // before scrolling -- see the doc comment above. Tag the pending
            // continuation with this same generation, so onContentSizeChange
            // can tell whether it's still current when it resumes.
            pendingInputRef.current = input;
            pendingGenerationRef.current = generation;
            kbdLog('performScroll:setExtraBottomPadding', { generation, from: extraBottomPaddingRef.current, to: needed });
            setExtraBottomPadding(needed);
            return;
          }

          const target = computeFocusScrollOffset({
            inputTop: y,
            inputHeight: height,
            currentScrollOffset: scrollOffsetRef.current,
            viewportHeight,
          });
          // Only ever scrolls when the final, settled target actually
          // requires it (computeFocusScrollOffset's own minDelta check) --
          // and the generation guard above means at most one attempt's
          // scrollTo can ever reach this point for a given burst of events,
          // so this never stacks overlapping animated scrolls.
          if (target != null) {
            kbdLog('performScroll:scrollTo', { generation, target, from: scrollOffsetRef.current });
            scrollView.scrollTo({ y: target, animated: true });
          } else {
            kbdLog('performScroll:noScrollNeeded', { generation });
          }
        },
        () => {
          kbdLog('performScroll:measureLayoutFailed', { generation });
        },
      );
    },
    [setExtraBottomPadding],
  );

  // Starts a brand-new logical scroll attempt: mints a fresh generation,
  // which implicitly invalidates (via isStaleScrollAttempt) whatever earlier
  // attempt -- in-flight measureLayout callback or pending
  // onContentSizeChange continuation -- was still outstanding.
  const beginScrollAttempt = useCallback(
    (input: MeasurableInput) => {
      scrollGenerationRef.current += 1;
      kbdLog('beginScrollAttempt', { generation: scrollGenerationRef.current });
      performScroll(input, scrollGenerationRef.current);
    },
    [performScroll],
  );

  const scrollInputIntoView = useCallback<ScrollInputIntoView>(
    (input) => {
      // Explicitly cancel any pending debounced restore before starting a
      // fresh attempt for the newly-focused field: without this, a debounce
      // scheduled for the *previous* field (from a recent keyboard-height
      // reading) would still fire later and redundantly re-validate the new
      // field's position -- harmless (it reads focusedInputRef fresh, and
      // computeFocusScrollOffset's minDelta check makes an already-correct
      // position a no-op), but not necessary, since beginScrollAttempt below
      // already positions the new field immediately.
      kbdLog('scrollInputIntoView');
      restoreDebouncerRef.current.cancel();
      focusedInputRef.current = input;
      beginScrollAttempt(input);
    },
    [beginScrollAttempt],
  );

  // Settles the ScrollView at wherever it was last known to be, rather than
  // wherever an older (now-irrelevant) scroll attempt was still animating
  // toward -- see handleKeyboardHide below for why this matters specifically
  // when the keyboard actually closes, and why it's deliberately NOT called
  // from every clearFocusScroll (plain field-to-field blur included).
  //
  // Safe to call unconditionally, animation-in-progress or not: confirmed
  // directly from this app's installed react-native 0.86.3 Android source
  // (ReactScrollView.java's startFlingAnimator, used by every animated
  // scrollTo) that starting a new animated scrollTo *always* cancels
  // whatever animator was already running first
  // (`DEFAULT_FLING_ANIMATOR.cancel()`, unconditional) before animating to
  // the new target -- so this never fights or stacks with an in-flight
  // scroll, and is a true no-op if the ScrollView is already at this offset
  // (ReactScrollViewHelper.smoothScrollTo's own `scrollY != y` check skips
  // starting an animator at all in that case). A non-animated scrollTo
  // would NOT be sufficient here: it doesn't go through that cancellation
  // path at all, so a still-running animated scroll would simply overwrite
  // an immediate snap on its very next animation frame.
  const stabilizeScroll = useCallback(() => {
    if (Platform.OS !== 'android') {
      return;
    }
    const scrollView = scrollRef.current;
    if (!scrollView) {
      return;
    }
    kbdLog('stabilizeScroll', { y: scrollOffsetRef.current });
    scrollView.scrollTo({ y: scrollOffsetRef.current, animated: true });
  }, []);

  // Shared cleanup for every way focus/keyboard-reservation state can end:
  // a field's onBlur (including switching focus between two fields in the
  // same form, where the keyboard typically stays open the whole time),
  // the Activity-level keyboardDidHide fallback, and the Dialog-specific
  // "hidden" signal. Deliberately does NOT call stabilizeScroll -- see
  // handleKeyboardHide below for the one place that does, and why doing it
  // here unconditionally would itself be a source of unwanted movement.
  const clearFocusScroll = useCallback(() => {
    if (Platform.OS !== 'android') {
      return;
    }
    kbdLog('clearFocusScroll', { priorExtraPadding: extraBottomPaddingRef.current });
    // Cancel any pending debounced restore and invalidate any in-flight
    // scroll attempt (a measureLayout callback that hasn't resolved yet, or
    // an onContentSizeChange continuation still waiting) so neither can
    // apply a decision after the keyboard has closed or focus has cleared.
    restoreDebouncerRef.current.cancel();
    scrollGenerationRef.current += 1;
    focusedInputRef.current = null;
    pendingInputRef.current = null;
    keyboardHeightRef.current = 0;
    if (extraBottomPaddingRef.current !== 0) {
      setExtraBottomPadding(0);
    }
  }, [setExtraBottomPadding]);

  // The ONE place stabilizeScroll is actually called: a genuine keyboard-hide
  // signal (Activity-level keyboardDidHide, or the Dialog-specific "hidden"
  // reading), not every clearFocusScroll caller. FormField's onBlur also
  // calls clearFocusScroll directly, on every plain field-to-field focus
  // change within a form -- the keyboard normally stays open across that, so
  // there's no stale keyboard-aware animation to stop, and stabilizing there
  // unconditionally would itself inject an unnecessary extra scrollTo on
  // every field transition (a real risk this round's review specifically
  // asked to rule out). Only an actual keyboard-hide event means whatever
  // target an in-flight scroll was still chasing may now be wrong.
  //
  // clearFocusScroll runs first, so extraBottomPadding's release (if any)
  // settles -- and the ScrollView's own native auto-clamp of its current
  // offset, if it was only reachable because of that reserved padding, has a
  // chance to happen -- before stabilizeScroll reads scrollOffsetRef.current
  // on the next frame; reading it in the same tick risks targeting a
  // position that's about to become invalid once the content shrinks.
  const handleKeyboardHide = useCallback(() => {
    kbdLog('handleKeyboardHide');
    clearFocusScroll();
    requestAnimationFrame(() => {
      kbdLog('handleKeyboardHide:raf->stabilizeScroll');
      stabilizeScroll();
    });
  }, [clearFocusScroll, stabilizeScroll]);

  const restoreFocusedInput = useCallback(() => {
    kbdLog('restoreFocusedInput', { hasFocusedInput: focusedInputRef.current != null });
    if (focusedInputRef.current) {
      beginScrollAttempt(focusedInputRef.current);
    }
  }, [beginScrollAttempt]);

  // Debounced entry point for both keyboard-show signals below (the
  // Activity-level fallback and the Dialog-specific one): collapses a burst
  // of readings -- whether several intermediate heights from the IME's own
  // slide animation, or both signals firing close together -- into a single,
  // settled restore attempt using whichever input/height are current once
  // the debounce window elapses, rather than reacting to every reading.
  const scheduleRestore = useCallback(() => {
    kbdLog('scheduleRestore:scheduled');
    restoreDebouncerRef.current.schedule(restoreFocusedInput);
  }, [restoreFocusedInput]);

  // Best-effort supplementary cleanup/restoration for the case onBlur
  // doesn't cover: Android's Back button dismisses the keyboard WITHOUT
  // blurring the focused TextInput (keyboard visibility and input focus are
  // separate concepts on Android), so without this, extraBottomPadding
  // would stay reserved -- and the scroll position stuck -- indefinitely
  // after a Back-press dismissal while the field remains focused.
  //
  // This is explicitly non-authoritative for Modal content: per this hook's
  // own doc comment above, `Keyboard`'s events are only emitted from the
  // Activity's root decorView, not from a Modal's separate Dialog window, so
  // FormSheet (a Modal) can't rely on this firing at all -- it's a harmless
  // fallback there, kept only in case DialogKeyboardObserver's Window-scoped
  // signal (below) is ever unavailable. For Screen (not a Modal), this
  // *does* reliably fire, so it's the real fix for that case. Either way,
  // `onBlur` remains the only path guaranteed-reliable everywhere; this and
  // handleDialogKeyboardChange only supplement it.
  //
  // Routed through scheduleRestore (not restoreFocusedInput directly): if
  // this fires close together with the Dialog-specific signal below -- both
  // reacting to essentially the same keyboard-show moment -- the shared
  // debounce collapses them into one settled attempt instead of two
  // independent, uncoordinated ones each driving their own scroll/padding
  // decision.
  //
  // clearFocusScroll's existing idempotency guard (the `!== 0` check above)
  // makes it safe to call from onBlur, keyboardDidHide (via
  // handleKeyboardHide), and handleDialogKeyboardChange without risk of
  // duplicate cleanup or scroll jitter -- same for restoreFocusedInput,
  // since performScroll's own computeFocusScrollOffset already no-ops below
  // its minDelta threshold.
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return undefined;
    }
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      kbdLog('ActivityKeyboard:keyboardDidHide');
      handleKeyboardHide();
    });
    const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
      kbdLog('ActivityKeyboard:keyboardDidShow', { height: e?.endCoordinates?.height });
      scheduleRestore();
    });
    return () => {
      hideSub.remove();
      showSub.remove();
    };
  }, [handleKeyboardHide, scheduleRestore]);

  // On unmount: cancel any pending debounced restore -- its closure would
  // otherwise still fire after this hook's owner (FormSheet/Screen) is gone,
  // reading refs for a component that's no longer mounted -- and invalidate
  // any outstanding scroll generation, so a measureLayout callback that
  // resolves after unmount (the native bridge call itself isn't cancelled
  // just because the JS side unmounted) is explicitly recognized as stale
  // rather than relying solely on performScroll's scrollRef/innerViewRef
  // null-checks to make it a no-op.
  useEffect(() => {
    const debouncer = restoreDebouncerRef.current;
    return () => {
      debouncer.cancel();
      scrollGenerationRef.current += 1;
    };
  }, []);

  // Fed by DialogKeyboardObserver (FormSheet only): a Window-scoped signal
  // for the Modal case the Activity-level listeners above can't reach --
  // see DialogKeyboardInsetsView.kt's doc comment for the underlying
  // mechanism (WindowInsets' IME type, observed on a view actually inside
  // the Dialog's own window, not the Activity's decorView).
  //
  // Android dispatches several intermediate WindowInsets readings while the
  // IME's own show/hide animation is actually in progress, not just one
  // final value once it settles -- this fires once per reading, including
  // every one of those. Routing the restore path through scheduleRestore
  // (rather than acting on each reading immediately) is what prevents that
  // from driving a new, separately-animated scrollTo (and, for a short form
  // whose content sits right at the fits/doesn't-fit boundary -- e.g.
  // Diaper's single short Notes field -- a repeatedly toggling
  // extraBottomPadding) once per intermediate reading.
  const handleDialogKeyboardChange = useCallback(
    // heightDp arrives already converted from native pixels to RN logical pixels in
    // DialogKeyboardInsetsView.kt (via DisplayMetrics.density) -- stored in
    // keyboardHeightRef as-is, directly comparable to viewportHeightRef (also dp, from
    // this ScrollView's own onLayout). Do not divide by density again here.
    (visible: boolean, heightDp: number) => {
      kbdLog('DialogKeyboard:onKeyboardChange', { visible, heightDp });
      if (dialogKeyboardAction(visible) === 'restore') {
        // Set before scheduleRestore's debounced callback runs, so whichever
        // reading is current when it actually fires is the one performScroll's
        // effectiveViewportHeight call picks up.
        keyboardHeightRef.current = heightDp;
        scheduleRestore();
      } else {
        // handleKeyboardHide's clearFocusScroll already resets keyboardHeightRef
        // to 0 and cancels any pending debounced restore -- an intermediate
        // reading from the keyboard's own closing animation can't resurrect a
        // scroll/padding decision after this -- and its stabilizeScroll stops
        // any scroll still animating toward a now keyboard-stale target.
        handleKeyboardHide();
      }
    },
    [scheduleRestore, handleKeyboardHide],
  );

  const onScroll = useCallback((e: { nativeEvent: { contentOffset: { y: number } } }) => {
    const y = e.nativeEvent.contentOffset.y;
    if (Math.abs(y - scrollOffsetRef.current) > 0.5) {
      kbdLog('onScroll', { from: scrollOffsetRef.current, to: y });
    }
    scrollOffsetRef.current = y;
  }, []);

  const onLayout = useCallback((e: { nativeEvent: { layout: { height: number } } }) => {
    const height = e.nativeEvent.layout.height;
    if (height !== viewportHeightRef.current) {
      kbdLog('onLayout', { from: viewportHeightRef.current, to: height });
    }
    viewportHeightRef.current = height;
  }, []);

  // Fires whenever the ScrollView's actual content size changes -- which
  // includes a moment after setExtraBottomPadding takes effect, confirming
  // that layout (and therefore the new, larger scrollable range) is
  // already committed and safe to scrollTo() against. Also fires for
  // unrelated content growth (e.g. a multiline field's own onContentSizeChange
  // feeding back here via FormField) -- harmless, since this is a no-op
  // whenever pendingInputRef isn't set.
  const onContentSizeChange = useCallback((w?: number, h?: number) => {
    kbdLog('onContentSizeChange', { w, h, hasPendingInput: pendingInputRef.current != null });
    const input = pendingInputRef.current;
    if (!input) {
      return;
    }
    const generation = pendingGenerationRef.current;
    pendingInputRef.current = null;
    // If a newer scroll attempt has started since this padding change was
    // requested (a fresh focus, a newer debounced keyboard reading, or a
    // clear), this continuation is stale: the newer attempt already
    // supersedes it and will make its own padding/scroll decision from
    // scratch once its own measureLayout resolves. Resuming this one anyway
    // -- against whatever keyboardHeightRef/extraBottomPadding now holds --
    // is exactly the self-triggering feedback loop this guards against: a
    // stale continuation computing a *different* padding need than the one
    // already in effect, re-toggling it, which re-fires onContentSizeChange
    // again. See isStaleScrollAttempt's doc comment.
    if (isStaleScrollAttempt(generation, scrollGenerationRef.current)) {
      return;
    }
    // One more frame of safety: onContentSizeChange can fire slightly
    // ahead of the new layout actually being paintable. Continues the same
    // attempt (same generation), not a new one.
    requestAnimationFrame(() => performScroll(input, generation));
  }, [performScroll]);

  return {
    scrollRef,
    innerViewRef,
    scrollInputIntoView,
    clearFocusScroll,
    handleDialogKeyboardChange,
    onScroll,
    onLayout,
    onContentSizeChange,
    extraBottomPadding,
  };
}
