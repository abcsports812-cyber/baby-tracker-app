package expo.modules.dialogkeyboardinsets

import android.content.Context
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView

/**
 * An invisible (0x0, rendered by the JS side with style={width:0,height:0}) marker view.
 * Its only job is to be mounted somewhere inside FormSheet's Modal content, so that the
 * WindowInsets listener below observes IME changes scoped to *this view's own Window* --
 * the Modal's separate Dialog window when rendered there, or the Activity's window
 * otherwise -- rather than always the Activity's root decorView.
 *
 * This matters specifically because RN's `Keyboard` module (and Reanimated's
 * `useAnimatedKeyboard`) both attach their listener to the Activity's
 * `currentActivity.window.decorView` unconditionally. A Modal renders its content in a
 * separate Android `Dialog`, which owns its own `Window` -- WindowInsets (including the
 * IME type) are dispatched per-Window, so the Activity-level listener never reliably
 * reaches a view living inside that Dialog. Attaching the listener directly to a view
 * that's actually inside the Dialog's own view hierarchy instead picks up exactly the
 * right Window's insets, Dialog or Activity, whichever this ends up mounted in.
 */
class DialogKeyboardInsetsView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  private val onKeyboardChange by EventDispatcher<Map<String, Any>>()

  // Last-emitted state, so a WindowInsets dispatch for an unrelated change (status/
  // navigation bar visibility, rotation, etc.) doesn't re-emit a no-op "keyboard changed"
  // event -- the JS side's clearFocusScroll/performScroll calls are idempotent, but there's
  // no reason to invoke them more than once per actual keyboard state change.
  private var lastVisible: Boolean? = null
  private var lastHeight: Int = -1

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    // Passed as a trailing lambda directly to ViewCompat.setOnApplyWindowInsetsListener,
    // rather than built via a named `OnApplyWindowInsetsListener { ... }` SAM-constructor
    // expression stored in a property: this class extends ExpoView -> ... -> View, which
    // declares its own nested `View.OnApplyWindowInsetsListener` interface, and Kotlin's
    // name resolution gives that inherited nested classifier priority over the top-level
    // `androidx.core.view.OnApplyWindowInsetsListener` import when a bare
    // `OnApplyWindowInsetsListener` identifier is used inside this class body. That
    // silently built the wrong (platform) listener type, caught at compile time only when
    // passed into this AndroidX Compat call, which requires the AndroidX type. Passing the
    // lambda directly here instead lets its SAM target type come from this function's own
    // declared parameter type, never from a bare name lookup in our class scope.
    ViewCompat.setOnApplyWindowInsetsListener(this) { _, insets ->
      val imeVisible = insets.isVisible(WindowInsetsCompat.Type.ime())
      val imeHeight = insets.getInsets(WindowInsetsCompat.Type.ime()).bottom

      if (imeVisible != lastVisible || imeHeight != lastHeight) {
        lastVisible = imeVisible
        lastHeight = imeHeight
        onKeyboardChange(mapOf("visible" to imeVisible, "height" to imeHeight.toDouble()))
      }

      insets
    }
    // setOnApplyWindowInsetsListener only fires on the *next* insets change. If the
    // keyboard is already open when this view (re)attaches -- e.g. the Note field was
    // mid-edit while this view's own parent was briefly detached/reattached -- explicitly
    // ask the system to redeliver the current insets now, so JS doesn't miss that state.
    ViewCompat.requestApplyInsets(this)
  }

  override fun onDetachedFromWindow() {
    // Detach the listener before the view (and its window) goes away, and reset the
    // dedupe state so a later re-attach doesn't wrongly skip re-announcing the keyboard's
    // actual current state as a "no change".
    ViewCompat.setOnApplyWindowInsetsListener(this, null)
    lastVisible = null
    lastHeight = -1
    super.onDetachedFromWindow()
  }
}
