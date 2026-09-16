package com.nitrosplash

import com.facebook.react.bridge.UiThreadUtil
import com.margelo.nitro.nitrosplash.SplashAnimation

object SplashAnimationRunner {
  /**
   * Must be called on the UI thread. [HybridSplashscreen.hide] hops once at
   * the Promise boundary; this object never hops itself.
   */
  fun hideOnUiThread(animation: SplashAnimation, durationMs: Double) {
    val overlay = SplashOverlayController.overlayView()
    if (overlay == null) {
      SplashOverlayController.removeImmediately()
      return
    }
    val duration = durationMs.toLong().coerceIn(100L, 1500L)
    overlay.isClickable = false
    overlay.bringToFront()
    when (animation) {
      SplashAnimation.NONE -> SplashOverlayController.removeImmediately()
      SplashAnimation.FADE ->
        overlay
          .animate()
          .alpha(0f)
          .setDuration(duration)
          .withEndAction { SplashOverlayController.removeImmediately() }
          .start()
      SplashAnimation.SLIDEUP ->
        overlay
          .animate()
          .translationY(-overlay.height.toFloat())
          .setDuration(duration)
          .withEndAction { SplashOverlayController.removeImmediately() }
          .start()
      SplashAnimation.SLIDEDOWN ->
        overlay
          .animate()
          .translationY(overlay.height.toFloat())
          .setDuration(duration)
          .withEndAction { SplashOverlayController.removeImmediately() }
          .start()
      SplashAnimation.SCALE ->
        overlay
          .animate()
          .scaleX(1.12f)
          .scaleY(1.12f)
          .alpha(0f)
          .setDuration(duration)
          .withEndAction { SplashOverlayController.removeImmediately() }
          .start()
      SplashAnimation.FADESLIDE ->
        overlay
          .animate()
          .translationY(-48f)
          .alpha(0f)
          .setDuration(duration)
          .withEndAction { SplashOverlayController.removeImmediately() }
          .start()
    }
  }

  @Deprecated("Call hideOnUiThread from the UI thread", ReplaceWith("hideOnUiThread(animation, durationMs)"))
  fun hide(animation: SplashAnimation, durationMs: Double) {
    if (UiThreadUtil.isOnUiThread()) {
      hideOnUiThread(animation, durationMs)
    } else {
      UiThreadUtil.runOnUiThread { hideOnUiThread(animation, durationMs) }
    }
  }
}
