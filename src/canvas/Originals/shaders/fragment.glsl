precision highp float;
#define PI 3.1415926535897932384626433832795

uniform sampler2D uTexture;
uniform float uTime;
uniform float uStrength;
uniform float uScrollProgress;
uniform float uOpacity;
uniform float uEntrance;
uniform vec2 uCoverScale;
uniform float uRGBMul;
uniform float uBlurMul;

varying vec2 vUv;

void main() {
	vec2 coverUv = (vUv - 0.5) * uCoverScale + 0.5;

	float shiftAmount = uStrength * uScrollProgress * 0.95 * uRGBMul;

	float sharpR = texture2D(uTexture, coverUv + vec2(shiftAmount * 2.0, 0.0)).r;
	float sharpG = texture2D(uTexture, coverUv).g;
	float sharpB = texture2D(uTexture, coverUv + vec2(shiftAmount * 2.0, 0.0)).b;
	vec3 sharp = vec3(sharpR, sharpG, sharpB);

	float entranceBlur = uEntrance * 2.0;
	float blurAmount = smoothstep(0.05, 0.5, abs(uStrength)) * abs(uStrength) * 2.0 * uBlurMul + entranceBlur;

	if(blurAmount < 0.001) {
		gl_FragColor = vec4(sharp, uOpacity);
		return;
	}

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

	float blendFactor = smoothstep(0.0, 0.15, blurAmount);
	gl_FragColor = vec4(mix(sharp, blurred, blendFactor), uOpacity);
}
