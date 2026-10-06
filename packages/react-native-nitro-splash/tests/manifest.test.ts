import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { createManifest } from "../cli/imageFrame";

function png(width: number, height: number): Buffer {
	const buf = Buffer.alloc(24);
	buf[0] = 0x89;
	buf[1] = 0x50;
	buf[2] = 0x4e;
	buf[3] = 0x47;
	buf.writeUInt32BE(width, 16);
	buf.writeUInt32BE(height, 20);
	return buf;
}

describe("manifest", () => {
	test("records the logo frame and an optional brand frame", () => {
		const dir = mkdtempSync(join(tmpdir(), "nitrosplash-"));
		try {
			const logo = join(dir, "logo.png");
			const brand = join(dir, "brand.png");
			writeFileSync(logo, png(200, 100));
			writeFileSync(brand, png(80, 40));
			expect(
				createManifest({
					logo,
					logoWidth: 100,
					background: "#112233",
					darkBackground: "#010203",
					brand,
					brandWidth: 80,
					brandBottom: 48,
				}),
			).toEqual({
				background: "#112233",
				darkBackground: "#010203",
				logo: { width: 100, height: 50 },
				brand: { bottom: 48, width: 80, height: 40 },
			});
			expect(
				createManifest({
					logo,
					logoWidth: 100,
					background: "#FFFFFF",
				}),
			).toEqual({
				background: "#FFFFFF",
				logo: { width: 100, height: 50 },
			});
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});
});
