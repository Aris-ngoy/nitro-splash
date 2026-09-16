import type { HybridObject } from "react-native-nitro-modules";

export enum SplashResizeMode {
	Contain = 0,
	Cover = 1,
	Native = 2,
	Stretch = 3,
}

export enum SplashAnimation {
	None = 0,
	Fade = 1,
	SlideUp = 2,
	SlideDown = 3,
	Scale = 4,
	FadeSlide = 5,
}

export interface SplashOptions {
	backgroundColor: string;
	resizeMode: SplashResizeMode;
	logoWidth?: number;
	darkBackgroundColor?: string;
	statusBarHidden?: boolean;
}

export interface HideOptions {
	animation?: SplashAnimation;
	durationMs?: number;
}

/**
 * Nitro HybridObject for the splash overlay.
 *
 * Phase A (cold start) is the OS drawable / storyboard written by the CLI/plugin.
 * Phase B is this overlay: created natively before JS loads, hidden with a
 * native-driven exit animation so there is no white flash and no JS jank.
 *
 * Memory rules enforced natively:
 * - decode at target size (logoWidth * screen scale), not full resolution
 * - never round-trip base64 over the bridge
 * - release drawable / composition on hide()
 */
export interface Splashscreen extends HybridObject<{ ios: "swift"; android: "kotlin" }> {
	show(options: SplashOptions): void;
	hide(options?: HideOptions): Promise<boolean>;
	isVisible(): boolean;
	preventAutoHide(): boolean;
	setBackgroundColor(color: string): void;
}
