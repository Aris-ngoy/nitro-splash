package com.nitrosplash

import android.graphics.Color
import android.widget.ImageView

object SplashColors {
  fun parse(hex: String): Int {
    return try {
      Color.parseColor(if (hex.startsWith("#")) hex else "#$hex")
    } catch (_: Exception) {
      Color.WHITE
    }
  }
}
