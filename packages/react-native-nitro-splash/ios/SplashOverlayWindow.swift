import UIKit

/// Owns the overlay UIWindow above the key window. Two-phase model:
/// Phase A is the OS LaunchScreen storyboard; Phase B is this window,
/// pixel-matched so hide() never flashes.
///
/// All methods must be called on the main thread (UIKit requirement).
/// The Nitro entry point hops once at the boundary; helpers never hop.
final class SplashOverlayWindow {
	static var overlayWindow: UIWindow?
	static var containerView: UIView?
	static var logoView: UIImageView?
	static var autoHidePrevented = false
	static var visible = false

	/// Main-thread only. Use `isVisibleSync()` from background threads.
	static func isVisibleAssumingMain() -> Bool {
		return visible && overlayWindow?.isHidden == false
	}

	static func show(
		backgroundHex: String,
		darkBackgroundHex: String?,
		resizeMode: SplashResizeMode,
		logoWidthPt: Double,
		statusBarHidden: Bool
	) {
		guard let keyWindow = findKeyWindow() else { return }
		let targetWidth = min(max(logoWidthPt, 48.0), 320.0)
		if overlayWindow != nil {
			updateBackground(hex: currentHex(light: backgroundHex, dark: darkBackgroundHex, window: keyWindow))
			return
		}

		let frame = keyWindow.bounds
		let overlay: UIWindow
		if let scene = keyWindow.windowScene {
			overlay = UIWindow(windowScene: scene)
		} else {
			overlay = UIWindow(frame: frame)
		}
		overlay.frame = frame
		overlay.windowLevel = UIWindow.Level.statusBar + 1
		overlay.isUserInteractionEnabled = false

		let rootVC = SplashRootViewController()
		rootVC.statusBarHidden = statusBarHidden
		rootVC.view.backgroundColor = UIColor(
			hex: currentHex(light: backgroundHex, dark: darkBackgroundHex, window: keyWindow)
		)
		rootVC.view.frame = frame
		rootVC.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]

		let imageView = UIImageView(frame: rootVC.view.bounds)
		imageView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
		imageView.contentMode = resizeMode.toContentMode()
		imageView.backgroundColor = .clear
		if let image = SplashImageLoader.loadLogo(targetWidthPt: targetWidth) {
			imageView.image = image
		}
		rootVC.view.addSubview(imageView)

		overlay.rootViewController = rootVC
		overlay.isHidden = false

		overlayWindow = overlay
		containerView = rootVC.view
		logoView = imageView
		visible = true
	}

	static func updateBackground(hex: String) {
		containerView?.backgroundColor = UIColor(hex: hex)
	}

	static func removeImmediately() {
		overlayWindow?.isHidden = true
		overlayWindow?.rootViewController = nil
		overlayWindow = nil
		containerView = nil
		logoView = nil
		visible = false
	}

	private static func currentHex(light: String, dark: String?, window: UIWindow) -> String {
		guard let dark else { return light }
		if #available(iOS 13.0, *) {
			return window.traitCollection.userInterfaceStyle == .dark ? dark : light
		}
		return light
	}

	static func findKeyWindow() -> UIWindow? {
		if #available(iOS 13.0, *) {
			let scenes = UIApplication.shared.connectedScenes
				.compactMap { $0 as? UIWindowScene }
				.filter { $0.activationState == .foregroundActive || $0.activationState == .foregroundInactive }
			for scene in scenes {
				if let keyWindow = scene.windows.first(where: { $0.isKeyWindow }) {
					return keyWindow
				}
				if let first = scene.windows.first {
					return first
				}
			}
		}
		return UIApplication.shared.keyWindow
	}
}

final class SplashRootViewController: UIViewController {
	var statusBarHidden = false

	override var prefersStatusBarHidden: Bool {
		return statusBarHidden
	}
}
