#!/usr/bin/env node
/**
 * Asset generator.
 * Usage: nitro-splash-generate --logo ./assets/logo.png --background #FFFFFF --logo-width 120 --out ./assets/nitrosplash
 * Optional: --dark-background --brand --brand-width --brand-bottom
 */
const fs = require("fs");
const path = require("path");
const { createManifest } = require("./imageFrame");

function arg(name, fallback) {
	const i = process.argv.indexOf(`--${name}`);
	if (i === -1) return fallback;
	return process.argv[i + 1] ?? fallback;
}

function writeAssets(options) {
	const out = options.out;
	fs.mkdirSync(out, { recursive: true });
	copyIfPresent(options.logo, path.join(out, `logo${path.extname(options.logo) || ".png"}`));
	if (options.brand) {
		copyIfPresent(options.brand, path.join(out, `brand${path.extname(options.brand) || ".png"}`));
	}
	const manifest = createManifest(options);
	fs.writeFileSync(path.join(out, "manifest.json"), JSON.stringify(manifest, null, 2));
	return manifest;
}

function copyIfPresent(from, to) {
	if (from && fs.existsSync(from)) {
		fs.copyFileSync(from, to);
	}
}

function fromArgv() {
	return {
		logo: arg("logo", "./assets/logo.png"),
		background: arg("background", "#FFFFFF"),
		darkBackground: arg("dark-background", undefined),
		logoWidth: Number(arg("logo-width", "120")),
		brand: arg("brand", undefined),
		brandWidth: arg("brand-width", undefined) == null ? undefined : Number(arg("brand-width")),
		brandBottom: arg("brand-bottom", undefined) == null ? undefined : Number(arg("brand-bottom")),
		out: arg("out", "./assets/nitrosplash"),
	};
}

if (require.main === module) {
	const options = fromArgv();
	const manifest = writeAssets(options);
	console.log(`[nitro-splash] manifest written to ${path.join(options.out, "manifest.json")}`);
	console.log(JSON.stringify(manifest));
	console.log("[nitro-splash] Next: point the Expo plugin at the same logo/background.");
}

module.exports = { writeAssets, fromArgv };
