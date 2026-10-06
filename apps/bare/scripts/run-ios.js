/**
 * Xcode 27 moved the simulator UI to DeviceHub and no longer ships
 * Developer/Applications/Simulator.app. The React Native CLI opens that
 * path and exits before building. When the classic app is present, this
 * delegates to the CLI. Otherwise it builds with xcodebuild and launches
 * through simctl, passing RCT_METRO_PORT into the app.
 */
const { execFileSync, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const iosDir = path.join(root, "ios");
const scheme = "NitroSplashBare";
const workspace = "NitroSplashBare.xcworkspace";

function flag(name) {
	const index = process.argv.indexOf(name);
	if (index === -1) return undefined;
	return process.argv[index + 1];
}

function developerDir() {
	return execFileSync("xcode-select", ["-p"], { encoding: "utf8" }).trim();
}

function bootedUdid() {
	const listed = execFileSync("xcrun", ["simctl", "list", "devices", "booted"], {
		encoding: "utf8",
	});
	const match = listed.match(/\(([0-9A-F-]{36})\) \(Booted\)/);
	if (!match) {
		throw new Error("No booted simulator. Open DeviceHub, boot a device, and rerun.");
	}
	return match[1];
}

async function projectPort() {
	const explicit = flag("--port");
	if (explicit) return explicit;
	for (const port of [8081, 8082, 8083, 8084]) {
		try {
			const response = await fetch(`http://127.0.0.1:${port}/status`);
			const body = await response.text();
			const projectRoot = response.headers.get("x-react-native-project-root");
			if (body.includes("packager-status:running") && projectRoot === root) {
				return String(port);
			}
		} catch {
			// This port is not a packager.
		}
	}
	return process.env.RCT_METRO_PORT || "8081";
}

function buildSetting(settings, name) {
	const match = settings.match(new RegExp(`^\\s*${name} = (.*)$`, "m"));
	if (!match) {
		throw new Error(`xcodebuild did not report ${name}`);
	}
	return match[1].trim();
}

function runCli() {
	const cli = path.join(root, "node_modules", ".bin", "react-native");
	const result = spawnSync(cli, ["run-ios", ...process.argv.slice(2)], {
		cwd: root,
		stdio: "inherit",
	});
	process.exit(result.status ?? 1);
}

async function main() {
	const simulatorApp = path.join(developerDir(), "Applications", "Simulator.app");
	if (fs.existsSync(simulatorApp)) {
		runCli();
		return;
	}

	const udid = flag("--udid") || flag("--device") || bootedUdid();
	const port = await projectPort();
	const deviceHub = path.join(developerDir(), "..", "Applications", "DeviceHub.app");
	if (fs.existsSync(deviceHub)) {
		spawnSync("open", [deviceHub], { stdio: "inherit" });
	}

	console.log(`Building ${scheme} for ${udid} (Metro on port ${port})`);
	const build = spawnSync(
		"xcodebuild",
		[
			"-workspace",
			workspace,
			"-scheme",
			scheme,
			"-configuration",
			"Debug",
			"-destination",
			`id=${udid}`,
			"-quiet",
			"build",
		],
		{ cwd: iosDir, stdio: "inherit", env: { ...process.env, RCT_METRO_PORT: port } },
	);
	if (build.status !== 0) {
		process.exit(build.status ?? 1);
	}

	const settings = execFileSync(
		"xcodebuild",
		[
			"-workspace",
			workspace,
			"-scheme",
			scheme,
			"-configuration",
			"Debug",
			"-destination",
			`id=${udid}`,
			"-showBuildSettings",
		],
		{ cwd: iosDir, encoding: "utf8" },
	);
	const appPath = path.join(
		buildSetting(settings, "TARGET_BUILD_DIR"),
		buildSetting(settings, "FULL_PRODUCT_NAME"),
	);
	const bundleId = buildSetting(settings, "PRODUCT_BUNDLE_IDENTIFIER");

	execFileSync("xcrun", ["simctl", "install", udid, appPath], { stdio: "inherit" });
	spawnSync("xcrun", ["simctl", "terminate", udid, bundleId], { stdio: "ignore" });
	execFileSync("xcrun", ["simctl", "launch", udid, bundleId], {
		stdio: "inherit",
		env: { ...process.env, SIMCTL_CHILD_RCT_METRO_PORT: port },
	});
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
});
