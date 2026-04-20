precision highp float;
#define PI 3.1415926535897932384626433832795

uniform float uStrength;
uniform vec2 uViewportSizes;
uniform float uScrollProgress;
uniform float uTime;
uniform float uEntrance;

varying vec2 vUv;

void main() {
	vec4 newPosition = modelViewMatrix * vec4(position, 1.0);

	float targetDisplacementX = sin(newPosition.y / uViewportSizes.x * PI + PI / 2.0) * -uStrength * 1.0;
	float targetDisplacementZ = -cos(newPosition.x / uViewportSizes.y * PI + PI / 2.0) * -uStrength * 1.0;

	newPosition.x += targetDisplacementX * 0.55;
	newPosition.z += targetDisplacementZ * 1.25;

	// Entrance animation — offset X rightward, animated 1→0
	newPosition.x += uEntrance * uViewportSizes.x * 1.75;

	vUv = uv;

	gl_Position = projectionMatrix * newPosition;
}
