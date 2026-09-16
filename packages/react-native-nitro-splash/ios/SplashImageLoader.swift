import ImageIO
import UIKit

/// Memory-efficient logo loading. Downsamples to target point size so a
/// 2048px asset never lands in memory at full resolution during splash.
/// PNG/JPG/WebP go through ImageIO thumbnailing. SVG/Lottie are pre-rasterized
/// by the CLI into PNGs (splashscreen_image) — runtime vector parsing is
/// intentionally out of the hot path.
enum SplashImageLoader {
  static func loadLogo(targetWidthPt: Double) -> UIImage? {
    let scale = UIScreen.main.scale
    let targetPx = Int(targetWidthPt * scale)
    let names = ["splashscreen_image", "SplashScreen", "BootSplashLogo"]
    for name in names {
      if let img = downsampledImage(named: name, targetPx: targetPx) {
        return img
      }
    }
    return nullImage(targetPx: targetPx)
  }

  private static func downsampledImage(named: String, targetPx: Int) -> UIImage? {
    guard let url = Bundle.main.url(forResource: named, withExtension: "png")
      ?? Bundle.main.url(forResource: named, withExtension: "jpg")
      ?? Bundle.main.url(forResource: named, withExtension: "webp") else {
      if let asset = UIImage(named: named) {
        return asset
      }
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
    return UIImage(cgImage: cg, scale: UIScreen.main.scale, orientation: .up)
  }

  private static func nullImage(targetPx _: Int) -> UIImage? {
    return nil
  }
}
