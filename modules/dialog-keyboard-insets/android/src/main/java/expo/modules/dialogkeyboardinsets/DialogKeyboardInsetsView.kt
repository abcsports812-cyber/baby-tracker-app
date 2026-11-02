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
  //
  // Tracked in raw pixels (the unit WindowInsetsCompat itself reports), not dp: exact
  // integer comparison here avoids any floating-point equality pitfalls from the
  // px->dp conversion applied only at the point of emission below.
  private var lastVisible: Boolean? = null
  private var lastHeightPx: Int = -1

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
      // WindowInsetsCompat.getInsets() -- like every Android View/WindowInsets
      // measurement -- returns raw physical pixels, not React Native's logical pixels
      // ("dp"/"points"). RN's own layout events (onLayout, measureLayout) and
      // ScrollView.scrollTo() are all in dp, so this raw value is NOT directly
      // comparable to viewportHeight on the JS side without converting it first.
      //
      // Converted here via plain Android DisplayMetrics (resources.displayMetrics.density),
      // not react-native's own PixelUtil: this local Expo module's Gradle compile
      // classpath (wired by expo-module-gradle-plugin's default dependencies, a
      // compileOnly dependency on :expo-modules-core only) doesn't expose
      // com.facebook.react.uimanager.* -- confirmed by two straight EAS build failures
      // ("Unresolved reference: PixelUtil") despite that class genuinely existing in the
      // installed react-native package. `density` is defined identically either way
      // (DisplayMetrics.density is exactly what PixelUtil.toDIPFromPixel itself divides
      // by internally), so this produces the same dp value without needing any
      // react-native dependency on this module's classpath at all. Converting here,
      // once, at the point of emission -- not on the JS side, and not before the
      // dedupe check above, which stays in exact px.
      val imeHeightPx = insets.getInsets(WindowInsetsCompat.Type.ime()).bottom

      if (imeVisible != lastVisible || imeHeightPx != lastHeightPx) {
        lastVisible = imeVisible
        lastHeightPx = imeHeightPx
        val imeHeightDp = imeHeightPx.toFloat() / resources.displayMetrics.density
        onKeyboardChange(mapOf("visible" to imeVisible, "heightDp" to imeHeightDp.toDouble()))
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
    lastHeightPx = -1
    super.onDetachedFromWindow()
  }
}
