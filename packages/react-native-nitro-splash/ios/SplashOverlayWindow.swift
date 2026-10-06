import UIKit

/// Owns the Phase B splash overlay as a subview of the app window.
/// Phase A is the OS LaunchScreen storyboard; this view is pixel-matched
/// so hide() never flashes. Implemented as a window subview (not a second
/// UIWindow) so UIScene / iOS 27 key-window rules cannot hide it.
///
/// All methods must be called on the main thread (UIKit requirement).
/// The Nitro entry point hops once at the boundary; helpers never hop.
final class SplashOverlayWindow {
	static var overlayWindow: UIWindow?
	static var containerView: UIView?
	static var logoView: UIImageView?
	static var brandView: UIImageView?
	static var autoHidePrevented = false
	static var visible = false
	private static var observing = false

	/// Main-thread only.
	static func isVisibleAssumingMain() -> Bool {
		return visible && containerView?.superview != nil && containerView?.isHidden == false
	}

	static func startObserving() {
		if observing {
			showFromBundleIfNeeded(windowHint: nil)
			return
		}
		observing = true
		let names: [NSNotification.Name] = [
			UIScene.didActivateNotification,
			UIWindow.didBecomeVisibleNotification,
			UIApplication.didBecomeActiveNotification,
		]
		for name in names {
			NotificationCenter.default.addObserver(
				forName: name,
				object: nil,
				queue: .main
			) { note in
				showFromBundleIfNeeded(windowHint: note.object as? UIWindow)
			}
		}
		showFromBundleIfNeeded(windowHint: nil)
	}

	static func showFromBundleIfNeeded(windowHint: UIWindow?) {
		if let existing = containerView {
			if let parent = existing.superview {
				parent.bringSubviewToFront(existing)
				return
			}
			containerView = nil
			logoView = nil
			brandView = nil
			visible = false
		}
		let info = Bundle.main.infoDictionary
		let background = (info?["NitroSplashBackground"] as? String) ?? "#FFFFFF"
		let dark = info?["NitroSplashDarkBackground"] as? String
		let resize = resizeMode(from: info?["NitroSplashResizeMode"] as? String)
		let logoWidth = plistDouble(info, key: "NitroSplashLogoWidth") ?? 120
		let logoHeight = plistDouble(info, key: "NitroSplashLogoHeight") ?? logoWidth
		let statusBarHidden = (info?["UIStatusBarHidden"] as? Bool) ?? false
		show(
			backgroundHex: background,
			darkBackgroundHex: dark,
			resizeMode: resize,
			logoWidthPt: logoWidth,
			logoHeightPt: logoHeight,
			brandWidthPt: plistDouble(info, key: "NitroSplashBrandWidth"),
			brandHeightPt: plistDouble(info, key: "NitroSplashBrandHeight"),
			brandBottomPt: plistDouble(info, key: "NitroSplashBrandBottom"),
			statusBarHidden: statusBarHidden,
			windowHint: windowHint
		)
	}

	static func show(
		backgroundHex: String,
		darkBackgroundHex: String?,
		resizeMode: SplashResizeMode,
		logoWidthPt: Double,
		logoHeightPt: Double,
		brandWidthPt: Double?,
		brandHeightPt: Double?,
		brandBottomPt: Double?,
		statusBarHidden: Bool,
		windowHint: UIWindow? = nil
	) {
		guard let hostWindow = hostWindow(hint: windowHint) else { return }
		if let existing = containerView, existing.superview != nil {
			updateBackground(hex: currentHex(light: backgroundHex, dark: darkBackgroundHex, window: hostWindow))
			existing.superview?.bringSubviewToFront(existing)
			return
		}
		containerView = nil
		logoView = nil
		brandView = nil
		visible = false

		let frame = hostWindow.bounds
		guard frame.width > 1, frame.height > 1 else { return }

		let container = UIView(frame: frame)
		container.autoresizingMask = [.flexibleWidth, .flexibleHeight]
		container.backgroundColor = UIColor(
			hex: currentHex(light: backgroundHex, dark: darkBackgroundHex, window: hostWindow)
		)
		container.isUserInteractionEnabled = false

		let imageView = UIImageView()
		let logoWidth = CGFloat(logoWidthPt)
		let logoHeight = CGFloat(logoHeightPt)
		imageView.frame = CGRect(
			x: (frame.width - logoWidth) / 2,
			y: (frame.height - logoHeight) / 2,
			width: logoWidth,
			height: logoHeight
		)
		imageView.autoresizingMask = [.flexibleLeftMargin, .flexibleRightMargin, .flexibleTopMargin, .flexibleBottomMargin]
		imageView.contentMode = resizeMode.toContentMode()
		imageView.backgroundColor = .clear
		imageView.tintColor = .white
		if let image = SplashImageLoader.loadLogo(targetWidthPt: logoWidthPt, targetHeightPt: logoHeightPt) {
			imageView.image = image.withRenderingMode(.alwaysOriginal)
		}
		container.addSubview(imageView)
		if let brandWidthPt, let brandHeightPt, let brandBottomPt,
			let brandImage = SplashImageLoader.loadBrand(targetWidthPt: brandWidthPt, targetHeightPt: brandHeightPt) {
			let brandWidth = CGFloat(brandWidthPt)
			let brandHeight = CGFloat(brandHeightPt)
			let brand = UIImageView(frame: CGRect(
				x: (frame.width - brandWidth) / 2,
				y: frame.height - CGFloat(brandBottomPt) - brandHeight,
				width: brandWidth,
				height: brandHeight
			))
			brand.autoresizingMask = [.flexibleLeftMargin, .flexibleRightMargin, .flexibleTopMargin]
			brand.contentMode = .scaleAspectFit
			brand.image = brandImage
			container.addSubview(brand)
			brandView = brand
		}
		hostWindow.addSubview(container)
		hostWindow.bringSubviewToFront(container)

		overlayWindow = hostWindow
		containerView = container
		logoView = imageView
		visible = true
		_ = statusBarHidden
	}

	static func updateBackground(hex: String) {
		containerView?.backgroundColor = UIColor(hex: hex)
	}

	static func removeImmediately() {
		containerView?.removeFromSuperview()
		overlayWindow = nil
		containerView = nil
		logoView = nil
		brandView = nil
		visible = false
	}

	private static func plistDouble(_ info: [String: Any]?, key: String) -> Double? {
		if let number = info?[key] as? NSNumber {
			return number.doubleValue
		}
		if let string = info?[key] as? String, let parsed = Double(string) {
			return parsed
		}
		return nil
	}

	private static func resizeMode(from raw: String?) -> SplashResizeMode {
		switch raw {
		case "cover": return .cover
		case "native": return .native
		case "stretch": return .stretch
		default: return .contain
		}
	}

	private static func currentHex(light: String, dark: String?, window: UIWindow) -> String {
		guard let dark else { return light }
		if #available(iOS 13.0, *) {
			return window.traitCollection.userInterfaceStyle == .dark ? dark : light
		}
		return light
	}

	private static func hostWindow(hint: UIWindow?) -> UIWindow? {
		if let hint, hint.bounds.width > 1 {
			return hint
		}
		return findKeyWindow()
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

@_cdecl("nitro_splash_start_observing")
public func nitro_splash_start_observing() {
	SplashOverlayWindow.startObserving()
}

@objc(NitroSplash)
public final class NitroSplash: NSObject {
	@objc public static func attach() {
		if Thread.isMainThread {
			SplashOverlayWindow.startObserving()
		} else {
			DispatchQueue.main.async {
				SplashOverlayWindow.startObserving()
			}
		}
	}
}
