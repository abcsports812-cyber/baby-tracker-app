import type { StyleProp, ViewStyle } from 'react-native';

export type KeyboardChangeEventPayload = {
  /** Whether the IME is currently visible in this view's own Window. */
  visible: boolean;
  /** The IME's current height in this view's own Window, in pixels (0 when hidden). */
  height: number;
};

export type DialogKeyboardInsetsViewProps = {
  /** Fires whenever this view's own Window's keyboard visibility/height changes --
   * see DialogKeyboardInsetsView.kt's doc comment for why this is Window-scoped. */
  onKeyboardChange: (event: { nativeEvent: KeyboardChangeEventPayload }) => void;
  style?: StyleProp<ViewStyle>;
};
