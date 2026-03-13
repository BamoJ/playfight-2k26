import Core from 'smooothy';

export class OriginalSlider extends Core {
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
				if (Math.abs(instance.speed) > 0.1) {
					this.lastMoveTime = Date.now();
				}
			},
		});

		this.wrapper = wrapper;
		this.items = Array.from(wrapper.children);
		this.currentSpeed = 0;
		this.currentProgress = 0;
		this.currentParallax = [];
		this.lastMoveTime = 0;

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
		[...this.wrapper.querySelectorAll('a')].forEach((item) => {
			let startX = 0;
			let startY = 0;
			let startTime = 0;
			let isDragging = false;

			item.style.pointerEvents = 'none';

			const handleMouseDown = (e) => {
				startX = e.clientX;
				startY = e.clientY;
				startTime = Date.now();
				isDragging = false;
			};

			const handleMouseMove = (e) => {
				if (!startTime) return;
				const deltaX = Math.abs(e.clientX - startX);
				const deltaY = Math.abs(e.clientY - startY);
				if (deltaX > 5 || deltaY > 5) {
					isDragging = true;
				}
			};

			const handleMouseUp = () => {
				const deltaTime = Date.now() - startTime;
				const timeSinceMove = Date.now() - this.lastMoveTime;
				if (!isDragging && deltaTime < 120 && timeSinceMove > 600) {
					item.click();
				}
				startTime = 0;
				isDragging = false;
			};

			item.parentElement.addEventListener(
				'mousedown',
				handleMouseDown,
			);
			item.parentElement.addEventListener(
				'mousemove',
				handleMouseMove,
			);
			item.parentElement.addEventListener('mouseup', handleMouseUp);
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
