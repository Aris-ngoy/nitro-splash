package com.nitrosplash

import android.app.Activity
import android.content.res.Configuration
import android.view.Gravity
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.ImageView
import com.facebook.react.bridge.UiThreadUtil
import com.margelo.nitro.nitrosplash.SplashResizeMode

object SplashOverlayController {
  @Volatile
  private var overlay: FrameLayout? = null
  private var logoView: ImageView? = null
  private var brandView: ImageView? = null
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
    val logoWidth = readNumber(activity, "nitrosplash_logo_width") ?: 120.0
    val logoHeight = readNumber(activity, "nitrosplash_logo_height") ?: logoWidth
    show(
      backgroundColor = background,
      darkBackgroundColor = readColor(activity, "nitrosplash_dark_background"),
      resizeMode = SplashResizeMode.CONTAIN,
      logoWidthDp = logoWidth,
      logoHeightDp = logoHeight,
      brandWidthDp = readNumber(activity, "nitrosplash_brand_width"),
      brandHeightDp = readNumber(activity, "nitrosplash_brand_height"),
      brandBottomDp = readNumber(activity, "nitrosplash_brand_bottom"),
    )
  }

  fun show(
    backgroundColor: String,
    darkBackgroundColor: String?,
    resizeMode: SplashResizeMode,
    logoWidthDp: Double?,
    logoHeightDp: Double?,
    brandWidthDp: Double?,
    brandHeightDp: Double?,
    brandBottomDp: Double?,
  ) {
    UiThreadUtil.runOnUiThread {
      val activity = CurrentActivityHolder.current() ?: return@runOnUiThread
      val night =
        activity.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK ==
          Configuration.UI_MODE_NIGHT_YES
      val resolved =
        if (night && darkBackgroundColor != null) darkBackgroundColor else backgroundColor
      if (overlay != null) {
        updateBackground(resolved)
        return@runOnUiThread
      }
      val root = activity.window.decorView as? ViewGroup ?: return@runOnUiThread
      val frame = FrameLayout(activity).apply {
        layoutParams =
          FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT,
          )
        setBackgroundColor(SplashColors.parse(resolved))
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
        val widthDp = logoWidthDp ?: 120.0
        val heightDp = logoHeightDp ?: widthDp
        val density = activity.resources.displayMetrics.density
        val image =
          ImageView(activity).apply {
            scaleType = resizeMode.toScaleType()
            setImageBitmap(
              SplashBitmapLoader.loadLogo(activity, widthDp.toInt(), heightDp.toInt()),
            )
          }
        logoView = image
        frame.addView(
          image,
          FrameLayout.LayoutParams(px(widthDp, density), px(heightDp, density)).apply {
            gravity = Gravity.CENTER
          },
        )
        if (brandWidthDp != null && brandHeightDp != null && brandBottomDp != null) {
          val bitmap = SplashBitmapLoader.loadBrand(activity, brandWidthDp.toInt(), brandHeightDp.toInt())
          if (bitmap != null) {
            val brand =
              ImageView(activity).apply {
                scaleType = ImageView.ScaleType.FIT_CENTER
                setImageBitmap(bitmap)
              }
            brandView = brand
            frame.addView(
              brand,
              FrameLayout.LayoutParams(px(brandWidthDp, density), px(brandHeightDp, density)).apply {
                gravity = Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL
                bottomMargin = px(brandBottomDp, density)
              },
            )
          }
        }
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
      SplashBitmapLoader.recycle(brandView?.drawable)
      logoView?.setImageDrawable(null)
      brandView?.setImageDrawable(null)
      logoView = null
      brandView = null
      lottieView = null
      overlay = null
    }
  }

  fun overlayView(): FrameLayout? = overlay

  private fun px(dp: Double, density: Float): Int = (dp * density).toInt().coerceAtLeast(1)

  private fun readNumber(activity: Activity?, name: String): Double? {
    if (activity == null) return null
    val id = activity.resources.getIdentifier(name, "string", activity.packageName)
    if (id == 0) return null
    return activity.getString(id).toDoubleOrNull()
  }

  private fun readColor(activity: Activity?, name: String): String? {
    if (activity == null) return null
    val id = activity.resources.getIdentifier(name, "color", activity.packageName)
    if (id == 0) return null
    return try {
      String.format("#%06X", 0xFFFFFF and activity.getColor(id))
    } catch (_: Throwable) {
      null
    }
  }
}
