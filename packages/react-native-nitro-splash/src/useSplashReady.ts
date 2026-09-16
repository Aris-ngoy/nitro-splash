import { useEffect, useRef, useState } from "react";
import { hideAsync, preventAutoHideAsync } from "./SplashModule";
import { SplashAnimation } from "./specs/Splashscreen.nitro";

/**
 * Minimal bootsplash-style helper: prevent autohide on mount, expose a
 * done() that hides with an exit animation. The native overlay stays until
 * hideAsync resolves, so JS-choreographed exits don't flash.
 */
export function useSplashReady() {
	const [ready, setReady] = useState(false);
	const hidden = useRef(false);

	useEffect(() => {
		preventAutoHideAsync().catch(() => undefined);
		setReady(true);
	}, []);

	async function done(animation: SplashAnimation = SplashAnimation.Fade): Promise<void> {
		if (hidden.current) {
			return;
		}
		hidden.current = true;
		await hideAsync({ animation, durationMs: 350 });
	}

	return { ready, done };
}
