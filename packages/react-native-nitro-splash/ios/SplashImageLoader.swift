import ImageIO
import UIKit

/// Memory-efficient image loading. Downsamples to the longer edge of the
/// manifest frame so a 2048px asset never lands in memory at full resolution.
/// PNG/JPG/WebP go through ImageIO thumbnailing. SVG/Lottie are pre-rasterized
/// by the CLI into PNGs — runtime vector parsing is intentionally out of the hot path.
enum SplashImageLoader {
  static func loadLogo(targetWidthPt: Double, targetHeightPt: Double) -> UIImage? {
    load(
      names: ["SplashScreen", "SplashScreenLogo", "splashscreen_image", "BootSplashLogo"],
      targetWidthPt: targetWidthPt,
      targetHeightPt: targetHeightPt
    )
  }

  static func loadBrand(targetWidthPt: Double, targetHeightPt: Double) -> UIImage? {
    load(
      names: ["SplashScreenBrand", "splashscreen_brand"],
      targetWidthPt: targetWidthPt,
      targetHeightPt: targetHeightPt
    )
  }

  private static func load(names: [String], targetWidthPt: Double, targetHeightPt: Double) -> UIImage? {
    let targetPx = Int(max(targetWidthPt, targetHeightPt) * UIScreen.main.scale)
    for name in names {
      if let named = UIImage(named: name)?.withRenderingMode(.alwaysOriginal) {
        return named
      }
      if let img = downsampledImage(named: name, targetPx: targetPx) {
        return img
      }
    }
    return nil
  }

  private static func downsampledImage(named: String, targetPx: Int) -> UIImage? {
    guard let url = Bundle.main.url(forResource: named, withExtension: "png")
      ?? Bundle.main.url(forResource: named, withExtension: "jpg")
      ?? Bundle.main.url(forResource: named, withExtension: "webp") else {
      return nil
    }
    let options: CFDictionary = [
      kCGImageSourceShouldCache: false
    ] as CFDictionary
    guard let source = CGImageSourceCreateWithURL(url as CFURL, options) else { return nil }
    let thumbOptions: CFDictionary = [
      kCGImageSourceCreateThumbnailFromImageAlways: true,
      kCGImageSourceShouldCacheImmediately: true,
      kCGImageSourceCreateThumbnailWithTransform: true,
      kCGImageSourceThumbnailMaxPixelSize: targetPx,
    ] as CFDictionary
    guard let cg = CGImageSourceCreateThumbnailAtIndex(source, 0, thumbOptions) else { return nil }
    return UIImage(cgImage: cg, scale: UIScreen.main.scale, orientation: .up).withRenderingMode(.alwaysOriginal)
  }
}
