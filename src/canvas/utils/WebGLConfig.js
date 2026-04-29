/**
 * Global WebGL effect knobs. Set in Webflow via a hidden Div Block (inside
 * a global Symbol, outside [data-taxi-view]) with these custom attributes:
 *
 *   <div data-webgl-config
 *        data-bulge="1"
 *        data-bulge-strength="1"
 *        data-scroll-strength="1"
 *        data-rgb-shift="1"
 *        data-blur="1"
 *        style="display:none"></div>
 *
 * All values are floating-point multipliers — decimals like 0.5, 1.75, 2.3
 * all work. `1` everywhere = current shipping look. Missing/invalid attrs
 * fall back to `1`. Changes apply on page reload.
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  data-bulge — overall lens visibility on hover
 *  Pages: Home, Project, Work (only sharedFrag has the bulge function)
 *  Curve: linear
 *
 *    0    = no lens distortion on hover (effect off)
 *    0.5  = lens applies at 50% of full strength (subtle)
 *    1    = current default
 *    2    = lens applies at 200% (extrapolated — noticeably stronger)
 *    3    = lens applies at 300% (extreme — may tear at plane edges)
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  data-bulge-strength — peak fish-eye curvature at cursor center
 *  Pages: Home, Project, Work
 *  Curve: quadratic (small values squashed, big values amplified)
 *
 *    0    = no fish-eye curvature (lens stays flat — no distortion at all)
 *    0.5  = ~2.5% peak distortion (very subtle)
 *    1    = ~10% peak distortion (current default)
 *    2    = ~40% peak distortion (clearly stronger fish-eye)
 *    3    = ~90% peak distortion (dramatic outward bulge)
 *    4+   = tears at plane edges, samples past texture
 *
 *  Note: gated by data-bulge — if bulge=0, this knob does nothing because
 *  the entire lens is disabled. Keep bulge ≥ 0.3 to see it.
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  data-scroll-strength — scroll-driven distortion intensity
 *  Pages: ALL scroll pages (Home, Project, Work, About, Originals)
 *  Curve: linear
 *  Does NOT affect: the mouse-trail on Home (trail uses mouse velocity)
 *
 *    0    = no scroll-driven distortion (images stay perfectly still)
 *    0.5  = half the scroll wave/RGB shift/blur during scroll
 *    1    = current
 *    2    = 2× scroll-driven effects
 *    3+   = waves overshoot plane bounds, may glitch
 *
 *  ⚠ This compounds with rgb-shift and blur. If both are bumped to 2,
 *    effective shift/blur during scroll = 4×. Stack carefully.
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  data-rgb-shift — color separation (red/blue glitch on motion)
 *  Pages: ALL canvases including the Home mouse-trail
 *  Curve: linear
 *
 *    0    = no color separation
 *    0.3  = subtle hint of separation during fast scroll
 *    1    = current
 *    2    = 2× separation (clearly visible during motion)
 *    3    = ~3× (starts glitching, samples past texture)
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  data-blur — motion blur amount
 *  Pages: ALL canvases including the Home mouse-trail
 *  Curve: linear, with built-in early-out at very low scroll speeds
 *
 *    0    = no motion blur
 *    0.3  = subtle smoothing
 *    1    = current
 *    2    = strong blur during scroll
 *    3+   = heavy blur, starts banding from oversampling
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  Practical sweet-spot for client tuning: 0–2 on any single knob.
 *  Going above ~3 on rgb-shift or blur produces glitchy artifacts as
 *  texture samples land outside the image. Bulge past ~4 tears.
 */
const DEFAULTS = {
	bulge: 1,
	bulgeStrength: 1,
	scrollStrength: 1,
	rgbShift: 1,
	blur: 1,
};

const ATTR_MAP = {
	bulge: 'data-bulge',
	bulgeStrength: 'data-bulge-strength',
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
