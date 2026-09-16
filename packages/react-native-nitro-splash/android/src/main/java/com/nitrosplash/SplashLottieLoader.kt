package com.nitrosplash

import android.content.Context
import android.view.View

/**
 * Optional Lottie path via reflection so `lottie-react-native` stays an
 * optional peer dep. If `splash_lottie.json` is bundled in res/raw and the
 * Lottie class is on the classpath, show it; otherwise return null and the
 * caller falls back to the static image. Keeps core binary small.
 */
object SplashLottieLoader {
  fun tryCreateView(context: Context): View? {
    return try {
      val rawId = context.resources.getIdentifier("splash_lottie", "raw", context.packageName)
      if (rawId == 0) return null
      val clazz = Class.forName("com.airbnb.lottie.LottieAnimationView")
      val ctor = clazz.getConstructor(Context::class.java)
      val view = ctor.newInstance(context) as View
      clazz.getMethod("setAnimation", Int::class.javaPrimitiveType).invoke(view, rawId)
      clazz.getMethod("playAnimation").invoke(view)
      try {
        clazz.getMethod("setRepeatCount", Int::class.javaPrimitiveType).invoke(view, -1)
      } catch (_: Exception) { }
      view
    } catch (_: Exception) {
      null
    } catch (_: Error) {
      null
    }
  }

  fun cancel(view: View?) {
    if (view == null) return
    try {
      view.javaClass.getMethod("cancelAnimation").invoke(view)
    } catch (_: Exception) { }
  }
}
