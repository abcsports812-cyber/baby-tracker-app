import { requireNativeView } from 'expo';
import * as React from 'react';

import { DialogKeyboardInsetsViewProps } from './DialogKeyboardInsets.types';

const NativeView: React.ComponentType<DialogKeyboardInsetsViewProps> = requireNativeView('DialogKeyboardInsets');

export default function DialogKeyboardInsetsView(props: DialogKeyboardInsetsViewProps) {
  return <NativeView {...props} />;
}
