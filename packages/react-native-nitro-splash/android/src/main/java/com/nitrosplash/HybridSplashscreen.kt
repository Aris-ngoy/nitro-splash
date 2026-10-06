package com.nitrosplash

import com.facebook.react.bridge.UiThreadUtil
import com.margelo.nitro.core.Promise
import android.content.res.Configuration
import com.margelo.nitro.nitrosplash.HandoffMetrics
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
      logoHeightDp = options.logoHeight,
      brandWidthDp = options.brandWidth,
      brandHeightDp = options.brandHeight,
      brandBottomDp = options.brandBottom,
    )
  }

  override fun handoffMetrics(): HandoffMetrics {
    val activity = CurrentActivityHolder.current()
    val resources = activity?.resources
    val density = resources?.displayMetrics?.density ?: 1f
    val night =
      resources?.configuration?.uiMode?.and(Configuration.UI_MODE_NIGHT_MASK) ==
        Configuration.UI_MODE_NIGHT_YES
    return HandoffMetrics(
      night,
      dimenDp(resources, "status_bar_height", density),
      dimenDp(resources, "navigation_bar_height", density),
    )
  }

  private fun dimenDp(resources: android.content.res.Resources?, name: String, density: Float): Double {
    if (resources == null || density <= 0f) return 0.0
    val id = resources.getIdentifier(name, "dimen", "android")
    if (id == 0) return 0.0
    return (resources.getDimensionPixelSize(id) / density).toDouble()
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
		SplashOverlayController.showFromResources()
		return true
	}

  override fun setBackgroundColor(color: String) {
    SplashOverlayController.updateBackground(color)
  }
}
