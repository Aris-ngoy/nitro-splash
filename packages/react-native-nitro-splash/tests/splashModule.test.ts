import { describe, expect, mock, test } from "bun:test";

const calls: { name: string; args: unknown[] }[] = [];
let nativeState = { visible: true, preventAutoHideResult: true, hideResult: true };

mock.module("react-native-nitro-modules", () => ({
	NitroModules: {
		createHybridObject: () => ({
			show: (options: unknown) => {
				calls.push({ name: "show", args: [options] });
			},
			hide: (options: unknown) => {
				calls.push({ name: "hide", args: [options] });
				const wasVisible = nativeState.visible;
				nativeState.visible = false;
				return Promise.resolve(wasVisible ? nativeState.hideResult : false);
			},
			isVisible: () => {
				calls.push({ name: "isVisible", args: [] });
				return nativeState.visible;
			},
			preventAutoHide: () => {
				calls.push({ name: "preventAutoHide", args: [] });
				return nativeState.preventAutoHideResult;
			},
			setBackgroundColor: (color: unknown) => {
				calls.push({ name: "setBackgroundColor", args: [color] });
			},
		}),
	},
}));

const { __resetForTests, hideAsync, isVisible, preventAutoHideAsync, show } = await import(
	"../src/SplashModule"
);
const { SplashAnimation, SplashResizeMode } = await import("../src/specs/Splashscreen.nitro");

describe("SplashModule (Expo-compat wrapper)", () => {
	test("preventAutoHideAsync resolves true once, false on repeat", async () => {
		__resetForTests();
		calls.length = 0;
		nativeState = { visible: true, preventAutoHideResult: true, hideResult: true };
		expect(await preventAutoHideAsync()).toBe(true);
		expect(await preventAutoHideAsync()).toBe(false);
		expect(calls.filter((c) => c.name === "preventAutoHide")).toHaveLength(1);
	});

	test("hideAsync injects fade/350 defaults", async () => {
		__resetForTests();
		calls.length = 0;
		nativeState = { visible: true, preventAutoHideResult: true, hideResult: true };
		expect(await hideAsync()).toBe(true);
		expect(calls[0]).toEqual({
			name: "hide",
			args: [{ animation: SplashAnimation.Fade, durationMs: 350 }],
		});
	});

	test("hideAsync passes explicit animation through", async () => {
		__resetForTests();
		calls.length = 0;
		nativeState = { visible: true, preventAutoHideResult: true, hideResult: true };
		await hideAsync({ animation: SplashAnimation.Scale, durationMs: 500 });
		expect(calls[0]).toEqual({
			name: "hide",
			args: [{ animation: SplashAnimation.Scale, durationMs: 500 }],
		});
	});

	test("second hide resolves false (already hidden)", async () => {
		__resetForTests();
		calls.length = 0;
		nativeState = { visible: true, preventAutoHideResult: true, hideResult: true };
		expect(await hideAsync()).toBe(true);
		expect(await hideAsync()).toBe(false);
	});

	test("show forwards full SplashOptions to native", () => {
		__resetForTests();
		calls.length = 0;
		show({
			backgroundColor: "#FFFFFF",
			resizeMode: SplashResizeMode.Contain,
			logoWidth: 120,
		});
		expect(calls[0]?.name).toBe("show");
	});

	test("isVisible reflects native state", () => {
		__resetForTests();
		nativeState.visible = false;
		expect(isVisible()).toBe(false);
	});
});
