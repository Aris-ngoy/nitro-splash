const fs = require("fs");

function readImageSize(filePath) {
	const buf = fs.readFileSync(filePath);
	if (
		buf.length >= 24 &&
		buf[0] === 0x89 &&
		buf[1] === 0x50 &&
		buf[2] === 0x4e &&
		buf[3] === 0x47
	) {
		return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
	}
	if (buf.length >= 4 && buf[0] === 0xff && buf[1] === 0xd8) {
		return readJpegSize(buf);
	}
	return null;
}

function readJpegSize(buf) {
	let offset = 2;
	while (offset + 9 < buf.length) {
		if (buf[offset] !== 0xff) {
			offset += 1;
			continue;
		}
		const marker = buf[offset + 1];
		if (marker === 0xd8 || marker === 0xd9) {
			offset += 2;
			continue;
		}
		const length = buf.readUInt16BE(offset + 2);
		const isStartOfFrame =
			marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
		if (isStartOfFrame && offset + 9 < buf.length) {
			return { height: buf.readUInt16BE(offset + 5), width: buf.readUInt16BE(offset + 7) };
		}
		offset += 2 + length;
	}
	return null;
}

function frameForWidth(filePath, width) {
	if (!filePath || !fs.existsSync(filePath)) {
		return { width, height: width };
	}
	const size = readImageSize(filePath);
	if (!size || size.width <= 0) {
		return { width, height: width };
	}
	return { width, height: Math.round((width * size.height) / size.width) };
}

function drawnLogoFrame(filePath, width) {
	const requested = frameForWidth(filePath, width);
	const drawnWidth = Math.min(Math.max(requested.width, 48), 320);
	const drawnHeight = requested.height * (drawnWidth / Math.max(requested.width, 1));
	return { width: drawnWidth, height: drawnHeight };
}

function createManifest(options) {
	const manifest = {
		background: options.background,
		logo: drawnLogoFrame(options.logo, options.logoWidth),
	};
	if (options.darkBackground) {
		manifest.darkBackground = options.darkBackground;
	}
	if (options.brand) {
		const frame = frameForWidth(options.brand, options.brandWidth ?? options.logoWidth);
		manifest.brand = {
			bottom: options.brandBottom ?? 48,
			width: frame.width,
			height: frame.height,
		};
	}
	return manifest;
}

module.exports = { createManifest, frameForWidth, readImageSize };
