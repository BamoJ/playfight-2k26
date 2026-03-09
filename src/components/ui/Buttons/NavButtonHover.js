import ComponentCore from '@/components/_core/ComponentCore';
import { gsap } from 'gsap';
import emitter from '@utils/Emitter';

export default class NavButtonHover extends ComponentCore {
	constructor() {
		super();
		this.handleMouseEnter = this.handleMouseEnter.bind(this);
		this.handleMouseLeave = this.handleMouseLeave.bind(this);
		this.init();
	}

	createElements() {
		this.menuOpen = false;
		this.tl = null;
		this.openBtn = document.querySelector('[data-menu="open-btn"]');
		if (!this.openBtn) return;

		this.lines = [
			...this.openBtn.querySelectorAll('.nav_button_line'),
		];
		if (!this.lines.length) return;

		// Wrap each line in an overflow:hidden container
		this.wraps = this.lines.map((line) => {
			const wrap = document.createElement('div');
			wrap.classList.add('nav_button_line_wrap');
			wrap.style.overflow = 'hidden';
			wrap.style.width = '100%';
			wrap.style.height = '100%';
			line.parentNode.insertBefore(wrap, line);
			wrap.appendChild(line);
			return wrap;
		});
	}

	_buildTimeline() {
		const tl = gsap.timeline({
			onReverseComplete: () => {
				gsap.set(this.lines, {
					clearProps: 'xPercent,scaleX,transformOrigin',
				});
				this.tl = null;
			},
		});

		// Slide both lines out to the right
		tl.to(this.lines, {
			xPercent: 100,
			duration: 0.3,
			stagger: 0.1,
			ease: 'power3.in',
		});

		// Snap to left, set different scaleX
		tl.set(this.lines[0], {
			xPercent: -100,
			scaleX: 0.8,
			transformOrigin: 'left center',
		});
		tl.set(
			this.lines[1],
			{
				xPercent: -100,
				scaleX: 0.45,
				transformOrigin: 'left center',
			},
			'<',
		);

		// Slide back in from left at different widths
		tl.to(this.lines, {
			xPercent: 0,
			duration: 0.3,
			stagger: 0.1,
			ease: 'power3.out',
		});

		return tl;
	}

	addEventListeners() {
		if (!this.openBtn || !this.lines.length) return;
		this.openBtn.addEventListener(
			'mouseenter',
			this.handleMouseEnter,
		);
		this.openBtn.addEventListener(
			'mouseleave',
			this.handleMouseLeave,
		);
		emitter.on(
			'menu:open',
			() => {
				this.menuOpen = true;
				if (this.tl) {
					this.tl.kill();
					this.tl = null;
				}
				gsap.set(this.lines, {
					clearProps: 'xPercent,scaleX,transformOrigin',
				});
			},
			'navButtonHover',
		);
		emitter.on(
			'menu:close',
			() => {
				this.menuOpen = false;
			},
			'navButtonHover',
		);
	}

	removeEventListeners() {
		if (!this.openBtn) return;
		this.openBtn.removeEventListener(
			'mouseenter',
			this.handleMouseEnter,
		);
		this.openBtn.removeEventListener(
			'mouseleave',
			this.handleMouseLeave,
		);
		emitter.off('menu:open', null, 'navButtonHover');
		emitter.off('menu:close', null, 'navButtonHover');
	}

	handleMouseEnter() {
		if (this.menuOpen) return;
		if (this.tl) {
			this.tl.kill();
		}
		this.tl = this._buildTimeline();
	}

	handleMouseLeave() {
		if (this.menuOpen || !this.tl) return;
		this.tl.timeScale(1.4).reverse();
	}

	destroy() {
		if (this.tl) {
			this.tl.kill();
			this.tl = null;
		}
		// Unwrap lines back to original DOM structure
		if (this.wraps) {
			this.wraps.forEach((wrap) => {
				const line = wrap.firstChild;
				if (line && wrap.parentNode) {
					gsap.set(line, {
						clearProps: 'xPercent,scaleX,transformOrigin',
					});
					wrap.parentNode.insertBefore(line, wrap);
					wrap.remove();
				}
			});
			this.wraps = null;
		}
		super.destroy();
	}
}
