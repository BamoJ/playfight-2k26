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
	vec2 coverUv = (vUv - 0.5) * uCoverScale + 0.5;

	float shiftAmount = uStrength * uScrollProgress * 0.95;

	float r = texture2D(uTexture, coverUv + vec2(shiftAmount * 2.0, 0.0)).r;
	float g = texture2D(uTexture, coverUv).g;
	float b = texture2D(uTexture, coverUv + vec2(shiftAmount * 2.0, 0.0)).b;

	gl_FragColor = vec4(r, g, b, uOpacity);
}
