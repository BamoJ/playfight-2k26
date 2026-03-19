import gsap from 'gsap';
import { Raycaster, Vector2 } from 'three';
import { DOMPlane } from '../DOMPlane';
import TextureCache from '../utils/TextureCache';
import emitter from '@utils/Emitter';
import vertexShader from '../shaders/sharedVert.glsl';
import fragmentShader from '../shaders/sharedFrag.glsl';

export class WorkView extends DOMPlane {
	constructor(options) {
		super({
			...options,
			shaders: {
				vertex: vertexShader,
				fragment: fragmentShader,
			},
		});
		this.template = options.template || document;
		this.raycaster = new Raycaster();
		this.mouseNDC = new Vector2(-10, -10);
		this.hoveredPlane = null;
		this.mouseDirty = false;

		this._onMouseMove = (e) => {
			this.mouseNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
			this.mouseNDC.y = -(e.clientY / window.innerHeight) * 2 + 1;
			this.mouseDirty = true;
		};
		window.addEventListener('mousemove', this._onMouseMove, {
			signal: this.abortController.signal,
		});

		this.loadImages();
	}

	loadImages() {
		const images = Array.from(
			this.template.querySelectorAll('[data-gl-img="true"]'),
		);

		if (!images.length) return;

		// Wait for DOM images to load (ensures getBoundingClientRect returns correct height
		// when images use height:auto with no width/height HTML attributes)
		const imgLoadPromises = images
			.filter((img) => !img.complete)
			.map(
				(img) =>
					new Promise((resolve) => {
						img.addEventListener('load', resolve, {
							once: true,
						});
						img.addEventListener('error', resolve, {
							once: true,
						});
					}),
			);

		let settled = 0;
		const uniqueSrcs = new Map();

		images.forEach((img) => {
			const src = img.getAttribute('data-gl-src') || img.src;
			if (!src || uniqueSrcs.has(src)) return;
			uniqueSrcs.set(src, img);
		});

		let texturesReady = false;
		let domImagesReady = imgLoadPromises.length === 0;

		const tryCreatePlanes = () => {
			if (texturesReady && domImagesReady) {
				this.createPlanes(images);
			}
		};

		Promise.all(imgLoadPromises).then(() => {
			domImagesReady = true;
			tryCreatePlanes();
		});

		const done = () => {
			settled++;
			if (settled === uniqueSrcs.size) {
				texturesReady = true;
				tryCreatePlanes();
			}
		};

		uniqueSrcs.forEach((img, src) => {
			TextureCache.load(src)
				.then((texture) => {
					this.textures.push({ texture, src });
					done();
				})
				.catch((err) => {
					console.error('[WorkView] Texture error:', err);
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

			// Cover UV scaling
			const bounds = img.getBoundingClientRect();
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
			mesh.material.uniforms.uStrength = { value: 0 };
			mesh.material.uniforms.uScrollProgress = { value: 0 };
			mesh.material.uniforms.uViewportSizes = {
				value: [this.viewport.width, this.viewport.height],
			};
			mesh.material.uniforms.uMouse = { value: [0.5, 0.5] };
			mesh.material.uniforms.uBulge = { value: 0 };
			mesh.material.uniforms.uPageTransition = { value: 0 };
			mesh.material.uniforms.uOpacity.value = 0;
			mesh.material.uniforms.uEntrance = { value: 1 };
			mesh.userData.targetMouseUV = { x: 0.5, y: 0.5 };

			this.imagePlanes.push(mesh);
			this.imageGroup.add(mesh);
		});

		// Hide DOM images once WebGL planes are ready
		this.template
			.querySelectorAll('[data-gl-img="true"]')
			.forEach((img) => {
				img.style.opacity = '0';
			});

		this.updatePlanesPositions();
		this.setupClickHandlers();
		this.animateEntrance();
	}

	animateEntrance() {
		const delay = 0.3;
		gsap.delayedCall(delay, () => {
			this.imagePlanes.forEach((plane) => {
				gsap.to(plane.material.uniforms.uOpacity, {
					value: 1,
					duration: 0.8,
					ease: 'sine.out',
				});
				gsap.to(plane.material.uniforms.uEntrance, {
					value: 0,
					duration: 1.5,
					ease: 'power2.out',
				});
			});
		});
	}

	setupClickHandlers() {
		this.imagePlanes.forEach((mesh) => {
			const link = mesh.userData.img.closest('a[href]');
			if (!link) return;

			link.addEventListener(
				'click',
				() => {
					if (window.matchMedia('(max-width: 768px)').matches) return;

					emitter.emit('webgl:transition:prepare', {
						mesh,
						targetUrl: link.href,
						sourcePage: 'works',
						startPosition: null,
					});

					// Fade out all other planes
					this.imagePlanes.forEach((plane) => {
						if (plane === mesh) return;
						gsap.to(plane.material.uniforms.uOpacity, {
							value: 0,
							duration: 0.5,
							ease: 'sine.out',
						});
					});
				},
				{ signal: this.abortController.signal },
			);
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
		if (
			this.imagePlanes[0]?.material.uniforms.uStrength.value !== 0
		) {
			this.mouseDirty = true;
		}
		this.updateBulge();

		this.imagePlanes.forEach((plane) => {
			if (plane.material.uniforms.uTime) {
				plane.material.uniforms.uTime.value += delta * 0.001;
			}

			const mouse = plane.material.uniforms.uMouse.value;
			const target = plane.userData.targetMouseUV;
			const ease = 0.07;

			if (plane.userData.isHovered) {
				mouse[0] += (target.x - mouse[0]) * ease;
				mouse[1] += (target.y - mouse[1]) * ease;
			} else {
				mouse[0] += (0.5 - mouse[0]) * ease;
				mouse[1] += (0.5 - mouse[1]) * ease;
			}
		});
	}

	updateBulge() {
		if (!this.imagePlanes.length || !this.mouseDirty) return;
		this.mouseDirty = false;

		this.raycaster.setFromCamera(this.mouseNDC, this.camera);
		const intersects = this.raycaster.intersectObjects(
			this.imagePlanes,
		);

		const hit = intersects.length > 0 ? intersects[0] : null;
		const hitPlane = hit ? hit.object : null;

		if (hitPlane !== this.hoveredPlane) {
			if (this.hoveredPlane) {
				this.hoveredPlane.userData.isHovered = false;
				gsap.to(this.hoveredPlane.material.uniforms.uBulge, {
					value: 0,
					duration: 0.4,
					ease: 'power2.out',
					overwrite: true,
				});
			}
			if (hitPlane) {
				hitPlane.userData.isHovered = true;
				gsap.to(hitPlane.material.uniforms.uBulge, {
					value: 1,
					duration: 0.6,
					ease: 'power2.out',
					overwrite: true,
				});
			}
			this.hoveredPlane = hitPlane;
		}

		if (hit && hit.uv) {
			hitPlane.userData.targetMouseUV.x = hit.uv.x;
			hitPlane.userData.targetMouseUV.y = hit.uv.y;
		}
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
