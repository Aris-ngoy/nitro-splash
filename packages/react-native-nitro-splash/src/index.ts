export type { NitroSplashPluginOptions } from "./config";
export {
	getRawSplashscreen,
	hideAsync,
	isVisible,
	preventAutoHideAsync,
	setBackgroundColor,
	show,
	updateOptions,
} from "./SplashModule";
export type {
	HandoffMetrics,
	HideOptions,
	SplashOptions,
	Splashscreen,
} from "./specs/Splashscreen.nitro";
export { SplashAnimation, SplashResizeMode } from "./specs/Splashscreen.nitro";
export type { Manifest, UseHandoffConfig } from "./useHandoff";
export { useHandoff } from "./useHandoff";
export { useSplashReady } from "./useSplashReady";
