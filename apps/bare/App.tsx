import { useState } from "react";
import { StatusBar, StyleSheet, Text, View } from "react-native";
import { preventAutoHideAsync } from "react-native-nitro-splash";
import { AnimatedBootSplash } from "./components/AnimatedBootSplash";

preventAutoHideAsync().catch(() => undefined);

export default function App() {
	const [splashVisible, setSplashVisible] = useState(true);

	return (
		<View style={styles.root}>
			<StatusBar barStyle={splashVisible ? "light-content" : "dark-content"} />
			<AnimatedBootSplash
				animationEnded={!splashVisible}
				onAnimationEnd={() => {
					setSplashVisible(false);
				}}
			>
				<View style={styles.content}>
					<Text style={styles.title}>nitro-splash bare</Text>
					<Text style={styles.subtitle}>The app was under the splash the whole time.</Text>
				</View>
			</AnimatedBootSplash>
		</View>
	);
}

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	content: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#FFFFFF",
		padding: 24,
	},
	title: {
		fontSize: 28,
		fontWeight: "700",
		color: "#0B1220",
	},
	subtitle: {
		marginTop: 8,
		fontSize: 16,
		color: "#334155",
		textAlign: "center",
	},
});
