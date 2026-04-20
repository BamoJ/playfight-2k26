import ComponentCore from '@/components/_core/ComponentCore';
import { gsap } from 'gsap';

export default class MouseImageTrail extends ComponentCore {
	constructor() {
		super();
		this.config = {
			leadEase: 0.1,
			trailEase: 0.1,
			pathFollow: 1,
		};

		this.instances = [];
		this.mouseX = 50;
		this.mouseY = 50;
		this.lastClientX = null;
		this.lastClientY = null;
		this.isHovering = false;
		this._cachedRect = null;
		this._rectDirty = true;
		this._isIdle = true;
		this._ac = new AbortController();
		this._tick = this._step.bind(this);
		this.init();
	}

	createElements() {
		this.container = document.querySelector(
			'[data-stacked-trail-area]',
		);
		if (!this.container) return;

		const images = this.container.querySelectorAll(
			'[data-stacked-trail-item]',
		);
		this.instances = Array.from(images).map((el, index) => {
			el.style.zIndex = images.length - index;
			return { el, x: 50, y: 50 };
		});
	}

	createEvents() {
		this.events.onMouseMove = this._onMouseMove.bind(this);
		this.events.onScroll = () => {
			this._rectDirty = true;
		};
	}

	addEventListeners() {
		if (!this.container) return;
		const { signal } = this._ac;
		document.addEventListener('mousemove', this.events.onMouseMove, {
			signal,
			passive: true,
		});
		window.addEventListener('scroll', thiss.events.onScroll, {
			signal,
			passive: true,
		});
		gsap.ticker.add(this._tick);

		if (this.container.matches(':hover')) {
			this.isHovering = true;
			this.container.setAttribute('data-stacked-trail-area', 'hover');
		}
	}

	removeEventListeners() {
		this._ac.abort();
		gsap.ticker.remove(this._tick);
	}

	_updateFromPointer() {
		if (this.lastClientX === null) return;
		if (!this._cachedRect) return;
		const rect = this._cachedRect;
		const inside =
			this.lastClientX >= rect.left &&
			this.lastClientX <= rect.right &&
			this.lastClientY >= rect.top &&
			this.lastClientY <= rect.bottom;

		if (inside && !this.isHovering) {
			this.isHovering = true;
			this.container.setAttribute('data-stacked-trail-area', 'hover');
		} else if (!inside && this.isHovering) {
			this.isHovering = false;
			this.container.setAttribute('data-stacked-trail-area', '');
		}

		if (!inside) return;
		this.mouseX = Math.min(
			100,
			Math.max(
				0,
				((this.lastClientX - rect.left) / rect.width) * 100,
			),
		);
		this.mouseY = Math.min(
			100,
			Math.max(
				0,
				((this.lastClientY - rect.top) / rect.height) * 100,
			),
		);
	}

	_onMouseMove(e) {
		this.lastClientX = e.clientX;
		this.lastClientY = e.clientY;
		this._rectDirty = true;
	}

	_step() {
		if (this._isIdle && !this._rectDirty) return;

		if (this._rectDirty) {
			this._cachedRect = this.container.getBoundingClientRect();
			this._rectDirty = false;
			this._updateFromPointer();
		}

		const { leadEase, trailEase, pathFollow } = this.config;
		const EPS = 0.01;
		let moved = false;

		this.instances.forEach((state, index) => {
			let targetX, targetY;

			if (index === 0) {
				targetX = this.mouseX;
				targetY = this.mouseY;
			} else {
				const prev = this.instances[index - 1];
				targetX =
					prev.x * pathFollow + this.mouseX * (1 - pathFollow);
				targetY =
					prev.y * pathFollow + this.mouseY * (1 - pathFollow);
			}

			const dx = targetX - state.x;
			const dy = targetY - state.y;

			if (Math.abs(dx) < EPS && Math.abs(dy) < EPS) return;

			const ease = index === 0 ? leadEase : trailEase;
			state.x += dx * ease;
			state.y += dy * ease;

			state.el.style.left = state.x + '%';
			state.el.style.top = state.y + '%';
			moved = true;
		});

		this._isIdle = !moved && !this.isHovering;
	}

	destroy() {
		this.instances.forEach(({ el }) => {
			el.style.left = '';
			el.style.top = '';
			el.style.zIndex = '';
		});
		this.instances = [];
		super.destroy();
	}
}
