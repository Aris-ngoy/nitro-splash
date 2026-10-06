import { describe, expect, mock, test } from "bun:test";
import { createElement } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import type { Manifest, UseHandoffConfig } from "../src/useHandoff";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const calls: { name: string; args: unknown[] }[] = [];
const metrics = { darkMode: false, statusBarHeight: 47, navigationBarHeight: 24 };
const platform = { OS: "ios" };
let hideImpl = (options: unknown): Promise<boolean> => {
	calls.push({ name: "hide", args: [options] });
	return Promise.resolve(true);
};

mock.module("react-native", () => ({
	Platform: platform,
}));

mock.module("react-native-nitro-modules", () => ({
	NitroModules: {
		createHybridObject: () => ({
			show: () => undefined,
			hide: (options: unknown) => hideImpl(options),
			isVisible: () => true,
			preventAutoHide: () => true,
			setBackgroundColor: () => undefined,
			handoffMetrics: () => ({ ...metrics }),
		}),
	},
}));

const { __resetForTests } = await import("../src/SplashModule");
const { SplashAnimation } = await import("../src/specs/Splashscreen.nitro");
const { useHandoff } = await import("../src/useHandoff");

const manifest: Manifest = {
	background: "#112233",
	logo: { width: 100, height: 80 },
};

function mount(initial: UseHandoffConfig) {
	const box = { config: initial };
	const api = { current: null as ReturnType<typeof useHandoff> | null };
	function Host() {
		api.current = useHandoff(box.config);
		return null;
	}
	let renderer!: ReactTestRenderer;
	act(() => {
		renderer = create(createElement(Host));
	});
	return {
		api,
		update(next: UseHandoffConfig) {
			box.config = next;
			act(() => {
				renderer.update(createElement(Host));
			});
		},
	};
}

describe("useHandoff", () => {
	test("removes the overlay with no animation only after the replica lays out and the logo loads", async () => {
		__resetForTests();
		calls.length = 0;
		platform.OS = "ios";
		metrics.darkMode = false;
		let animated = 0;
		const { api } = mount({
			manifest,
			logo: 1,
			animate: () => {
				animated += 1;
			},
		});

		expect(animated).toBe(0);
		expect(calls).toHaveLength(0);

		await act(async () => {
			api.current?.container.onLayout();
		});
		expect(animated).toBe(0);
		expect(calls).toHaveLength(0);

		await act(async () => {
			api.current?.logo.onLoadEnd?.();
		});
		expect(animated).toBe(1);
		expect(calls).toEqual([
			{
				name: "hide",
				args: [{ animation: SplashAnimation.None, durationMs: 0 }],
			},
		]);
	});

	test("holds the handoff until the app is ready", async () => {
		__resetForTests();
		calls.length = 0;
		let animated = 0;
		const { api, update } = mount({
			manifest,
			ready: false,
			logo: 1,
			animate: () => {
				animated += 1;
			},
		});

		await act(async () => {
			api.current?.container.onLayout();
			api.current?.logo.onLoadEnd?.();
		});
		expect(animated).toBe(0);

		update({
			manifest,
			ready: true,
			logo: 1,
			animate: () => {
				animated += 1;
			},
		});
		await act(async () => undefined);
		expect(animated).toBe(1);
	});

	test("waits for the brand when the manifest includes one", async () => {
		__resetForTests();
		calls.length = 0;
		let animated = 0;
		const branded: Manifest = {
			...manifest,
			brand: { bottom: 48, width: 90, height: 30 },
		};
		const { api } = mount({
			manifest: branded,
			logo: 1,
			brand: 2,
			animate: () => {
				animated += 1;
			},
		});

		await act(async () => {
			api.current?.container.onLayout();
			api.current?.logo.onLoadEnd?.();
		});
		expect(animated).toBe(0);

		await act(async () => {
			api.current?.brand.onLoadEnd?.();
		});
		expect(animated).toBe(1);
	});

	test("runs the handoff once", async () => {
		__resetForTests();
		calls.length = 0;
		let animated = 0;
		const { api } = mount({
			manifest,
			logo: 1,
			animate: () => {
				animated += 1;
			},
		});

		await act(async () => {
			api.current?.container.onLayout();
			api.current?.logo.onLoadEnd?.();
			api.current?.logo.onLoadEnd?.();
		});
		expect(animated).toBe(1);
		expect(calls).toHaveLength(1);
	});

	test("starts the app animation only after the overlay is gone", async () => {
		__resetForTests();
		calls.length = 0;
		let releaseHide: (value: boolean) => void = () => undefined;
		hideImpl = (options: unknown) => {
			calls.push({ name: "hide", args: [options] });
			return new Promise((resolve) => {
				releaseHide = resolve;
			});
		};
		let animated = 0;
		const { api } = mount({
			manifest,
			logo: 1,
			animate: () => {
				animated += 1;
			},
		});

		await act(async () => {
			api.current?.container.onLayout();
			api.current?.logo.onLoadEnd?.();
		});
		expect(calls).toHaveLength(1);
		expect(animated).toBe(0);

		await act(async () => {
			releaseHide(true);
		});
		expect(animated).toBe(1);
		hideImpl = (options: unknown) => {
			calls.push({ name: "hide", args: [options] });
			return Promise.resolve(true);
		};
	});

	test("places the logo on the manifest frame", () => {
		__resetForTests();
		const { api } = mount({
			manifest,
			logo: 7,
			animate: () => undefined,
		});
		expect(api.current?.logo).toMatchObject({
			source: 7,
			fadeDuration: 0,
			resizeMode: "contain",
			style: { width: 100, height: 80 },
		});
	});

	test("uses the dark background when the overlay is in dark mode", () => {
		__resetForTests();
		metrics.darkMode = true;
		const { api } = mount({
			manifest: { ...manifest, darkBackground: "#010203" },
			logo: 1,
			animate: () => undefined,
		});
		expect(api.current?.container.style.backgroundColor).toBe("#010203");
		metrics.darkMode = false;
	});

	test("grows the replica past an Android system bar that is not translucent", () => {
		__resetForTests();
		platform.OS = "android";
		const { api } = mount({
			manifest,
			logo: 1,
			statusBarTranslucent: true,
			navigationBarTranslucent: false,
			animate: () => undefined,
		});
		expect(api.current?.container.style.marginTop).toBeUndefined();
		expect(api.current?.container.style.marginBottom).toBe(-24);
		platform.OS = "ios";
	});
});
