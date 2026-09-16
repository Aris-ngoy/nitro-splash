cmake_minimum_required(VERSION 3.9.0)
project(Nitrosplash)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_library(Nitrosplash STATIC
  ../cpp/HybridSplashscreen.cpp
)

target_include_directories(Nitrosplash PUBLIC
  ../cpp
)

find_package(fbjni REQUIRED CONFIG)
find_package(react-native-nitro-modules REQUIRED CONFIG)

target_link_libraries(Nitrosplash
  fbjni::fbjni
  react-native-nitro-modules::react-native-nitro-modules
  android
)
