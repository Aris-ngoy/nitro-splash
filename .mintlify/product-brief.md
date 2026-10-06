# Product brief

## Description

nitro-splash covers a React Native app's first frame, then gets out of the way. The operating system launch screen, the native overlay, and the JavaScript replica share one manifest picture. After that handoff, the app runs its own animation.

## Primary audience

React Native developers shipping an Expo app or a bare React Native app. They arrive wanting a splash that does not flash white and does not jump when the real UI appears. Assumption: most readers start from the Expo plugin, and a smaller group sets up the native project by hand.

## Jobs to be done

- Install the library and show a launch screen from a logo and a background color.
- Keep that splash up until the app is ready, then hide it.
- Hand off to a JavaScript view and run an exit animation, including the circular reveal used by the React Conf app.

## Motivation

The library takes the Expo splash plugin (no manual Xcode or Gradle edits for the common path, `preventAutoHideAsync` / `hideAsync`) and bootsplash's single picture (launch screen, overlay, and replica match). Brand color, dark background, and the logo frame are free. There is no license key. A separate dark logo is out of scope; only the background changes in dark mode.
