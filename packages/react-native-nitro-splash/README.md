# react-native-nitro-splash

Fast, memory-efficient splash screen with exit animations for React Native + Expo, powered by Nitro Modules.

Supports PNG, JPG, WebP, SVG (pre-rasterized by CLI), and Lottie (optional peer).

## Install

```bash
npx expo install react-native-nitro-splash react-native-nitro-modules
# optional animated vector:
npx expo install lottie-react-native
```

## Expo plugin (`app.json`)

```json
{
  "expo": {
    "plugins": [
      ["react-native-nitro-splash", { "background": "#FFFFFF", "logo": "./assets/logo.png", "logoWidth": 120 }]
    ]
  }
}
```

## Usage

```ts
import { preventAutoHideAsync, hideAsync, SplashAnimation } from 'react-native-nitro-splash';

preventAutoHideAsync();

// after ready:
await hideAsync({ animation: SplashAnimation.Fade, durationMs: 350 });
```

Animations: `None | Fade | SlideUp | SlideDown | Scale | FadeSlide`.

## How it beats the inspirations

- Two-phase like bootsplash/expo: OS drawable/storyboard first (no white flash), Nitro overlay second for animation.
- Downsampled decode (`CGImageSource thumbnail` / `BitmapFactory inSampleSize`), no base64 over bridge, bitmap recycled on hide.
- Lottie via reflection/optional peer so core stays small.
- Native-driven exit (`UIView.animate` / `ViewPropertyAnimator`), no JS jank.

## CLI

```bash
node node_modules/react-native-nitro-splash/cli/generate.js --logo ./assets/logo.png --background "#FFFFFF" --logo-width 120 --out ./assets/nitrosplash
```
