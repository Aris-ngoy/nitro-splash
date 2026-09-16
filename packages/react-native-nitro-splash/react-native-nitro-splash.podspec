Pod::Spec.new do |s|
  s.name         = "react-native-nitro-splash"
  s.version      = "0.1.0"
  s.summary      = "Fast Nitro splash screen with exit animations"
  s.homepage     = "https://github.com/example/nitro-splash"
  s.license      = "MIT"
  s.authors      = { "nitro-splash" => "hello@example.com" }
  s.platforms    = { :ios => "15.1" }
  s.source       = { :git => "https://github.com/example/nitro-splash.git", :tag => s.version.to_s }

  s.source_files = "ios/**/*.{swift,h,m,mm,cpp,hpp}", "cpp/**/*.{hpp,cpp}", "nitrogen/generated/ios/**/*.{swift,h,m,mm,cpp,hpp}"
  s.pod_target_xcconfig = {
    "CLANG_CXX_LANGUAGE_STANDARD" => "c++20",
    "SWIFT_VERSION" => "5.9"
  }

  s.dependency "React-Core"
  s.dependency "react-native-nitro-modules"
end
