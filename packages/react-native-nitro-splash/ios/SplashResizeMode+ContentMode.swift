import UIKit

extension SplashResizeMode {
  func toContentMode() -> UIView.ContentMode {
    switch self {
    case .contain: return .scaleAspectFit
    case .cover: return .scaleAspectFill
    case .stretch: return .scaleToFill
    case .native: return .center
    }
  }
}
