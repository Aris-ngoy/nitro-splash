import { registerRootComponent } from "expo";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { hideAsync, preventAutoHideAsync, SplashAnimation } from "react-native-nitro-splash";

preventAutoHideAsync().catch(() => undefined);

export default function App() {
	useEffect(() => {
		async function prepare() {
			await new Promise<void>((resolve) => setTimeout(resolve, 2000));
			await hideAsync({ animation: SplashAnimation.Fade, durationMs: 350 });
		}
		prepare().catch(() => undefined);
	}, []);

	return (
		<View style={styles.container}>
			<Text>nitro-splash example ready</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, alignItems: "center", justifyContent: "center" },
});

registerRootComponent(App);
