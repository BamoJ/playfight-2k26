import { DOMPlane } from '../DOMPlane';
import TextureCache from '../utils/TextureCache';
import vertexShader from '../shaders/sharedVert.glsl';
import fragmentShader from '../shaders/sharedFrag.glsl';

export class ProjectView extends DOMPlane {
	constructor(options) {
		super({
			...options,
			shaders: {
				vertex: vertexShader,
				fragment: fragmentShader,
			},
		});
		this.template = options.template || document;

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

		uniqueSrcs.forEach((_img, src) => {
			TextureCache.load(src)
				.then((texture) => {
					this.textures.push({ texture, src });
					done();
				})
				.catch((err) => {
					console.error('[ProjectView] Texture error:', err);
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

			mesh.material.uniforms.uCoverScale = { value: coverScale };
			mesh.material.uniforms.uStrength = { value: 0 };
			mesh.material.uniforms.uScrollProgress = { value: 0 };
			mesh.material.uniforms.uViewportSizes = {
				value: [this.viewport.width, this.viewport.height],
			};
			mesh.material.uniforms.uMouse = { value: [0.5, 0.5] };
			mesh.material.uniforms.uBulge = { value: 0 };

			this.imagePlanes.push(mesh);
			this.imageGroup.add(mesh);
		});
		this.updatePlanesPositions();
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
