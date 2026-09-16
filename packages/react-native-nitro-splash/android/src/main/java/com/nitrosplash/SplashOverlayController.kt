package com.nitrosplash

import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.ImageView
import com.facebook.react.bridge.UiThreadUtil
import com.margelo.nitro.nitrosplash.SplashResizeMode

object SplashOverlayController {
  @Volatile
  private var overlay: FrameLayout? = null
  private var logoView: ImageView? = null
  private var lottieView: android.view.View? = null
  @Volatile
  var autoHidePrevented: Boolean = false

  fun isVisible(): Boolean = overlay != null

  fun showFromResources() {
    val activity = CurrentActivityHolder.current()
    val background = try {
      if (activity == null) "#FFFFFF"
      else {
        val id = activity.resources.getIdentifier("nitrosplash_background", "color", activity.packageName)
        if (id != 0) String.format("#%06X", 0xFFFFFF and activity.getColor(id)) else "#FFFFFF"
      }
    } catch (_: Throwable) {
      "#FFFFFF"
    }
    show(
      backgroundColor = background,
      darkBackgroundColor = null,
      resizeMode = SplashResizeMode.CONTAIN,
      logoWidthDp = 120.0,
    )
  }

  fun show(
    backgroundColor: String,
    darkBackgroundColor: String?,
    resizeMode: SplashResizeMode,
    logoWidthDp: Double?,
  ) {
    UiThreadUtil.runOnUiThread {
      val activity = CurrentActivityHolder.current() ?: return@runOnUiThread
      if (overlay != null) {
        updateBackground(backgroundColor)
        return@runOnUiThread
      }
      val root = activity.window.decorView as? ViewGroup ?: return@runOnUiThread
      val frame = FrameLayout(activity).apply {
        layoutParams =
          FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT,
          )
        setBackgroundColor(SplashColors.parse(backgroundColor))
        isClickable = false
        isFocusable = false
      }

      // Lottie path: reflection so lottie-react-native stays optional.
      val lottie = SplashLottieLoader.tryCreateView(activity)
      if (lottie != null) {
        lottieView = lottie
        frame.addView(
          lottie,
          FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT,
          ),
        )
      } else {
        val targetDp = (logoWidthDp ?: 120.0).toInt().coerceIn(48, 320)
        val image =
          ImageView(activity).apply {
            scaleType = resizeMode.toScaleType()
            adjustViewBounds = true
            setImageBitmap(SplashBitmapLoader.loadLogo(activity, targetWidthDp = targetDp))
          }
        logoView = image
        frame.addView(
          image,
          FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT,
          ),
        )
      }

      root.addView(frame)
      overlay = frame
    }
  }

  fun updateBackground(hex: String) {
    UiThreadUtil.runOnUiThread {
      overlay?.setBackgroundColor(SplashColors.parse(hex))
    }
  }

  fun removeImmediately() {
    UiThreadUtil.runOnUiThread {
      val frame = overlay ?: return@runOnUiThread
      SplashLottieLoader.cancel(lottieView)
      (frame.parent as? ViewGroup)?.removeView(frame)
      SplashBitmapLoader.recycle(logoView?.drawable)
      logoView?.setImageDrawable(null)
      logoView = null
      lottieView = null
      overlay = null
    }
  }

  fun overlayView(): FrameLayout? = overlay
}
