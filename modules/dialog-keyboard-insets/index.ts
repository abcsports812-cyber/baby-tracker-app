// Re-export the native module. On web, it will be resolved to DialogKeyboardInsetsModule.web.ts
// and on native platforms to DialogKeyboardInsetsModule.ts
export { default } from './src/DialogKeyboardInsetsModule';
export { default as DialogKeyboardInsetsView } from './src/DialogKeyboardInsetsView';
export * from './src/DialogKeyboardInsets.types';
