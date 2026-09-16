const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const required = [
	"src/index.ts",
	"src/SplashModule.ts",
	"src/specs/Splashscreen.nitro.ts",
	"nitro.json",
	"ios/HybridSplashscreen.swift",
	"android/src/main/java/com/nitrosplash/HybridSplashscreen.kt",
	"lib/commonjs/index.js",
	"lib/module/index.js",
	"nitrogen/generated/shared/c++/HybridSplashscreenSpec.hpp",
];
let failed = false;
for (const f of required) {
	const p = path.join(root, f);
	if (!fs.existsSync(p)) {
		console.error("missing:", f);
		failed = true;
	}
}
if (failed) process.exit(1);
console.log("[react-native-nitro-splash] smoke ok:", required.length, "files present");
