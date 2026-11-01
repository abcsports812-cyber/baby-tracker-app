import { NativeModule, requireNativeModule } from 'expo';

declare class DialogKeyboardInsetsModule extends NativeModule<{}> {}

export default requireNativeModule<DialogKeyboardInsetsModule>('DialogKeyboardInsets');
