import { Page } from '../Page';
import emitter from '@utils/Emitter';
import SmoothScroll from '@utils/SmoothScroll';
import { HomeView } from './HomeView';
import { TrailView } from './TrailView';

export class Home extends Page {
	constructor(options) {
		super(options);
		this.view = null;
		this.smoothedStrength = 0;
		this._leaveTimer = null;
		this.calculateViewport();
	}

	calculateViewport() {
		this.screen = {
			width: window.innerWidth,
			height: window.innerHeight,
		};

		const fov = this.camera.fov * (Math.PI / 180);
		const height = 2 * Math.tan(fov / 2) * this.camera.position.z;
		const width = height * this.camera.aspect;

		this.viewport = { width, height };
	}

	create(template = document) {
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
			template,
		});
		this.trailView = new TrailView({
			parent: this.elements,
			camera: this.camera,
			viewport: this.viewport,
			screen: this.screen,
			template,
		});
	}

	onEnter(data) {
		if (this._leaveTimer) {
			clearTimeout(this._leaveTimer);
			this._leaveTimer = null;
			this.view?.destroy?.();
			this.trailView?.destroy?.();
			this.view = null;
			this.trailView = null;
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
		this.view?.hide();
		this.trailView?.hide();

		this._leaveTimer = setTimeout(() => {
			this._leaveTimer = null;
			this.view?.destroy?.();
			this.trailView?.destroy?.();
			this.view = null;
			this.trailView = null;
			this.created = false;
			if (onComplete) onComplete();
		}, 1400);
	}

	onResize() {
		this.calculateViewport();
		this.view?.onResize?.(this.viewport, this.screen);
		this.trailView?.onResize?.(this.viewport, this.screen);
	}

	update(time) {
		if (!this.isActive || !this.view) return;

		const lenis = SmoothScroll.instance?.lenis;
		if (lenis) {
			const targetStrength = lenis.velocity * 0.005;
			this.smoothedStrength +=
				(targetStrength - this.smoothedStrength) * 0.1;
			this.view.setStrength(this.smoothedStrength);

			const maxScroll =
				document.body.scrollHeight - window.innerHeight;
			const progress = maxScroll > 0 ? lenis.scroll / maxScroll : 0;
			this.view.setProgress(progress);
		}

		this.view.update(time);
		this.trailView?.update(time);
	}

	destroy() {
		this.view?.destroy?.();
		this.trailView?.destroy?.();
		super.destroy();
	}
}
