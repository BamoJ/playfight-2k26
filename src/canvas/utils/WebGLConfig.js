/**
 * Global WebGL effect knobs, set in Webflow via:
 *   <div data-webgl-config
 *        data-bulge="1"
 *        data-hover-zoom="1"
 *        data-scroll-strength="1"
 *        data-rgb-shift="1"
 *        data-blur="1"
 *        style="display:none"></div>
 *
 * All values are multipliers. `1` = current shipping look. Decimals OK.
 *
 *   data-bulge          — hover lens overall intensity (Home/Project/Work)
 *                         0 = off, 1 = current, 2 = ~2× stronger lens warp
 *   data-hover-zoom     — hover lens peak magnification at cursor (same pages)
 *                         Quadratic curve: 0 = no zoom, 1 = 10% (current),
 *                         2 = 40%, 3 = 90% (dramatic but safe)
 *   data-scroll-strength — scroll-driven distortion intensity (all scroll pages)
 *                         0 = flat, 1 = current, 2 = 2× more distortion
 *                         (does NOT affect mouse-trail on Home — trail uses mouse velocity)
 *   data-rgb-shift      — color separation (all pages incl. Trail)
 *                         0 = off, 1 = current, 2 = 2× more separation
 *   data-blur           — motion blur amount (all pages incl. Trail)
 *                         0 = off, 1 = current, 2 = 2× more blur
 *
 * Practical sweet-spot: 0–2. Past ~3, RGB/blur start sampling outside the
 * texture and look glitchy. Bulge past ~3 may tear at plane edges.
 */
const DEFAULTS = {
	bulge: 1,
	hoverZoom: 1,
	scrollStrength: 1,
	rgbShift: 1,
	blur: 1,
};

const ATTR_MAP = {
	bulge: 'data-bulge',
	hoverZoom: 'data-hover-zoom',
	scrollStrength: 'data-scroll-strength',
	rgbShift: 'data-rgb-shift',
	blur: 'data-blur',
};

let cache = null;

function read() {
	const el = document.querySelector('[data-webgl-config]');
	if (!el) return { ...DEFAULTS };

	const out = {};
	for (const key in DEFAULTS) {
		const raw = el.getAttribute(ATTR_MAP[key]);
		const parsed = parseFloat(raw);
		out[key] = Number.isFinite(parsed) ? parsed : DEFAULTS[key];
	}
	return out;
}

const WebGLConfig = {
	get() {
		if (!cache) cache = read();
		return cache;
	},
	refresh() {
		cache = read();
		return cache;
	},
};

export default WebGLConfig;
