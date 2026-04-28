import { Page } from '../Page';
import emitter from '@utils/Emitter';
import { getComponents } from '@components';
import WebGLConfig from '../utils/WebGLConfig';
import { OriginalsView } from './OriginalsView';

export class Originals extends Page {
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
		if (this.created) return;

		this.calculateViewport();
		this.initView(template);

		this.scene.add(this.elements);
		this.created = true;
		this.emit('create');
	}

	initView(template = document) {
		const wrapper = template.querySelector(
			'[data-slider="originals"]',
		);
		this.view = new OriginalsView({
			parent: this.elements,
			camera: this.camera,
			viewport: this.viewport,
			screen: this.screen,
			template: wrapper || template,
			onReady: () => {
				emitter.emit('originals:enter-ready');
			},
		});
	}

	onEnter(data) {
		if (this._leaveTimer) {
			clearTimeout(this._leaveTimer);
			this._leaveTimer = null;
			this.view?.destroy?.();
			this.view = null;
			this.created = false;
			this.create(data);
		}
		super.onEnter(data);
	}

	transitionIn(onComplete) {
		if (onComplete) onComplete();
	}

	transitionOut(onComplete) {
		if (this.view) {
			this.view.hide();
		}

		this._leaveTimer = setTimeout(() => {
			this._leaveTimer = null;
			this.view?.destroy?.();
			this.view = null;
			this.created = false;
			if (onComplete) onComplete();
		}, 1);
	}

	onResize() {
		this.calculateViewport();
		this.view?.onResize?.(this.viewport, this.screen);
	}

	update(time) {
		if (!this.isActive || !this.view) return;

		const slider = getComponents()?.instances?.originalSlider;
		if (slider) {
			const targetStrength =
				slider.currentSpeed * 0.1 * WebGLConfig.get().scrollStrength;
			this.smoothedStrength +=
				(targetStrength - this.smoothedStrength) * 0.1;

			this.view.setStrength(this.smoothedStrength);
			this.view.setProgress(slider.currentProgress);
		}

		this.view.update(time);
	}

	destroy() {
		this.view?.destroy?.();
		super.destroy();
	}
}
