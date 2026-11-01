import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, ScrollView, View } from 'react-native';
import { dialogKeyboardAction } from '../../lib/dialogKeyboardInsets';
import { computeFocusScrollOffset, neededExtraBottomPadding } from '../../lib/keyboardScroll';

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
  // Whichever input last asked to be scrolled into view, kept set for as
  // long as it's considered focused (cleared only in clearFocusScroll).
  // Lets the best-effort keyboardDidShow listener below re-run the same
  // scroll/padding logic for a field that was already focused before the
  // keyboard reappeared -- e.g. re-tapping an already-focused field, or the
  // keyboard being dismissed and reopened without the field ever blurring.
  const focusedInputRef = useRef<MeasurableInput>(null);
  const [extraBottomPadding, setExtraBottomPaddingState] = useState(0);

  const setExtraBottomPadding = useCallback((value: number) => {
    extraBottomPaddingRef.current = value;
    setExtraBottomPaddingState(value);
  }, []);

  const performScroll = useCallback(
    (input: MeasurableInput) => {
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
          const viewportHeight = viewportHeightRef.current;
          const needed = neededExtraBottomPadding({ inputHeight: height, viewportHeight });

          if (needed !== extraBottomPaddingRef.current) {
            // Reserve (or release) scroll headroom first; wait for
            // onContentSizeChange to confirm that layout actually landed
            // before scrolling -- see the doc comment above.
            pendingInputRef.current = input;
            setExtraBottomPadding(needed);
            return;
          }

          const target = computeFocusScrollOffset({
            inputTop: y,
            inputHeight: height,
            currentScrollOffset: scrollOffsetRef.current,
            viewportHeight,
          });
          if (target != null) {
            scrollView.scrollTo({ y: target, animated: true });
          }
        },
        () => {},
      );
    },
    [setExtraBottomPadding],
  );

  const scrollInputIntoView = useCallback<ScrollInputIntoView>(
    (input) => {
      focusedInputRef.current = input;
      performScroll(input);
    },
    [performScroll],
  );

  const clearFocusScroll = useCallback(() => {
    if (Platform.OS !== 'android') {
      return;
    }
    focusedInputRef.current = null;
    pendingInputRef.current = null;
    if (extraBottomPaddingRef.current !== 0) {
      setExtraBottomPadding(0);
    }
  }, [setExtraBottomPadding]);

  const restoreFocusedInput = useCallback(() => {
    if (focusedInputRef.current) {
      performScroll(focusedInputRef.current);
    }
  }, [performScroll]);

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
  // clearFocusScroll's existing idempotency guard (the `!== 0` check above)
  // makes it safe to call from onBlur, keyboardDidHide, and
  // handleDialogKeyboardChange without risk of duplicate cleanup or scroll
  // jitter -- same for restoreFocusedInput, since performScroll's own
  // computeFocusScrollOffset already no-ops below its minDelta threshold.
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return undefined;
    }
    const hideSub = Keyboard.addListener('keyboardDidHide', clearFocusScroll);
    const showSub = Keyboard.addListener('keyboardDidShow', restoreFocusedInput);
    return () => {
      hideSub.remove();
      showSub.remove();
    };
  }, [clearFocusScroll, restoreFocusedInput]);

  // Fed by DialogKeyboardObserver (FormSheet only): a Window-scoped signal
  // for the Modal case the Activity-level listeners above can't reach --
  // see DialogKeyboardInsetsView.kt's doc comment for the underlying
  // mechanism (WindowInsets' IME type, observed on a view actually inside
  // the Dialog's own window, not the Activity's decorView).
  const handleDialogKeyboardChange = useCallback(
    (visible: boolean) => {
      if (dialogKeyboardAction(visible) === 'restore') {
        restoreFocusedInput();
      } else {
        clearFocusScroll();
      }
    },
    [restoreFocusedInput, clearFocusScroll],
  );

  const onScroll = useCallback((e: { nativeEvent: { contentOffset: { y: number } } }) => {
    scrollOffsetRef.current = e.nativeEvent.contentOffset.y;
  }, []);

  const onLayout = useCallback((e: { nativeEvent: { layout: { height: number } } }) => {
    viewportHeightRef.current = e.nativeEvent.layout.height;
  }, []);

  // Fires whenever the ScrollView's actual content size changes -- which
  // includes a moment after setExtraBottomPadding takes effect, confirming
  // that layout (and therefore the new, larger scrollable range) is
  // already committed and safe to scrollTo() against.
  const onContentSizeChange = useCallback(() => {
    const input = pendingInputRef.current;
    if (!input) {
      return;
    }
    pendingInputRef.current = null;
    // One more frame of safety: onContentSizeChange can fire slightly
    // ahead of the new layout actually being paintable.
    requestAnimationFrame(() => performScroll(input));
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
