package com.nitrosplash

import com.facebook.react.bridge.UiThreadUtil
import com.margelo.nitro.core.Promise
import com.margelo.nitro.nitrosplash.HideOptions
import com.margelo.nitro.nitrosplash.HybridSplashscreenSpec
import com.margelo.nitro.nitrosplash.SplashAnimation
import com.margelo.nitro.nitrosplash.SplashOptions

final class HybridSplashscreen : HybridSplashscreenSpec() {
  override fun show(options: SplashOptions) {
    SplashOverlayController.show(
      backgroundColor = options.backgroundColor,
      darkBackgroundColor = options.darkBackgroundColor,
      resizeMode = options.resizeMode,
      logoWidthDp = options.logoWidth,
    )
  }

  override fun hide(options: HideOptions?): Promise<Boolean> {
    val wasVisible = SplashOverlayController.isVisible()
    if (!wasVisible) {
      return Promise.resolved(false)
    }
    val animation = options?.animation ?: SplashAnimation.FADE
    val durationMs = options?.durationMs ?: 350.0
    // Single UI-thread hop at the boundary; animation + removal stay on main.
    UiThreadUtil.runOnUiThread {
      SplashAnimationRunner.hideOnUiThread(animation, durationMs)
    }
    return Promise.resolved(true)
  }

  override fun isVisible(): Boolean = SplashOverlayController.isVisible()

  override fun preventAutoHide(): Boolean {
    SplashOverlayController.autoHidePrevented = true
    return true
  }

  override fun setBackgroundColor(color: String) {
    SplashOverlayController.updateBackground(color)
  }
}
