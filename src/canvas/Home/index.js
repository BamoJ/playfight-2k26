import { Page } from '../Page';
import { DOMPlane } from '../DOMPlane';
import { gsap } from 'gsap';
import emitter from '@utils/Emitter';
import TextureCache from '../utils/TextureCache';
import defaultVert from '../shaders/defaultVert.glsl';
import defaultFrag from '../shaders/defaultFrag.glsl';

/**
 * Example Home page — demonstrates DOMPlane usage with image textures.
 *
 * Queries all [data-gl="img"] elements, creates WebGL planes,
 * and syncs them to the DOM. Hover adds wave/reveal effects.
 *
 * Replace this with your project-specific WebGL experience.
 */
export class Home extends Page {
	constructor(options) {
		super(options);
		this.view = null;
		this.calculateViewport();
	}

	calculateViewport() {
		this.screen = {
			width: window.innerWidth,
			height: window.innerHeight,
		};

		const fov = this.camera.fov * (Math.PI / 180);
		const height =
			2 * Math.tan(fov / 2) * this.camera.position.z;
		const width = height * this.camera.aspect;

		this.viewport = { width, height };
	}

	create(template = document) {
		// Signal ready for preloader/transitions
		setTimeout(() => emitter.emit('home:enter-ready'), 0);

		if (this.created) return;

		this.calculateViewport();
		this.initView(template);

		this.scene.add(this.elements);
		this.created = true;
		this.emit('create');
	}

	initView(template = document) {
		this.view = new HomeView({
			parent: this.elements,
			camera: this.camera,
			viewport: this.viewport,
			screen: this.screen,
			shaders: {
				vertex: defaultVert,
				fragment: defaultFrag,
			},
			template,
		});
	}

	onEnter(data) {
		if (this.view && this.created) {
			this.view.destroy?.();
			this.view = null;
			this.created = false;
			this.create(data);
		}
		super.onEnter(data);
	}

	transitionIn(onComplete) {
		emitter.emit('home:enter-ready');
		if (onComplete) onComplete();
	}

	transitionOut(onComplete) {
		if (this.view) {
			this.view.hide();
		}

		setTimeout(() => {
			this.view?.destroy?.();
			this.view = null;
			this.created = false;
			if (onComplete) onComplete();
		}, 1400);
	}

	onResize() {
		this.calculateViewport();
		this.view?.onResize?.(this.viewport, this.screen);
	}

	update(time) {
		if (!this.isActive || !this.view) return;
		this.view.update(time);
	}

	destroy() {
		this.view?.destroy?.();
		super.destroy();
	}
}

/**
 * HomeView — example DOMPlane subclass.
 * Loads [data-gl="img"] images and creates interactive WebGL planes.
 */
class HomeView extends DOMPlane {
	constructor(options) {
		super(options);
		this.template = options.template || document;
		this.loadImages();
	}

	loadImages() {
		const images = Array.from(
			this.template.querySelectorAll('[data-gl="img"]'),
		);

		if (!images.length) return;

		let loaded = 0;
		const uniqueSrcs = new Map();

		images.forEach((img) => {
			const src =
				img.getAttribute('data-gl-src') || img.src;
			if (!src || uniqueSrcs.has(src)) return;
			uniqueSrcs.set(src, img);
		});

		uniqueSrcs.forEach((img, src) => {
			TextureCache.load(src)
				.then((texture) => {
					this.textures.push({ texture, src });
					loaded++;
					if (loaded === uniqueSrcs.size) {
						this.createPlanes(images);
					}
				})
				.catch((err) =>
					console.error('[HomeView] Texture error:', err),
				);
		});
	}

	createPlanes(images) {
		images.forEach((img, index) => {
			const src =
				img.getAttribute('data-gl-src') || img.src;
			const texEntry = this.textures.find(
				(t) => t.src === src,
			);
			if (!texEntry) return;

			const mesh = this.createPlane(
				texEntry.texture,
				img,
				index,
			);

			// Add reveal uniform for hover effect
			mesh.material.uniforms.uReveal = { value: 0 };
			mesh.material.uniforms.uWaveIntensity = { value: 0 };
			mesh.material.uniforms.uPageTransition = { value: 0 };

			// Shader zoom factor for TransitionController UV correction
			mesh.userData.shaderZoom = 0.9;

			this.imagePlanes.push(mesh);
			this.imageGroup.add(mesh);

			this.setupHoverListeners(
				mesh,
				img,
				'[data-gl-container]',
			);

			// Setup click-to-transition handler
			this.setupTransitionHandler(mesh, img);
		});

		// Hide DOM images, show WebGL planes
		this.template
			.querySelectorAll('[data-gl="img"]')
			.forEach((img) => {
				img.style.opacity = '0';
			});

		this.updatePlanesPositions();
	}

	setupTransitionHandler(mesh, img) {
		const link = img
			.closest('[data-gl-container]')
			?.querySelector('a[href]');
		if (!link) return;

		link.addEventListener(
			'click',
			() => {
				if (
					window.matchMedia('(max-width: 768px)').matches
				)
					return;

				emitter.emit('webgl:transition:prepare', {
					mesh,
					targetUrl: link.href,
					sourcePage: 'home',
				});
			},
			{ signal: this.abortController.signal },
		);
	}

	onHoverEnter(mesh) {
		if (window.matchMedia('(max-width: 768px)').matches)
			return;
		if (mesh.userData.isHovered) return;
		mesh.userData.isHovered = true;

		const u = mesh.material.uniforms;
		gsap.killTweensOf(u.uWaveIntensity);
		gsap.killTweensOf(u.uReveal);

		gsap.to(u.uWaveIntensity, {
			value: 0.5,
			duration: 0.4,
			ease: 'power2.out',
		});
		gsap.to(u.uReveal, {
			value: 1,
			duration: 0.4,
			ease: 'power2.out',
		});
	}

	onHoverLeave(mesh) {
		if (window.matchMedia('(max-width: 768px)').matches)
			return;
		if (!mesh.userData.isHovered) return;
		mesh.userData.isHovered = false;

		const u = mesh.material.uniforms;
		gsap.killTweensOf(u.uWaveIntensity);
		gsap.killTweensOf(u.uReveal);

		gsap.to(u.uWaveIntensity, {
			value: 0,
			duration: 0.2,
			ease: 'power2.out',
		});
		gsap.to(u.uReveal, {
			value: 0,
			duration: 0.2,
			ease: 'power2.out',
		});
	}

	updatePlanesPositions() {
		this.imagePlanes.forEach((plane) => {
			this.updatePlanePosition(plane);
		});
	}

	update({ delta }) {
		this.updatePlanesPositions();
		this.updateHoveredPlanes(delta);
	}
}
