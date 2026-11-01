package expo.modules.dialogkeyboardinsets

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class DialogKeyboardInsetsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("DialogKeyboardInsets")

    View(DialogKeyboardInsetsView::class) {
      // Fired whenever this view's own Window's IME (keyboard) insets change --
      // see DialogKeyboardInsetsView's doc comment for why that's Window-scoped,
      // not Activity-scoped.
      Events("onKeyboardChange")
    }
  }
}
