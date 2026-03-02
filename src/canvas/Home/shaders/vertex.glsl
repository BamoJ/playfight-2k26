#define PI 3.1415926535897932384626433832795

uniform float uStrength;
uniform vec2 uViewportSizes;
uniform float uScrollProgress;
uniform float uTime;

varying vec2 vUv;

void main() {
	vec4 newPosition = modelViewMatrix * vec4(position, 1.0);

	// Z-axis wave: depth distortion on scroll (vertical position / viewport height)
	float waveZ = sin(newPosition.y / uViewportSizes.y * PI + PI / 2.0) * -uStrength;
	newPosition.z -= waveZ;

	vUv = uv;

	gl_Position = projectionMatrix * newPosition;
}
