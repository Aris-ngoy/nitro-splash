const { withAndroidStyles, withInfoPlist } = require("@expo/config-plugins");

function hexToColor(color) {
	if (!color) return "#FFFFFF";
	return color.startsWith("#") ? color : `#${color}`;
}

/**
 * Expo config plugin: writes Phase A static splash (windowBackground drawable
 * + colors + styles on Android, LaunchScreen storyboard reference on iOS)
 * from the same options the Nitro overlay uses at runtime.
 */
function withNitroSplash(config, options = {}) {
	const background = hexToColor(options.background ?? "#FFFFFF");
	const resizeMode = options.resizeMode ?? "contain";

	config = withAndroidStyles(config, (mod) => {
		const styles = mod.modResults;
		const appTheme = styles?.resources?.style?.find((s) => s.$?.name === "AppTheme");
		if (appTheme) {
			appTheme.item = appTheme.item || [];
			if (!appTheme.item.some((i) => i.$?.name === "android:windowBackground")) {
				appTheme.item.push({ $: { name: "android:windowBackground" }, _: "@drawable/nitrosplash" });
			}
		}
		styles.resources = styles.resources || {};
		styles.resources.color = styles.resources.color || [];
		if (!styles.resources.color.some((c) => c.$?.name === "nitrosplash_background")) {
			styles.resources.color.push({ $: { name: "nitrosplash_background" }, _: background });
		}
		styles.resources.string = styles.resources.string || [];
		if (!styles.resources.string.some((s) => s.$?.name === "nitrosplash_resize_mode")) {
			styles.resources.string.push({ $: { name: "nitrosplash_resize_mode" }, _: resizeMode });
		}
		return mod;
	});

	config = withInfoPlist(config, (mod) => {
		mod.modResults["NitroSplashBackground"] = background;
		mod.modResults["NitroSplashResizeMode"] = resizeMode;
		if (options.statusBarHidden) {
			mod.modResults["UIStatusBarHidden"] = true;
		}
		return mod;
	});

	return config;
}

module.exports = withNitroSplash;
module.exports.default = withNitroSplash;
