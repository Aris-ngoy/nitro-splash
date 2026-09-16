const fs = require("fs");
const path = require("path");
const { withAndroidStyles, withDangerousMod, withInfoPlist } = require("@expo/config-plugins");

function hexToColor(color) {
	if (!color) return "#FFFFFF";
	return color.startsWith("#") ? color : `#${color}`;
}

function hexToStoryboardColor(hex) {
	const h = hexToColor(hex).replace("#", "");
	const full =
		h.length === 3
			? h
					.split("")
					.map((c) => c + c)
					.join("")
			: h;
	const r = parseInt(full.slice(0, 2), 16) / 255;
	const g = parseInt(full.slice(2, 4), 16) / 255;
	const b = parseInt(full.slice(4, 6), 16) / 255;
	return { r, g, b };
}

function writeImageset(imagesetDir, logoAbs) {
	fs.mkdirSync(imagesetDir, { recursive: true });
	const ext = path.extname(logoAbs).toLowerCase() || ".png";
	const destName = `splashscreen_image${ext}`;
	fs.copyFileSync(logoAbs, path.join(imagesetDir, destName));
	fs.writeFileSync(
		path.join(imagesetDir, "Contents.json"),
		JSON.stringify(
			{
				images: [
					{ idiom: "universal", filename: destName, scale: "1x" },
					{ idiom: "universal", filename: destName, scale: "2x" },
					{ idiom: "universal", filename: destName, scale: "3x" },
				],
				info: { version: 1, author: "xcode" },
				properties: { "template-rendering-intent": "original" },
			},
			null,
			2,
		),
	);
}

function patchStoryboard(storyboardPath, background) {
	if (!fs.existsSync(storyboardPath)) return;
	let xml = fs.readFileSync(storyboardPath, "utf8");
	const { r, g, b } = hexToStoryboardColor(background);
	const colorTag = `<color key="backgroundColor" red="${r}" green="${g}" blue="${b}" alpha="1" colorSpace="custom" customColorSpace="sRGB"/>`;
	xml = xml.replace(/<color key="backgroundColor"[^/]*\/>/, colorTag);
	xml = xml.replace(/<color key="backgroundColor"[\s\S]*?<\/color>/, colorTag);
	xml = xml.replace('image="SplashScreenLogo"', 'image="SplashScreen"');
	fs.writeFileSync(storyboardPath, xml);
}

function withIosSplashAssets(config, options) {
	return withDangerousMod(config, [
		"ios",
		async (mod) => {
			const projectRoot = mod.modRequest.projectRoot;
			const iosRoot = mod.modRequest.platformProjectRoot;
			const background = hexToColor(options.background ?? "#FFFFFF");
			const logoRel = options.logo;
			if (logoRel) {
				const logoAbs = path.resolve(projectRoot, logoRel);
				if (fs.existsSync(logoAbs)) {
					const assetsDirs = [];
					for (const entry of fs.readdirSync(iosRoot)) {
						const candidate = path.join(iosRoot, entry, "Images.xcassets");
						if (fs.existsSync(candidate)) assetsDirs.push(candidate);
					}
					for (const assets of assetsDirs) {
						writeImageset(path.join(assets, "SplashScreen.imageset"), logoAbs);
						writeImageset(path.join(assets, "SplashScreenLogo.imageset"), logoAbs);
					}
				}
			}
			for (const entry of fs.readdirSync(iosRoot)) {
				const storyboard = path.join(iosRoot, entry, "SplashScreen.storyboard");
				if (fs.existsSync(storyboard)) {
					patchStoryboard(storyboard, background);
				}
			}
			return mod;
		},
	]);
}

/**
 * Expo config plugin: writes Phase A static splash (windowBackground drawable
 * + colors + styles on Android, LaunchScreen storyboard + asset catalog on iOS)
 * from the same options the Nitro overlay uses at runtime.
 */
function withNitroSplash(config, options = {}) {
	const background = hexToColor(options.background ?? "#FFFFFF");
	const resizeMode = options.resizeMode ?? "contain";
	const logoWidth = options.logoWidth ?? 120;

	config.splash = {
		...(config.splash ?? {}),
		backgroundColor: background,
		resizeMode,
		...(options.logo ? { image: options.logo } : {}),
	};

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
		mod.modResults["NitroSplashLogoWidth"] = String(logoWidth);
		if (options.darkBackground) {
			mod.modResults["NitroSplashDarkBackground"] = hexToColor(options.darkBackground);
		}
		if (options.statusBarHidden) {
			mod.modResults["UIStatusBarHidden"] = true;
		}
		return mod;
	});

	config = withIosSplashAssets(config, options);
	return config;
}

module.exports = withNitroSplash;
module.exports.default = withNitroSplash;
