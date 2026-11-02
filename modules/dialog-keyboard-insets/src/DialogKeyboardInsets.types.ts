import type { StyleProp, ViewStyle } from 'react-native';

export type KeyboardChangeEventPayload = {
  /** Whether the IME is currently visible in this view's own Window. */
  visible: boolean;
  /** The IME's current height in this view's own Window, already converted from raw
   * native pixels to React Native logical pixels ("dp") on the Kotlin side (via
   * PixelUtil.pxToDp(), the same conversion ReactModalHostView.kt itself uses) --
   * directly comparable to onLayout/measureLayout/scrollTo values. 0 when hidden. Do
   * not divide this by density again on the JS side; that conversion already happened
   * exactly once, in DialogKeyboardInsetsView.kt. */
  heightDp: number;
};

export type DialogKeyboardInsetsViewProps = {
  /** Fires whenever this view's own Window's keyboard visibility/height changes --
   * see DialogKeyboardInsetsView.kt's doc comment for why this is Window-scoped. */
  onKeyboardChange: (event: { nativeEvent: KeyboardChangeEventPayload }) => void;
  style?: StyleProp<ViewStyle>;
};
