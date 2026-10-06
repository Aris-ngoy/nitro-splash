import MaskedView from "@react-native-masked-view/masked-view";
import { type ReactNode, useState } from "react";
import { StyleSheet, View } from "react-native";
import { type Manifest, useHandoff } from "react-native-nitro-splash";
import Animated, {
	Easing,
	runOnJS,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";

import manifestJson from "../assets/manifest.json";

const MAX_SCALE = 10;

const manifest: Manifest = manifestJson;

const styles = StyleSheet.create({
	mask: {
		backgroundColor: "black",
		borderRadius: manifest.logo.width,
		width: manifest.logo.width,
		height: manifest.logo.height,
	},
	transparent: {
		backgroundColor: "transparent",
	},
});

type Props = {
	animationEnded: boolean;
	children: ReactNode;
	onAnimationEnd: () => void;
};

export function AnimatedBootSplash({ animationEnded, children, onAnimationEnd }: Props) {
	const [ready, setReady] = useState(false);

	const opacity = useSharedValue(1);
	const scale = useSharedValue(animationEnded ? MAX_SCALE : 1);

	const opacityStyle = useAnimatedStyle(() => ({
		opacity: opacity.value,
	}));

	const scaleStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}));

	const { container, logo, brand } = useHandoff({
		manifest,
		ready,
		logo: require("../assets/logo.png"),
		statusBarTranslucent: true,
		navigationBarTranslucent: false,
		animate: () => {
			opacity.value = withTiming(0, {
				duration: 250,
				easing: Easing.out(Easing.ease),
			});

			scale.value = withTiming(
				MAX_SCALE,
				{
					duration: 350,
					easing: Easing.back(0.75),
				},
				() => {
					runOnJS(onAnimationEnd)();
				},
			);
		},
	});

	return (
		<>
			{!animationEnded && <View style={container.style} />}

			<MaskedView
				style={StyleSheet.absoluteFill}
				maskElement={
					<View style={[container.style, styles.transparent]}>
						<Animated.View
							style={[styles.mask, scaleStyle]}
							onLayout={() => {
								setReady(true);
							}}
						/>
					</View>
				}
			>
				{children}
			</MaskedView>

			{!animationEnded && (
				<View {...container} style={[container.style, styles.transparent]}>
					<Animated.Image {...logo} style={[logo.style, opacityStyle, scaleStyle]} />
					{manifest.brand != null && (
						<Animated.Image {...brand} style={[brand.style, opacityStyle]} />
					)}
				</View>
			)}
		</>
	);
}
