precision highp float;
#define PI 3.1415926535897932384626433832795

uniform sampler2D uTexture;
uniform float uTime;
uniform float uStrength;
uniform float uOpacity;
uniform vec2 uCoverScale;
uniform vec2 uVelocityDir;

varying vec2 vUv;

void main() {
	// --- Cover UV (object-fit: cover) ---
	vec2 coverUv = (vUv - 0.5) * uCoverScale + 0.5;

	// --- RGB Shift along movement direction ---
	float shiftAmount = uStrength * 0.3;
	vec2 shiftDir = normalize(uVelocityDir + vec2(0.001));

	float sharpR = texture2D(uTexture, coverUv + shiftDir * shiftAmount * 1.0).r;
	float sharpG = texture2D(uTexture, coverUv).g;
	float sharpB = texture2D(uTexture, coverUv - shiftDir * shiftAmount * 1.0).b;
	vec3 sharp = vec3(sharpR, sharpG, sharpB);

	// --- Motion Blur along movement direction (6 samples) ---
	float blurAmount = smoothstep(0.02, 0.3, abs(uStrength)) * abs(uStrength) * 2.0;

	// Early-out when still
	if(blurAmount < 0.001) {
		gl_FragColor = vec4(sharp, uOpacity);
		return;
	}

	vec3 blurred = vec3(0.0);
	const int SAMPLES = 6;

	for(int i = 0; i < SAMPLES; i++) {
		float offset = (float(i) / float(SAMPLES - 1) - 0.5) * blurAmount;
		vec2 sampleUv = coverUv + shiftDir * offset;

		float r = texture2D(uTexture, sampleUv + shiftDir * shiftAmount * 1.0).r;
		float g = texture2D(uTexture, sampleUv).g;
		float b = texture2D(uTexture, sampleUv - shiftDir * shiftAmount * 1.0).b;
		blurred += vec3(r, g, b);
	}
	blurred /= float(SAMPLES);

	float blendFactor = smoothstep(0.0, 0.1, blurAmount);
	vec3 finalColor = mix(sharp, blurred, blendFactor);

	gl_FragColor = vec4(finalColor, uOpacity);
}
