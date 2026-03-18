precision highp float;
#define PI 3.1415926535897932384626433832795

uniform sampler2D uTexture;
uniform float uTime;
uniform float uStrength;
uniform float uScrollProgress;
uniform float uOpacity;
uniform vec2 uCoverScale;
uniform vec2 uMouse;
uniform float uBulge;

varying vec2 vUv;

vec2 bulge(vec2 uv, vec2 center) {
	float radius = 1.2; // Adjust as needed
	float strength = 1.1;
	uv -= center;
	float dist = length(uv) / radius;
	float distPow = pow(dist, 2.0);
	float strengthAmount = strength / (1.0 + distPow);
	uv *= mix(1.0, strengthAmount, uBulge);
	uv += center;
	return uv;
}

void main() {
	// --- Cover UV (object-fit: cover) ---
	vec2 coverUv = (vUv - 0.5) * uCoverScale + 0.5;

	// --- Bulge distortion (mouse hover) ---
	coverUv = bulge(coverUv, uMouse);

	// --- RGB Shift on Y axis ---
	float shiftAmount = uStrength * uScrollProgress * 0.95;

	// --- Sharp sample — individual channel offsets ---
	float sharpR = texture2D(uTexture, coverUv + vec2(0.0, shiftAmount * 2.0)).r;
	float sharpG = texture2D(uTexture, coverUv + vec2(0.0, shiftAmount * 0.0)).g;
	float sharpB = texture2D(uTexture, coverUv + vec2(0.0, shiftAmount * -2.0)).b;
	vec3 sharp = vec3(sharpR, sharpG, sharpB);

	// --- Motion Blur (8 samples, vertical) ---
	float blurAmount = smoothstep(0.05, 0.5, abs(uStrength)) * abs(uStrength) * 15.0;

	// Early-out: skip blur loop when not scrolling
	if(blurAmount < 0.001) {
		gl_FragColor = vec4(sharp, uOpacity);
		return;
	}

	vec3 blurred = vec3(0.0);
	const int SAMPLES = 8;

	for(int i = 0; i < SAMPLES; i++) {
		float offset = (float(i) / float(SAMPLES - 1) - 0.5) * blurAmount;
		vec2 sampleUv = coverUv + vec2(0.0, offset);

		vec4 shifted = texture2D(uTexture, sampleUv + vec2(0.0, shiftAmount * 2.0));
		float g = texture2D(uTexture, sampleUv).g;
		blurred += vec3(shifted.r, g, shifted.b);
	}
	blurred /= float(SAMPLES);

	// --- Blend sharp with blurred ---
	float blendFactor = smoothstep(0.0, 0.15, blurAmount);
	vec3 finalColor = mix(sharp, blurred, blendFactor);

	gl_FragColor = vec4(finalColor, uOpacity);
}
