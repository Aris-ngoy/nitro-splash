package com.nitrosplash

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable

/// Downsampled decode: read bounds first, compute inSampleSize for
/// targetWidthDp * density, then decode. A 2048px logo never lands
/// at full resolution. PNG/JPG/WebP via BitmapFactory. SVG/Lottie are
/// pre-rasterized by the CLI — runtime SVG parsing stays off the hot path.
object SplashBitmapLoader {
  fun loadLogo(context: Context, targetWidthDp: Int): Bitmap? {
    val density = context.resources.displayMetrics.density
    val targetPx = (targetWidthDp * density).toInt().coerceAtLeast(96)
    val res = context.resources
    val pkg = context.packageName
    val candidates = listOf("splashscreen_image", "bootsplash_logo", "splashscreen_logo")
    for (name in candidates) {
      val id = res.getIdentifier(name, "drawable", pkg)
      if (id == 0) continue
      val opts = BitmapFactory.Options().apply { inJustDecodeBounds = true }
      BitmapFactory.decodeResource(res, id, opts)
      val rawW = opts.outWidth.takeIf { it > 0 } ?: targetPx
      var sample = 1
      while (rawW / (sample * 2) >= targetPx) sample *= 2
      val decode = BitmapFactory.Options().apply {
        inSampleSize = sample
        inPreferredConfig = Bitmap.Config.ARGB_8888
        inScaled = true
      }
      try {
        return BitmapFactory.decodeResource(res, id, decode)
      } catch (_: OutOfMemoryError) {
        System.gc()
        return null
      }
    }
    return null
  }

  fun recycle(drawable: Drawable?) {
    (drawable as? BitmapDrawable)?.bitmap?.let {
      if (!it.isRecycled) {
        try { it.recycle() } catch (_: Exception) { }
      }
    }
  }
}
