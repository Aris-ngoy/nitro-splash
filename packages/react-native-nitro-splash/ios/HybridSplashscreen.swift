import Foundation
import NitroModules

/// Nitro entry point. Orchestration only: resolves options, delegates to
/// window/image/animation helpers. No helpers nested here.
public final class HybridSplashscreen: HybridSplashscreenSpec {
	public override init() {
		super.init()
		DispatchQueue.main.async {
			SplashOverlayWindow.startObserving()
		}
	}

	public var memorySize: Int {
		return 1024
	}

	public func show(options: SplashOptions) throws {
		let background = options.backgroundColor
		let darkBackground = options.darkBackgroundColor
		let resizeMode = options.resizeMode
		let logoWidth = options.logoWidth ?? 120.0
		let statusBarHidden = options.statusBarHidden ?? false
		DispatchQueue.main.async {
			SplashOverlayWindow.show(
				backgroundHex: background,
				darkBackgroundHex: darkBackground,
				resizeMode: resizeMode,
				logoWidthPt: logoWidth,
				statusBarHidden: statusBarHidden
			)
		}
	}

	public func hide(options: HideOptions?) throws -> Promise<Bool> {
		// Single main-thread hop at the Nitro entry boundary (UIKit requirement).
		// Manual Promise: UIKit animation APIs are main-thread callbacks, not
		// Swift async/await, so Promise.async/Task would add a needless hop.
	 let promise = Promise<Bool>()
		DispatchQueue.main.async {
			let wasVisible = SplashOverlayWindow.isVisibleAssumingMain()
			guard wasVisible else {
				promise.resolve(withResult: false)
				return
			}
			let animation = options?.animation ?? .fade
			let durationMs = options?.durationMs ?? 350.0
			SplashAnimationRunner.hide(animation: animation, durationMs: durationMs)
			promise.resolve(withResult: true)
		}
		return promise
	}

	public func isVisible() throws -> Bool {
		if Thread.isMainThread {
			return SplashOverlayWindow.isVisibleAssumingMain()
		}
		return DispatchQueue.main.sync {
			SplashOverlayWindow.isVisibleAssumingMain()
		}
	}

	public func preventAutoHide() throws -> Bool {
		SplashOverlayWindow.autoHidePrevented = true
		if Thread.isMainThread {
			SplashOverlayWindow.startObserving()
		} else {
			DispatchQueue.main.async {
				SplashOverlayWindow.startObserving()
			}
		}
		return true
	}

	public func setBackgroundColor(color: String) throws {
		let hex = color
		DispatchQueue.main.async {
			SplashOverlayWindow.updateBackground(hex: hex)
		}
	}
}
