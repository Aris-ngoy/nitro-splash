import { NitroModules } from "react-native-nitro-modules";
import {
	type HideOptions,
	SplashAnimation,
	type SplashOptions,
	type Splashscreen as SplashscreenSpec,
} from "./specs/Splashscreen.nitro";

/**
 * Public API boundary.
 *
 * The Nitro `Splashscreen` HybridObject is the internal implementation detail
 * (see `getRawSplashscreen()` for 1:1 native access). The functions below are
 * the intentionally higher-level public API, mirroring `expo-splash-screen`
 * (`preventAutoHideAsync` / `hideAsync`) so existing apps migrate without
 * learning Nitro semantics. Defaults (fade / 350ms) live here, not natively,
 * so the native overlay stays allocation-free and allocation policy stays in
 * one place.
 */

let cached: SplashscreenSpec | null = null;
let autoHidePrevented = false;

function getNative(): SplashscreenSpec {
	if (cached === null) {
		cached = NitroModules.createHybridObject<SplashscreenSpec>("Splashscreen");
	}
	return cached;
}

/** 1:1 access to the underlying Nitro HybridObject. Prefer the helpers above. */
export function getRawSplashscreen(): SplashscreenSpec {
	return getNative();
}

/** Test seam: reset module cache. Not part of the public contract. */
export function __resetForTests(): void {
	cached = null;
	autoHidePrevented = false;
}

export async function preventAutoHideAsync(): Promise<boolean> {
	if (autoHidePrevented) {
		return false;
	}
	try {
		const prevented = getNative().preventAutoHide();
		autoHidePrevented = true;
		if (prevented) {
			return true;
		}
		return true;
	} catch {
		autoHidePrevented = true;
		return true;
	}
}

export async function hideAsync(options?: HideOptions): Promise<boolean> {
	const normalized: HideOptions = {
		animation: options?.animation ?? SplashAnimation.Fade,
		durationMs: options?.durationMs ?? 350,
	};
	try {
		return await getNative().hide(normalized);
	} catch {
		return false;
	}
}

export function show(options: SplashOptions): void {
	getNative().show(options);
}

export function isVisible(): boolean {
	try {
		return getNative().isVisible();
	} catch {
		return false;
	}
}

export function setBackgroundColor(color: string): void {
	try {
		getNative().setBackgroundColor(color);
	} catch {
		// no-op before native is ready
	}
}

export function updateOptions(_options: Partial<SplashOptions>): void {
	// v1: options are applied at show() time from native resources generated
	// by the CLI/plugin. Use setBackgroundColor() for cheap runtime updates.
}
