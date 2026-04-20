import Core from 'smooothy';

export class AboutSlider extends Core {
	constructor(wrapper) {
		super(wrapper, {
			infinite: true,
			snap: true,
			scrollInput: false,
			scrollSensitivity: 1,
			virtualScroll: {
				mouseMultiplier: 0.85,
				touchMultiplier: 1.25,
				speedDecay: 0.3,
				lerpFactor: 0.001,
				enabled: true,
				scrollContainer: wrapper,
			},
			onUpdate: (instance) => {
				this.currentSpeed = instance.speed;
				this.currentProgress = instance.progress;
				this.currentParallax = instance.parallaxValues;
			},
			onResize: (instance) => {
				instance.goToIndex(instance.currentSlide);
			},
		});

		this.wrapper = wrapper;
		this.items = Array.from(wrapper.children);
		this.currentSpeed = 0;
		this.currentProgress = 0;
		this.currentParallax = [];

		this._raf = this._raf.bind(this);
		this._running = false;

		this.start();
	}

	start() {
		if (this._running) return;
		this._running = true;
		this._raf();
	}

	stop() {
		this._running = false;
	}

	_raf() {
		if (!this._running) return;
		this.update();
		requestAnimationFrame(this._raf);
	}

	destroy() {
		this.stop();
		super.destroy();
	}
}
