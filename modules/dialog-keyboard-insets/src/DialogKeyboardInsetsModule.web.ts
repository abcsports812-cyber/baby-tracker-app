import { registerWebModule, NativeModule } from 'expo';

// DialogKeyboardInsetsModule is not available on the web platform.
class DialogKeyboardInsetsModule extends NativeModule<{}> {}

export default registerWebModule(DialogKeyboardInsetsModule, 'DialogKeyboardInsetsModule');
