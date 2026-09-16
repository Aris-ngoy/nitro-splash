package com.nitrosplash

import android.app.Activity
import android.app.Application
import android.os.Bundle
import com.facebook.react.ReactApplication
import java.lang.ref.WeakReference
import java.util.concurrent.atomic.AtomicBoolean

internal object CurrentActivityHolder : Application.ActivityLifecycleCallbacks {
  private val registered = AtomicBoolean(false)

  @Volatile
  private var activityRef: WeakReference<Activity>? = null

  fun current(): Activity? {
    ensureRegistered()
    val held = activityRef?.get()?.takeUnless { it.isFinishing || it.isDestroyed }
    if (held != null) return held
    return findFromReactHost()
  }

  private fun ensureRegistered() {
    if (registered.get()) return
    val app = currentApplication() ?: return
    if (registered.compareAndSet(false, true)) {
      app.registerActivityLifecycleCallbacks(this)
    }
  }

  private fun findFromReactHost(): Activity? {
    val app = currentApplication() as? ReactApplication ?: return null
    return try {
      app.reactHost?.currentReactContext?.currentActivity?.takeUnless { it.isFinishing || it.isDestroyed }
    } catch (_: Throwable) {
      null
    }
  }

  private fun currentApplication(): Application? {
    return try {
      val clazz = Class.forName("android.app.ActivityThread")
      clazz.getMethod("currentApplication").invoke(null) as? Application
    } catch (_: Throwable) {
      null
    }
  }

  override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) {
    activityRef = WeakReference(activity)
  }

  override fun onActivityStarted(activity: Activity) {
    activityRef = WeakReference(activity)
  }

  override fun onActivityResumed(activity: Activity) {
    activityRef = WeakReference(activity)
  }

  override fun onActivityPaused(activity: Activity) = Unit

  override fun onActivityStopped(activity: Activity) = Unit

  override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) = Unit

  override fun onActivityDestroyed(activity: Activity) {
    if (activityRef?.get() === activity) {
      activityRef = null
    }
  }
}
