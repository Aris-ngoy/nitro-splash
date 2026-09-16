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
export type { HideOptions, SplashOptions, Splashscreen } from "./specs/Splashscreen.nitro";
export { SplashAnimation, SplashResizeMode } from "./specs/Splashscreen.nitro";
export { useSplashReady } from "./useSplashReady";
