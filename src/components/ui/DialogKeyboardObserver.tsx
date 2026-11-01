import { Platform } from 'react-native';
// Imported directly from the view's own file, not the module's index.ts barrel: the
// barrel also re-exports the plain DialogKeyboardInsetsModule, which calls
// requireNativeModule eagerly at import time and throws on any platform where the
// native module isn't registered (iOS, web). This file's requireNativeView call is
// safe to import everywhere -- see modules/dialog-keyboard-insets/src/DialogKeyboardInsetsView.tsx.
import DialogKeyboardInsetsView from '../../../modules/dialog-keyboard-insets/src/DialogKeyboardInsetsView';
import type { KeyboardChangeEventPayload } from '../../../modules/dialog-keyboard-insets/src/DialogKeyboardInsets.types';

interface Props {
  onKeyboardChange: (visible: boolean) => void;
}

/**
 * Renders DialogKeyboardInsetsView (modules/dialog-keyboard-insets): a 0x0 native marker
 * view whose WindowInsets listener observes IME changes scoped to whichever Window it's
 * actually mounted in -- e.g. FormSheet's Modal/Dialog window, which Activity-level
 * keyboard listeners (RN's Keyboard module, Reanimated's useAnimatedKeyboard) can't
 * reliably reach, since both attach to the Activity's own decorView unconditionally.
 *
 * Android-only: iOS already gets correct keyboard-avoidance from
 * KeyboardAvoidingView's 'padding' behavior (not Modal-scoped the same way Android's
 * is), and the native view doesn't exist there or on web -- rendering nothing on
 * either keeps this a no-op rather than an error.
 */
export function DialogKeyboardObserver({ onKeyboardChange }: Props) {
  if (Platform.OS !== 'android') {
    return null;
  }
  return (
    <DialogKeyboardInsetsView
      style={{ width: 0, height: 0 }}
      onKeyboardChange={(event: { nativeEvent: KeyboardChangeEventPayload }) => {
        onKeyboardChange(event.nativeEvent.visible);
      }}
    />
  );
}
