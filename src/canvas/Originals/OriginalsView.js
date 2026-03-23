import { gsap } from 'gsap';
import { DOMPlane } from '../DOMPlane';
import TextureCache from '../utils/TextureCache';
import vertexShader from './shaders/vertex.glsl';
import fragmentShader from './shaders/fragment.glsl';

export class OriginalsView extends DOMPlane {
	constructor(options) {
		super({
			...options,
			shaders: {
				vertex: vertexShader,
				fragment: fragmentShader,
			},
		});
		this.onReady = options.onReady;
		this.template = options.template || document;
		this.loadImages();
	}

	loadImages() {
		const images = Array.from(
			this.template.querySelectorAll('[data-gl-img="true"]'),
		);

		if (!images.length) return;

		let settled = 0;
		const uniqueSrcs = new Map();

		images.forEach((img) => {
			const src = img.getAttribute('data-gl-src') || img.src;
			if (!src || uniqueSrcs.has(src)) return;
			uniqueSrcs.set(src, img);
		});

		const done = () => {
			settled++;
			if (settled === uniqueSrcs.size) {
				this.createPlanes(images);
			}
		};

		uniqueSrcs.forEach((img, src) => {
			TextureCache.load(src)
				.then((texture) => {
					this.textures.push({ texture, src });
					done();
				})
				.catch((err) => {
					console.error('[OriginalsView] Texture error:', err);
					done();
				});
		});
	}

	createPlanes(images) {
		images.forEach((img, index) => {
			const src = img.getAttribute('data-gl-src') || img.src;
			const texEntry = this.textures.find((t) => t.src === src);
			if (!texEntry) return;

			const mesh = this.createPlane(texEntry.texture, img, index);

			// Cover UV scaling — reuse bounds cached by createPlane
			const bounds = mesh.userData.bounds;
			const imageAspect =
				texEntry.texture.image.width / texEntry.texture.image.height;
			const planeAspect = bounds.width / bounds.height;
			const coverScale =
				imageAspect > planeAspect
					? [planeAspect / imageAspect, 1.0]
					: [1.0, imageAspect / planeAspect];

			mesh.material.uniforms.uCoverScale = {
				value: coverScale,
			};
			mesh.material.uniforms.uOpacity = { value: 0 };
			mesh.material.uniforms.uEntrance = { value: 1 };
			mesh.material.uniforms.uStrength = { value: 0 };
			mesh.material.uniforms.uScrollProgress = { value: 0 };
			mesh.material.uniforms.uViewportSizes = {
				value: [this.viewport.width, this.viewport.height],
			};

			this.imagePlanes.push(mesh);
			this.imageGroup.add(mesh);
		});

		this.updatePlanesPositions();
		this.onReady?.();
		this.animateEntrance();
	}

	/*
	 * ───────────────────────────────────────
	 *  Entrance animation
	 *  Planes slide in from right + motion
	 *  blur, staggered sequentially
	 * ───────────────────────────────────────
	 */
	animateEntrance() {
		/*
		 * ───────────────────────────────────────
		 *  Sort by visual X position
		 *  Deferred one frame so smooothy has
		 *  applied its CSS transforms first
		 *  Stagger left → right
		 * ───────────────────────────────────────
		 */
		const delay = 0.2; // Delay to allow smooothy to apply transforms

		gsap.delayedCall(delay, () => {
			const sorted = [...this.imagePlanes].sort(
				(a, b) =>
					a.userData.img.getBoundingClientRect().left -
					b.userData.img.getBoundingClientRect().left,
			);

			sorted.forEach((plane, i) => {
				const delay = i * 0.046;

				gsap.to(plane.material.uniforms.uOpacity, {
					value: 1,
					duration: 0.75,
					ease: 'sine.out',
					delay,
				});
				gsap.to(plane.material.uniforms.uEntrance, {
					value: 0,
					duration: 1.5,
					ease: 'power4.out',
					delay,
				});
			});
		});
	}

	setStrength(value) {
		this.imagePlanes.forEach((plane) => {
			plane.material.uniforms.uStrength.value = value;
		});
	}

	setProgress(value) {
		this.imagePlanes.forEach((plane) => {
			plane.material.uniforms.uScrollProgress.value = value;
		});
	}

	updatePlanesPositions() {
		this.imagePlanes.forEach((plane) => {
			this.updatePlanePosition(plane);
		});
	}

	update({ delta }) {
		this.updatePlanesPositions();

		this.imagePlanes.forEach((plane) => {
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
