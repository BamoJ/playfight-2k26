import { Page } from '../Page';
import emitter from '@utils/Emitter';
import { AboutSlider } from './AboutSlider';
import { AboutView } from './AboutView';

export class About extends Page {
	constructor(options) {
		super(options);
		this.view = null;
		this.slider = null;
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
		setTimeout(() => emitter.emit('about:enter-ready'), 0);

		if (this.created) return;

		this.calculateViewport();
		this.initSlider(template);
		this.initView(template);

		this.scene.add(this.elements);
		this.created = true;
		this.emit('create');
	}

	initSlider(template = document) {
		const wrapper = template.querySelector('[data-slider="about"]');
		if (!wrapper) return;

		this.slider = new AboutSlider(wrapper);
	}

	initView(template = document) {
		this.view = new AboutView({
			parent: this.elements,
			camera: this.camera,
			viewport: this.viewport,
			screen: this.screen,
			template: this.slider?.wrapper || template,
		});
	}

	onEnter(data) {
		if (this._leaveTimer) {
			clearTimeout(this._leaveTimer);
			this._leaveTimer = null;
			this.view?.destroy?.();
			this.slider?.destroy?.();
			this.view = null;
			this.slider = null;
			this.created = false;
			this.create(data);
		}
		super.onEnter(data);
	}

	transitionIn(onComplete) {
		emitter.emit('about:enter-ready');
		if (onComplete) onComplete();
	}

	transitionOut(onComplete) {
		if (this.view) {
			this.view.hide();
		}

		this._leaveTimer = setTimeout(() => {
			this._leaveTimer = null;
			this.view?.destroy?.();
			this.slider?.destroy?.();
			this.view = null;
			this.slider = null;
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

		if (this.slider) {
			const targetStrength = this.slider.currentSpeed * 0.1;
			this.smoothedStrength +=
				(targetStrength - this.smoothedStrength) * 0.1;

			this.view.setStrength(this.smoothedStrength);
			this.view.setProgress(this.slider.currentProgress);
		}

		this.view.update(time);
	}

	destroy() {
		this.view?.destroy?.();
		this.slider?.destroy?.();
		super.destroy();
	}
}
