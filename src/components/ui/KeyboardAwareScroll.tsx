import { createContext, useCallback, useContext, useRef } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { computeFocusScrollOffset } from '../../lib/keyboardScroll';

export type MeasurableInput = {
  measureLayout: (
    relativeToNativeComponentRef: any,
    onSuccess: (x: number, y: number, width: number, height: number) => void,
    onFail: () => void,
  ) => void;
} | null;

export type ScrollInputIntoView = (input: MeasurableInput) => void;

const KeyboardAwareScrollContext = createContext<ScrollInputIntoView | null>(null);

/** Used by FormField (and any other input) to scroll itself above the
 * keyboard on focus, wherever it's rendered -- inside a FormSheet or a
 * plain full-screen Screen. See useKeyboardAwareScrollRefs below for why
 * this exists instead of KeyboardAvoidingView/ScrollView's own keyboard
 * handling. Returns null outside either (nothing to scroll). */
export function useKeyboardAwareScroll(): ScrollInputIntoView | null {
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
 */
export function useKeyboardAwareScrollRefs() {
  const scrollRef = useRef<ScrollView>(null);
  const innerViewRef = useRef<View>(null);
  const scrollOffsetRef = useRef(0);

  const scrollInputIntoView = useCallback<ScrollInputIntoView>((input) => {
    if (!input || Platform.OS !== 'android') {
      return;
    }
    const scrollView = scrollRef.current;
    const innerView = innerViewRef.current;
    if (!scrollView || !innerView) {
      return;
    }
    input.measureLayout(
      innerView,
      (_x, y) => {
        const target = computeFocusScrollOffset({
          inputTop: y,
          currentScrollOffset: scrollOffsetRef.current,
        });
        if (target != null) {
          scrollView.scrollTo({ y: target, animated: true });
        }
      },
      () => {},
    );
  }, []);

  const onScroll = useCallback((e: { nativeEvent: { contentOffset: { y: number } } }) => {
    scrollOffsetRef.current = e.nativeEvent.contentOffset.y;
  }, []);

  return { scrollRef, innerViewRef, scrollInputIntoView, onScroll };
}
