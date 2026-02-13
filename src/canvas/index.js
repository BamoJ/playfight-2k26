import {
	WebGLRenderer,
	Scene,
	PerspectiveCamera,
	SRGBColorSpace,
} from 'three';

import Time from './utils/Time';
import { TransitionController } from './TransitionController';

/**
 * Canvas — the WebGL renderer and page lifecycle manager.
 *
 * To register pages, pass a registry object:
 *   import { Home } from './Home';
 *   const canvas = new Canvas({ home: Home });
 *
 * Each key maps to a URL pattern detected by detectPageName().
 */
export default class Canvas {
	constructor(registry = {}) {
		this.container = document.querySelector('.canvas');
		if (!this.container) {
			console.warn('[Canvas] Missing .canvas container');
			return;
		}

		this.time = new Time();
		this.registry = registry;
		this.pages = {};
		this.currentPage = null;

		this.createRenderer();
		this.createCamera();
		this.createScene();

		this.transitionController = new TransitionController(this);

		this.addEventListeners();
		this.time.on('tick', () => this.update());

		this.initCurrentPage();

		window.__canvas = this;
	}

	initCurrentPage() {
		const pageName = this.detectPageName();
		if (pageName) {
			this.onChange(pageName);
		}
	}

	/**
	 * Detect current page from URL or data attributes.
	 * Override or extend this for custom routing logic.
	 */
	detectPageName(el = document) {
		// Check data attributes first
		const pageAttr =
			el === document
				? document.body.dataset.page ||
					document.querySelector('[data-page]')?.dataset.page
				: el.dataset?.page ||
					el.querySelector('[data-page]')?.dataset.page;

		if (pageAttr && this.registry[pageAttr]) return pageAttr;

		// Fallback to URL
		const path = window.location.pathname;
		for (const key of Object.keys(this.registry)) {
			if (
				path === '/' &&
				(key === 'home' || key === 'index')
			)
				return key;
			if (path.includes(key)) return key;
		}

		return null;
	}

	createRenderer() {
		this.renderer = new WebGLRenderer({
			alpha: true,
			antialias: true,
		});

		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.setPixelRatio(
			Math.min(window.devicePixelRatio, 2),
		);
		this.renderer.setClearColor(0x000000, 0);
		this.renderer.outputColorSpace = SRGBColorSpace;

		this.container.appendChild(this.renderer.domElement);
	}

	createCamera() {
		this.camera = new PerspectiveCamera(
			45,
			window.innerWidth / window.innerHeight,
			0.1,
			100,
		);
		this.camera.position.z = 1;
	}

	createScene() {
		this.scene = new Scene();
	}

	async onChange(pageName, template) {
		if (!pageName) {
			if (this.currentPage) {
				this.currentPage.onLeave?.(template);
				this.currentPage = null;
			}
			return;
		}

		const Cls = this.registry[pageName];
		if (!Cls) {
			if (this.currentPage) {
				this.currentPage.onLeave?.(template);
				this.currentPage = null;
			}
			return;
		}

		const prev = this.currentPage;

		if (!this.pages[pageName]) {
			this.pages[pageName] = new Cls({
				scene: this.scene,
				camera: this.camera,
				renderer: this.renderer,
				time: this.time,
			});
		}

		const next = this.pages[pageName];

		if (prev) {
			prev.onLeave?.(template);
		}

		if (!next.created) {
			if (next.load) await next.load();
			next.create(template);
		}

		this.currentPage = next;
		next.onEnter?.(template);
	}

	onResize() {
		const width = window.innerWidth;
		const height = window.innerHeight;

		this.camera.aspect = width / height;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(width, height);

		if (this.currentPage?.onResize) {
			this.currentPage.onResize();
		}
	}

	update() {
		Object.values(this.pages).forEach((page) => {
			if (page.update) page.update(this.time);
		});

		this.renderer.render(this.scene, this.camera);
	}

	addEventListeners() {
		this._onResize = this.onResize.bind(this);
		window.addEventListener('resize', this._onResize);
	}

	destroy() {
		this.time.stop();
		window.removeEventListener('resize', this._onResize);

		Object.values(this.pages).forEach((p) => {
			p.onLeave?.();
			p.destroy?.();
		});

		if (this.renderer) {
			this.renderer.dispose();
			const el = this.renderer.domElement;
			if (el?.parentNode) el.parentNode.removeChild(el);
		}
	}
}
