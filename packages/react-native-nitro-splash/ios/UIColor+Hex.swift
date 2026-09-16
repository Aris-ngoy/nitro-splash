import UIKit

extension UIColor {
  convenience init(hex: String) {
    var h = hex.trimmingCharacters(in: .whitespacesAndNewlines).replacingOccurrences(of: "#", with: "")
    if h.count == 3 {
      h = h.map { "\($0)\($0)" }.joined()
    }
    var rgb: UInt64 = 0
    Scanner(string: h).scanHexInt64(&rgb)
    let r, g, b, a: CGFloat
    if h.count == 8 {
      r = CGFloat((rgb & 0xFF000000) >> 24) / 255
      g = CGFloat((rgb & 0x00FF0000) >> 16) / 255
      b = CGFloat((rgb & 0x0000FF00) >> 8) / 255
      a = CGFloat(rgb & 0x000000FF) / 255
    } else {
      r = CGFloat((rgb & 0xFF0000) >> 16) / 255
      g = CGFloat((rgb & 0x00FF00) >> 8) / 255
      b = CGFloat(rgb & 0x0000FF) / 255
      a = 1
    }
    self.init(red: r, green: g, blue: b, alpha: a)
  }
}
