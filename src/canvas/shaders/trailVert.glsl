precision highp float;
#define PI 3.1415926535897932384626433832795

uniform float uStrength;
uniform vec2 uViewportSizes;
uniform float uTime;
uniform vec2 uVelocityDir;
uniform vec2 uOffset;
uniform float uReveal;

varying vec2 vUv;

// Barrel-warp deformation driven by plane movement velocity
vec3 deformationCurve(vec3 pos, vec2 uvCoord, vec2 offset) {
	pos.x = pos.x + (sin(uvCoord.y * PI) * offset.x);
	pos.y = pos.y - (sin(uvCoord.x * PI) * offset.y);
	return pos;
}

void main() {
	vec3 newPosition = position;

	// Scale reveal (0 = collapsed, 1 = full size)
	if(uReveal < 0.01) {
		newPosition *= 0.0;
	} else if(uReveal < 0.99) {
		float wave = sin(uv.x * PI) * 0.15 * (1.0 - abs(uReveal - 0.5) * 2.0);
		float scale = clamp(uReveal + wave, 0.0, 1.0);
		newPosition *= scale;
	}

	// X/Y barrel deformation from movement velocity
	newPosition = deformationCurve(newPosition, uv, uOffset);

	vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);

	// Wave weighted by movement direction — mostly X/Y, slight Z
	float waveY = -sin(mvPosition.y / uViewportSizes.y * PI + PI / 2.0) * abs(uVelocityDir.y);
	float waveX = sin(mvPosition.x / uViewportSizes.x * PI + PI / 2.0) * abs(uVelocityDir.x);
	float wave = (waveY + waveX) * uStrength;

	mvPosition.x -= wave * 0.1;

	vUv = uv;

	gl_Position = projectionMatrix * mvPosition;
}
