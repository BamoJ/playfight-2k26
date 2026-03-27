import { gsap } from 'gsap';
import { DOMPlane } from '../DOMPlane';
import TextureCache from '../utils/TextureCache';
import vertexShader from '../shaders/trailVert.glsl';
import fragmentShader from '../shaders/trailFrag.glsl';

export class TrailView extends DOMPlane {
	constructor(options) {
		super({
			...options,
			shaders: {
				vertex: vertexShader,
				fragment: fragmentShader,
			},
		});

		this.template = options.template || document;
		this.mouseWorld = { x: 0, y: 0 };
		this.trailStates = [];
		this.isHovering = false;
		this.containerRect = null;

		this.leadEase = 0.1;
		this.trailEase = 0.1;

		// Mouse velocity tracking for wave effect
		this.lastClientX = 0;
		this.lastClientY = 0;
		this.mouseVelocity = 0;
		this.smoothedStrength = 0;
		this.velocityDir = { x: 0, y: 0 };
		this.smoothedDir = { x: 0, y: 0 };

		this._onMouseMove = (e) => {
			// Mouse velocity + direction for wave effect
			const dx = e.clientX - this.lastClientX;
			const dy = e.clientY - this.lastClientY;
			this.mouseVelocity = Math.sqrt(dx * dx + dy * dy);
			// Normalized direction
			if (this.mouseVelocity > 0.1) {
				this.velocityDir.x = dx / this.mouseVelocity;
				this.velocityDir.y = dy / this.mouseVelocity;
			}
			this.lastClientX = e.clientX;
			this.lastClientY = e.clientY;

			// Convert screen → world
			this.mouseWorld.x =
				(e.clientX / this.screen.width) * this.viewport.width -
				this.viewport.width / 2;
			this.mouseWorld.y =
				this.viewport.height / 2 -
				(e.clientY / this.screen.height) * this.viewport.height;

			// Check container bounds
			if (this.container) {
				this.containerRect = this.container.getBoundingClientRect();
				const inside =
					e.clientX >= this.containerRect.left &&
					e.clientX <= this.containerRect.right &&
					e.clientY >= this.containerRect.top &&
					e.clientY <= this.containerRect.bottom;

				if (inside && !this.isHovering) {
					this.isHovering = true;
					this.fadeIn();
				} else if (!inside && this.isHovering) {
					this.isHovering = false;
					this.fadeOutTrail();
				}
			}
		};

		window.addEventListener('mousemove', this._onMouseMove, {
			signal: this.abortController.signal,
		});

		this.loadImages();
	}

	loadImages() {
		this.container = this.template.querySelector(
			'[data-stacked-trail-area]',
		);
		if (!this.container) return;

		const wrappers = Array.from(
			this.container.querySelectorAll('[data-stacked-trail-item]'),
		);
		if (!wrappers.length) return;

		// Find child <img> in each wrapper for texture source
		const entries = [];
		const uniqueSrcs = new Map();

		wrappers.forEach((wrapper, index) => {
			const img = wrapper.querySelector('img');
			if (!img) return;
			const src = img.getAttribute('data-gl-src') || img.src;
			if (!src) return;

			entries.push({ wrapper, img, src, index });
			if (!uniqueSrcs.has(src)) {
				uniqueSrcs.set(src, null);
			}
		});

		if (!entries.length) return;

		// Load textures
		let settled = 0;
		const textures = new Map();

		const tryCreate = () => {
			if (settled === uniqueSrcs.size) {
				this.createTrailPlanes(entries, textures);
			}
		};

		uniqueSrcs.forEach((_, src) => {
			TextureCache.load(src)
				.then((texture) => {
					textures.set(src, texture);
					settled++;
					tryCreate();
				})
				.catch((err) => {
					console.error('[TrailView] Texture error:', err);
					settled++;
					tryCreate();
				});
		});
	}

	createTrailPlanes(entries, textures) {
		entries.forEach(({ wrapper, src, index }) => {
			const texture = textures.get(src);
			if (!texture) return;

			// Use wrapper for sizing (it's the positioned element)
			const mesh = this.createPlane(texture, wrapper, index);

			// Cover UV scaling
			const bounds = wrapper.getBoundingClientRect();
			const imageAspect = texture.image.width / texture.image.height;
			const planeAspect = bounds.width / bounds.height;
			const coverScale =
				imageAspect > planeAspect
					? [planeAspect / imageAspect, 1.0]
					: [1.0, imageAspect / planeAspect];

			mesh.material.uniforms.uCoverScale = { value: coverScale };
			mesh.material.uniforms.uStrength = { value: 0 };
			mesh.material.uniforms.uViewportSizes = {
				value: [this.viewport.width, this.viewport.height],
			};
			mesh.material.uniforms.uVelocityDir = { value: [0, 0] };
			mesh.material.uniforms.uOffset = { value: { x: 0, y: 0 } };
			mesh.material.uniforms.uReveal = { value: 0 };

			// Z-index: first item on top (matches MouseImageTrail stacking)
			mesh.position.z = (entries.length - index) * 0.001;

			// Start invisible — fade in on hover
			mesh.material.uniforms.uOpacity.value = 0;

			this.imagePlanes.push(mesh);
			this.imageGroup.add(mesh);
		});

		// Init trail states at center
		this.trailStates = this.imagePlanes.map(() => ({ x: 0, y: 0 }));

		// Hide DOM wrappers
		entries.forEach(({ wrapper }) => {
			wrapper.style.visibility = 'hidden';
		});
	}

	fadeIn() {
		this.imagePlanes.forEach((plane) => {
			gsap.to(plane.material.uniforms.uOpacity, {
				value: 1,
				duration: 1,
				ease: 'back.out',
				overwrite: true,
			});
			gsap.to(plane.material.uniforms.uReveal, {
				value: 1,
				duration: 1,
				ease: 'back.out',
				overwrite: true,
			});
		});
	}

	fadeOutTrail() {
		this.imagePlanes.forEach((plane) => {
			gsap.to(plane.material.uniforms.uOpacity, {
				value: 0,
				duration: 0.4,
				ease: 'back.out',
				overwrite: true,
			});
			gsap.to(plane.material.uniforms.uReveal, {
				value: 0,
				duration: 0.4,
				ease: 'back.out',
				overwrite: true,
			});
		});
	}

	update({ delta }) {
		if (!this.imagePlanes.length) return;

		// Mouse velocity → wave strength (self-contained)
		const targetStrength = this.mouseVelocity * 0.005;
		this.smoothedStrength +=
			(targetStrength - this.smoothedStrength) * 0.1;
		this.mouseVelocity *= 0.95; // decay between moves

		// Trail easing — all in world space
		this.trailStates.forEach((state, i) => {
			const target =
				i === 0 ? this.mouseWorld : this.trailStates[i - 1];
			const ease = i === 0 ? this.leadEase : this.trailEase;

			// Per-plane velocity for barrel deformation
			const velX = (target.x - state.x) * ease;
			const velY = (target.y - state.y) * ease;

			state.x += velX;
			state.y += velY;

			this.imagePlanes[i].position.x = state.x;
			this.imagePlanes[i].position.y = state.y;

			// X/Y barrel deformation from plane movement velocity
			this.imagePlanes[i].material.uniforms.uOffset.value = {
				x: velX * 2.5,
				y: -velY * 2.5,
			};
		});

		// Smooth velocity direction
		this.smoothedDir.x +=
			(this.velocityDir.x - this.smoothedDir.x) * 0.1;
		this.smoothedDir.y +=
			(this.velocityDir.y - this.smoothedDir.y) * 0.1;

		// Update uniforms
		this.imagePlanes.forEach((plane) => {
			plane.material.uniforms.uStrength.value = this.smoothedStrength;
			plane.material.uniforms.uVelocityDir.value = [
				this.smoothedDir.x,
				this.smoothedDir.y,
			];
			if (plane.material.uniforms.uTime) {
				plane.material.uniforms.uTime.value += delta * 0.001;
			}
		});
	}

	onResize(viewport, screen) {
		super.onResize(viewport, screen);

		this.imagePlanes.forEach((plane) => {
			if (plane.material.uniforms.uViewportSizes) {
				plane.material.uniforms.uViewportSizes.value = [
					viewport.width,
					viewport.height,
				];
			}
		});
	}
}
