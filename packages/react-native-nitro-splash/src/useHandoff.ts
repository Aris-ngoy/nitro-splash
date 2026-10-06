import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type ImageSourcePropType, type ImageStyle, Platform, type ViewStyle } from "react-native";
import { getRawSplashscreen, hideAsync } from "./SplashModule";
import { type HandoffMetrics, SplashAnimation } from "./specs/Splashscreen.nitro";

export type Manifest = {
	background: string;
	darkBackground?: string;
	logo: { width: number; height: number };
	brand?: { bottom: number; width: number; height: number };
};

export type UseHandoffConfig = {
	manifest: Manifest;
	ready?: boolean;
	logo?: ImageSourcePropType;
	brand?: ImageSourcePropType;
	animate: () => void;
	statusBarTranslucent?: boolean;
	navigationBarTranslucent?: boolean;
};

export type ReplicaContainerProps = {
	style: ViewStyle;
	onLayout: () => void;
};

export type ReplicaImageProps = {
	source: ImageSourcePropType;
	fadeDuration?: number;
	resizeMode?: "contain";
	style?: ImageStyle;
	onLoadEnd?: () => void;
};

type Gate = {
	layoutReady: boolean;
	logoReady: boolean;
	brandReady: boolean;
	userReady: boolean;
	animate: () => void;
	started: boolean;
};

export function useHandoff(config: UseHandoffConfig): {
	container: ReplicaContainerProps;
	logo: ReplicaImageProps;
	brand: ReplicaImageProps;
} {
	const {
		manifest,
		ready = true,
		logo: logoSource,
		brand: brandSource,
		animate,
		statusBarTranslucent = false,
		navigationBarTranslucent = false,
	} = config;

	const skipLogo = logoSource == null;
	const skipBrand = manifest.brand == null || brandSource == null;

	const gate = useRef<Gate>({
		layoutReady: false,
		logoReady: skipLogo,
		brandReady: skipBrand,
		userReady: ready,
		animate,
		started: false,
	});

	const [metrics, setMetrics] = useState(readMetrics);
	const refresh = useCallback(() => {
		setMetrics(readMetrics());
	}, []);

	const handoff = useCallback(() => {
		const current = gate.current;
		if (
			!current.layoutReady ||
			!current.logoReady ||
			!current.brandReady ||
			!current.userReady ||
			current.started
		) {
			return;
		}
		current.started = true;
		hideAsync({ animation: SplashAnimation.None, durationMs: 0 })
			.then(() => {
				current.animate();
			})
			.catch(() => undefined);
	}, []);

	useEffect(() => {
		gate.current.animate = animate;
		gate.current.userReady = ready;
		handoff();
	});

	return useMemo(() => {
		const backgroundColor =
			metrics.darkMode && manifest.darkBackground != null
				? manifest.darkBackground
				: manifest.background;

		const containerStyle: ViewStyle = {
			alignItems: "center",
			backgroundColor,
			justifyContent: "center",
			position: "absolute",
			left: 0,
			right: 0,
			top: 0,
			bottom: 0,
		};

		if (Platform.OS === "android") {
			if (!statusBarTranslucent) {
				containerStyle.marginTop = -metrics.statusBarHeight;
			}
			if (!navigationBarTranslucent) {
				containerStyle.marginBottom = -metrics.navigationBarHeight;
			}
		}

		const logo: ReplicaImageProps =
			logoSource == null
				? { source: -1 }
				: {
						source: logoSource,
						fadeDuration: 0,
						resizeMode: "contain",
						style: {
							width: manifest.logo.width,
							height: manifest.logo.height,
						},
						onLoadEnd: () => {
							gate.current.logoReady = true;
							refresh();
						},
					};

		const brandFrame = manifest.brand;
		const brand: ReplicaImageProps =
			brandSource == null || brandFrame == null
				? { source: -1 }
				: {
						source: brandSource,
						fadeDuration: 0,
						resizeMode: "contain",
						style: {
							position: "absolute",
							bottom: brandFrame.bottom,
							width: brandFrame.width,
							height: brandFrame.height,
						},
						onLoadEnd: () => {
							gate.current.brandReady = true;
							refresh();
						},
					};

		return {
			container: {
				style: containerStyle,
				onLayout: () => {
					gate.current.layoutReady = true;
					refresh();
				},
			},
			logo,
			brand,
		};
	}, [
		refresh,
		metrics,
		manifest,
		logoSource,
		brandSource,
		statusBarTranslucent,
		navigationBarTranslucent,
	]);
}

function readMetrics(): HandoffMetrics {
	try {
		return getRawSplashscreen().handoffMetrics();
	} catch {
		return { darkMode: false, statusBarHeight: 0, navigationBarHeight: 0 };
	}
}
