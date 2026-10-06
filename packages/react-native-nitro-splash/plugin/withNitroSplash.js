const fs = require("fs");
const path = require("path");
const { withAndroidStyles, withDangerousMod, withInfoPlist } = require("@expo/config-plugins");
const { createManifest, frameForWidth } = require("../cli/imageFrame");

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

function constraintTag(itemId, attribute, constant, id) {
	return `<constraint firstItem="${itemId}" firstAttribute="${attribute}" constant="${constant}" id="${id}"/>`;
}

function upsertConstraint(xml, itemId, attribute, constant, id) {
	const tag = constraintTag(itemId, attribute, constant, id);
	const pattern = new RegExp(
		`<constraint firstItem="${itemId}" firstAttribute="${attribute}" constant="[^"]*" id="${id}"/>`,
	);
	if (pattern.test(xml)) return xml.replace(pattern, tag);
	return xml.replace(/([ \t]*)<\/constraints>/, `$1    ${tag}\n$1</constraints>`);
}

function patchStoryboard(storyboardPath, background, logo) {
	if (!fs.existsSync(storyboardPath)) return;
	let xml = fs.readFileSync(storyboardPath, "utf8");
	const { r, g, b } = hexToStoryboardColor(background);
	const colorTag = `<color key="backgroundColor" red="${r}" green="${g}" blue="${b}" alpha="1" colorSpace="custom" customColorSpace="sRGB"/>`;
	xml = xml.replace(/<color key="backgroundColor"[^/]*\/>/, colorTag);
	xml = xml.replace(/<color key="backgroundColor"[\s\S]*?<\/color>/, colorTag);
	xml = xml.replace('image="SplashScreenLogo"', 'image="SplashScreen"');
	if (logo) {
		const width = logo.width;
		const height = logo.height;
		xml = xml.replace(
			/(id="EXPO-SplashScreen"[\s\S]*?<rect key="frame"[^>]*?width=")[^"]*(" height=")[^"]*(")/,
			`$1${width}$2${height}$3`,
		);
		xml = upsertConstraint(xml, "EXPO-SplashScreen", "width", width, "nitro-splash-logo-width");
		xml = upsertConstraint(xml, "EXPO-SplashScreen", "height", height, "nitro-splash-logo-height");
		const imageTag = `<image name="SplashScreen" width="${width}" height="${height}"/>`;
		if (/<image name="SplashScreen"/.test(xml)) {
			xml = xml.replace(/<image name="SplashScreen" width="[^"]*" height="[^"]*"\/>/, imageTag);
		} else if (/<image name="SplashScreenLogo"/.test(xml)) {
			xml = xml.replace(/<image name="SplashScreenLogo" width="[^"]*" height="[^"]*"\/>/, imageTag);
		} else {
			xml = xml.replace("</resources>", `        ${imageTag}\n    </resources>`);
		}
	}
	fs.writeFileSync(storyboardPath, xml);
}

function resolveFrame(projectRoot, file, width) {
	if (!file) return null;
	const abs = path.resolve(projectRoot, file);
	if (!fs.existsSync(abs)) return null;
	return { abs, frame: frameForWidth(abs, width) };
}

function upsertNamed(list, name, value) {
	const found = list.find((item) => item.$?.name === name);
	if (found) {
		found._ = String(value);
		return;
	}
	list.push({ $: { name }, _: String(value) });
}

function withIosSplashAssets(config, options) {
	return withDangerousMod(config, [
		"ios",
		async (mod) => {
			const projectRoot = mod.modRequest.projectRoot;
			const iosRoot = mod.modRequest.platformProjectRoot;
			const background = hexToColor(options.background ?? "#FFFFFF");
			const logoWidth = options.logoWidth ?? 120;
			const manifest = createManifest({
				background,
				logo: options.logo ? path.resolve(projectRoot, options.logo) : undefined,
				logoWidth,
			});
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
			const brand = resolveFrame(
				projectRoot,
				options.brand,
				options.brandWidth ?? options.logoWidth ?? 120,
			);
			if (brand) {
				const assetsDirs = [];
				for (const entry of fs.readdirSync(iosRoot)) {
					const candidate = path.join(iosRoot, entry, "Images.xcassets");
					if (fs.existsSync(candidate)) assetsDirs.push(candidate);
				}
				for (const assets of assetsDirs) {
					writeImageset(path.join(assets, "SplashScreenBrand.imageset"), brand.abs);
				}
			}
			for (const entry of fs.readdirSync(iosRoot)) {
				const storyboard = path.join(iosRoot, entry, "SplashScreen.storyboard");
				if (fs.existsSync(storyboard)) {
					patchStoryboard(storyboard, background, manifest.logo);
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

	config.splash = {
		...(config.splash ?? {}),
		backgroundColor: background,
		resizeMode,
		...(options.logo ? { image: options.logo } : {}),
	};

	config = withAndroidStyles(config, (mod) => {
		const styles = mod.modResults;
		const { logo, brand, brandBottom } = pictureFrames(mod.modRequest.projectRoot, options);
		const appTheme = styles?.resources?.style?.find((s) => s.$?.name === "AppTheme");
		if (appTheme) {
			appTheme.item = appTheme.item || [];
			if (!appTheme.item.some((i) => i.$?.name === "android:windowBackground")) {
				appTheme.item.push({ $: { name: "android:windowBackground" }, _: "@drawable/nitrosplash" });
			}
		}
		styles.resources = styles.resources || {};
		styles.resources.color = styles.resources.color || [];
		upsertNamed(styles.resources.color, "nitrosplash_background", background);
		if (options.darkBackground) {
			upsertNamed(
				styles.resources.color,
				"nitrosplash_dark_background",
				hexToColor(options.darkBackground),
			);
		}
		styles.resources.string = styles.resources.string || [];
		upsertNamed(styles.resources.string, "nitrosplash_resize_mode", resizeMode);
		upsertNamed(styles.resources.string, "nitrosplash_logo_width", logo.frame.width);
		upsertNamed(styles.resources.string, "nitrosplash_logo_height", logo.frame.height);
		if (brand) {
			upsertNamed(styles.resources.string, "nitrosplash_brand_width", brand.frame.width);
			upsertNamed(styles.resources.string, "nitrosplash_brand_height", brand.frame.height);
			upsertNamed(styles.resources.string, "nitrosplash_brand_bottom", brandBottom);
		}
		return mod;
	});

	config = withInfoPlist(config, (mod) => {
		const { logo, brand, brandBottom } = pictureFrames(mod.modRequest.projectRoot, options);
		mod.modResults.NitroSplashBackground = background;
		mod.modResults.NitroSplashResizeMode = resizeMode;
		mod.modResults.NitroSplashLogoWidth = String(logo.frame.width);
		mod.modResults.NitroSplashLogoHeight = String(logo.frame.height);
		if (brand) {
			mod.modResults.NitroSplashBrandWidth = String(brand.frame.width);
			mod.modResults.NitroSplashBrandHeight = String(brand.frame.height);
			mod.modResults.NitroSplashBrandBottom = String(brandBottom);
		}
		if (options.darkBackground) {
			mod.modResults.NitroSplashDarkBackground = hexToColor(options.darkBackground);
		}
		if (options.statusBarHidden) {
			mod.modResults.UIStatusBarHidden = true;
		}
		return mod;
	});

	config = withIosSplashAssets(config, options);
	config = withAndroidDrawables(config, options);
	return config;
}

function pictureFrames(projectRoot, options) {
	const logoWidth = options.logoWidth ?? 120;
	const logo = resolveFrame(projectRoot, options.logo, logoWidth);
	const brand = resolveFrame(projectRoot, options.brand, options.brandWidth ?? logoWidth);
	const manifest = createManifest({
		background: options.background,
		logo: logo?.abs,
		logoWidth,
		brand: brand?.abs,
		brandWidth: options.brandWidth,
		brandBottom: options.brandBottom,
	});
	return {
		logo: { abs: logo?.abs ?? null, frame: manifest.logo },
		brand:
			brand && manifest.brand
				? {
						abs: brand.abs,
						frame: { width: manifest.brand.width, height: manifest.brand.height },
					}
				: null,
		brandBottom: manifest.brand?.bottom ?? options.brandBottom ?? 48,
	};
}

function withAndroidDrawables(config, options) {
	return withDangerousMod(config, [
		"android",
		async (mod) => {
			const projectRoot = mod.modRequest.projectRoot;
			const drawable = path.join(
				mod.modRequest.platformProjectRoot,
				"app",
				"src",
				"main",
				"res",
				"drawable",
			);
			if (!fs.existsSync(path.join(mod.modRequest.platformProjectRoot, "app"))) {
				return mod;
			}
			fs.mkdirSync(drawable, { recursive: true });
			const logo = resolveFrame(projectRoot, options.logo, options.logoWidth ?? 120);
			if (logo) {
				const ext = path.extname(logo.abs).toLowerCase() || ".png";
				fs.copyFileSync(logo.abs, path.join(drawable, `splashscreen_image${ext}`));
			}
			const brand = resolveFrame(
				projectRoot,
				options.brand,
				options.brandWidth ?? options.logoWidth ?? 120,
			);
			if (brand) {
				const ext = path.extname(brand.abs).toLowerCase() || ".png";
				fs.copyFileSync(brand.abs, path.join(drawable, `splashscreen_brand${ext}`));
			}
			return mod;
		},
	]);
}

module.exports = withNitroSplash;
module.exports.default = withNitroSplash;
