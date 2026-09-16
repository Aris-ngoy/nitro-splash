# nitro-splash

Turborepo for `react-native-nitro-splash` — fast, memory-efficient splash with native exit animations, powered by Nitro Modules.

- `packages/react-native-nitro-splash` — Nitro HybridObject (`Splashscreen`), JS API (`preventAutoHideAsync` / `hideAsync`), Expo plugin, CLI
- `apps/example` — Expo testbed

## Quick start

```bash
pnpm install
pnpm --filter react-native-nitro-splash codegen
pnpm --filter example start
```

## JS usage

```ts
import { preventAutoHideAsync, hideAsync, SplashAnimation } from 'react-native-nitro-splash';

preventAutoHideAsync();

// later, after fonts/data are ready:
await hideAsync({ animation: SplashAnimation.Fade, durationMs: 350 });
```

Inspired by `expo-splash-screen` (auto-hide contract) and `react-native-bootsplash` (overlay + asset pipeline), but native-driven via Nitro for lower overhead and downsampled decode.
