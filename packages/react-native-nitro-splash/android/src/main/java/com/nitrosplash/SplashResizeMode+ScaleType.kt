package com.nitrosplash

import android.widget.ImageView
import com.margelo.nitro.nitrosplash.SplashResizeMode

fun SplashResizeMode.toScaleType(): ImageView.ScaleType {
  return when (this) {
    SplashResizeMode.CONTAIN -> ImageView.ScaleType.FIT_CENTER
    SplashResizeMode.COVER -> ImageView.ScaleType.CENTER_CROP
    SplashResizeMode.STRETCH -> ImageView.ScaleType.FIT_XY
    SplashResizeMode.NATIVE -> ImageView.ScaleType.CENTER
  }
}
