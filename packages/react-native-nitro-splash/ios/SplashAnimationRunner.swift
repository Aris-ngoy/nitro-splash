import UIKit

/// Native-driven exit animations. Runs on main, no JS frames involved.
enum SplashAnimationRunner {
  static func hide(animation: SplashAnimation, durationMs: Double) {
    guard let overlay = SplashOverlayWindow.overlayWindow,
      let container = SplashOverlayWindow.containerView
    else {
      SplashOverlayWindow.removeImmediately()
      return
    }
    let duration = max(0.1, min(1.5, durationMs / 1000.0))
    switch animation {
    case .none:
      SplashOverlayWindow.removeImmediately()
    case .fade:
      UIView.animate(
        withDuration: duration, delay: 0, options: [.curveEaseOut],
        animations: { container.alpha = 0 },
        completion: { _ in SplashOverlayWindow.removeImmediately() })
    case .slideup:
      UIView.animate(
        withDuration: duration, delay: 0, options: [.curveEaseOut],
        animations: { container.transform = CGAffineTransform(translationX: 0, y: -container.bounds.height) },
        completion: { _ in SplashOverlayWindow.removeImmediately() })
    case .slidedown:
      UIView.animate(
        withDuration: duration, delay: 0, options: [.curveEaseOut],
        animations: { container.transform = CGAffineTransform(translationX: 0, y: container.bounds.height) },
        completion: { _ in SplashOverlayWindow.removeImmediately() })
    case .scale:
      UIView.animate(
        withDuration: duration, delay: 0, options: [.curveEaseInOut],
        animations: {
          container.transform = CGAffineTransform(scaleX: 1.12, y: 1.12)
          container.alpha = 0
        },
        completion: { _ in SplashOverlayWindow.removeImmediately() })
    case .fadeslide:
      UIView.animate(
        withDuration: duration, delay: 0, options: [.curveEaseOut],
        animations: {
          container.transform = CGAffineTransform(translationX: 0, y: -24)
          container.alpha = 0
        },
        completion: { _ in SplashOverlayWindow.removeImmediately() })
    }
    overlay.isUserInteractionEnabled = false
  }
}
