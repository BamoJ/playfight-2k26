precision highp float;
#define PI 3.1415926535897932384626433832795

uniform sampler2D uTexture;
uniform float uTime;
uniform float uStrength;
uniform float uScrollProgress;
uniform float uOpacity;
uniform vec2 uCoverScale;

varying vec2 vUv;

void main() {
	// --- Cover UV (object-fit: cover) ---
	vec2 coverUv = (vUv - 0.5) * uCoverScale + 0.5;

	// --- RGB Shift ---
	float shiftAmount = uStrength * uScrollProgress * 0.95;

	// --- Sharp sample (no blur) ---
	float sharpR = texture2D(uTexture, coverUv + vec2(shiftAmount * 2.0, 0.0)).r;
	float sharpG = texture2D(uTexture, coverUv).g;
	float sharpB = texture2D(uTexture, coverUv + vec2(shiftAmount * 2.0, 0.0)).b;
	vec3 sharp = vec3(sharpR, sharpG, sharpB);

	// --- Motion Blur (8 samples, horizontal) ---
	float blurAmount = smoothstep(0.05, 0.5, abs(uStrength)) * abs(uStrength) * 30.0;

	vec3 blurred = vec3(0.0);
	const int SAMPLES = 8;

	for(int i = 0; i < SAMPLES; i++) {
		float offset = (float(i) / float(SAMPLES - 1) - 0.5) * blurAmount;
		vec2 sampleUv = coverUv + vec2(offset, 0.0);

		float r = texture2D(uTexture, sampleUv + vec2(shiftAmount * 2.0, 0.0)).r;
		float g = texture2D(uTexture, sampleUv).g;
		float b = texture2D(uTexture, sampleUv + vec2(shiftAmount * 2.0, 0.0)).b;

		blurred += vec3(r, g, b);
	}
	blurred /= float(SAMPLES);

	// --- Blend sharp with blurred ---
	float blendFactor = smoothstep(0.0, 0.15, blurAmount);
	vec3 finalColor = mix(sharp, blurred, blendFactor);

	gl_FragColor = vec4(finalColor, uOpacity);
}
