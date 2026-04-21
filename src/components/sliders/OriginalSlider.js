import Core from 'smooothy';
import { isTouch } from '@utils/device';

export class OriginalSlider extends Core {
	constructor(wrapper) {
		const touch = isTouch();
		super(wrapper, {
			infinite: true,
			snap: true,
			scrollInput: false,
			lerpFactor: touch ? 0.18 : 0.3,
			snapStrength: touch ? 0.18 : 0.1,
			virtualScroll: {
				mouseMultiplier: 0.85,
				touchMultiplier: touch ? 4.2 : 1.25,
				speedDecay: touch ? 0.2 : 0.3,
				lerpFactor: touch ? 0.22 : 0.001,
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
		this.#hoistLightboxes();
		this.#handleLinks();
	}

	#hoistLightboxes() {
		const portal = document.querySelector(
			'.original_lightbox_video_portal',
		);
		if (!portal) return;
		this.wrapper
			.querySelectorAll('[data-video-lightbox-status]')
			.forEach((el) => portal.appendChild(el));
	}

	#handleLinks() {
		let lastInteractionEndTime = 0;

		[...this.wrapper.querySelectorAll('a')].forEach((item) => {
			let startX = 0;
			let startY = 0;
			let startTime = 0;
			let movedDuringPress = false;

			item.style.pointerEvents = 'none';

			const handleWindowMouseMove = (e) => {
				const dx = Math.abs(e.clientX - startX);
				const dy = Math.abs(e.clientY - startY);
				if (dx > 5 || dy > 5) movedDuringPress = true;
			};

			const handleWindowMouseUp = () => {
				window.removeEventListener('mousemove', handleWindowMouseMove);
				window.removeEventListener('mouseup', handleWindowMouseUp);

				if (!startTime) return;
				const tapDuration = Date.now() - startTime;
				const sinceLastInteraction =
					Date.now() - lastInteractionEndTime;
				startTime = 0;
				lastInteractionEndTime = Date.now();

				const wasDrag = movedDuringPress || this.isDragging;
				movedDuringPress = false;

				if (wasDrag) return;

				const sliderInMotion =
					this.isDragging ||
					this.isTouching ||
					Math.abs(this.speed) > 0.05;

				if (sliderInMotion) return;
				if (tapDuration > 120) return;
				if (sinceLastInteraction < 350) return;

				item.click();
			};

			const handleMouseDown = (e) => {
				startX = e.clientX;
				startY = e.clientY;
				startTime = Date.now();
				movedDuringPress = false;
				window.addEventListener('mousemove', handleWindowMouseMove);
				window.addEventListener('mouseup', handleWindowMouseUp);
			};

			item.parentElement.addEventListener(
				'mousedown',
				handleMouseDown,
			);
		});
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
