#define PI 3.1415926535897932384626433832795

#include "../utils/includes/perlinNoise.glsl"

uniform float uStrength;
uniform vec2 uViewportSizes;
uniform float uScrollProgress;
uniform float uTime;
uniform float uPageTransition;
uniform float uEntrance;

varying vec2 vUv;

void main() {
	vec4 newPosition = modelViewMatrix * vec4(position, 1.0);

	// Z-axis wave: depth distortion on scroll (vertical position / viewport height)
	float waveZ = sin(newPosition.y / uViewportSizes.y * PI + PI / 2.0) * -uStrength;
	newPosition.z -= waveZ * 0.8; // Adjust strength of Z distortion

	// --- Entrance: paper flying from below with Z sine flutter ---
	if(uEntrance > 0.0) {
		newPosition.y -= uEntrance * uViewportSizes.y * 1.0;

		float entranceWaveZ = sin(newPosition.y / uViewportSizes.x * PI) * uEntrance;
		newPosition.z += entranceWaveZ * 1.0;

		// Ripple across plane surface
		float ripplePhase = uEntrance * PI * 4.0;
		float ripple = cos(uv.y * PI * 1.0 - ripplePhase) * uEntrance * 0.5;
		newPosition.z += ripple;
	}

	// --- Page transition: paper ripple + perlin noise ---
	if(uPageTransition > 0.0) {
		float waveIntensity = sin(uPageTransition * PI);
		float easedProgress = smoothstep(0.0, 1.01, uPageTransition);
		float wavePhase = easedProgress * PI * 2.5;
		float rippleX = uv.x * PI * 1.5 + wavePhase;
		float paperRipple = sin(rippleX) * waveIntensity * 0.15;

		float noiseScale = 2.5;
		float noiseSpeed = uPageTransition * 0.3;
		float noiseZ = cnoise(vec3(uv * noiseScale, noiseSpeed)) * waveIntensity * 0.035;

		newPosition.z += -paperRipple * 1.5 + noiseZ;
	}

	vUv = uv;

	gl_Position = projectionMatrix * newPosition;
}
