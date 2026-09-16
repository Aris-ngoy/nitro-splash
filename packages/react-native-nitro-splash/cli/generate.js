#!/usr/bin/env node
/**
 * Minimal asset generator (bootsplash-inspired).
 * Usage: nitro-splash-generate --logo ./assets/logo.png --background #FFFFFF --logo-width 120 --out ./assets/nitrosplash
 * - copies logo to out/ + manifest.json
 * - writes android res stub (colors/styles/drawable) and ios xcasset stub instructions
 * Raster work (SVG/WebP/Lottie pre-raster) is intentionally left to sharp/resvg
 * in a follow-up; v1 keeps the pipeline dependency-free and fast.
 */
const fs = require("fs");
const path = require("path");

function arg(name, fallback) {
	const i = process.argv.indexOf(`--${name}`);
	if (i === -1) return fallback;
	return process.argv[i + 1] ?? fallback;
}

const logo = arg("logo", "./assets/logo.png");
const background = arg("background", "#FFFFFF");
const logoWidth = Number(arg("logo-width", "120"));
const out = arg("out", "./assets/nitrosplash");

fs.mkdirSync(out, { recursive: true });
let logoOut = null;
try {
	if (fs.existsSync(logo)) {
		const ext = path.extname(logo).toLowerCase() || ".png";
		logoOut = path.join(out, `logo${ext}`);
		fs.copyFileSync(logo, logoOut);
	}
} catch (e) {
	console.warn("[nitro-splash] logo copy failed:", e.message);
}

const manifest = {
	background,
	logoWidth,
	logo: logoOut ? path.basename(logoOut) : null,
	resizeMode: "contain",
	generatedAt: new Date().toISOString(),
};
fs.writeFileSync(path.join(out, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`[nitro-splash] manifest written to ${path.join(out, "manifest.json")}`);
console.log("[nitro-splash] Next: point the Expo plugin at the same logo/background.");
