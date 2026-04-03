import ComponentCore from '@/components/_core/ComponentCore';
import { gsap } from 'gsap';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
gsap.registerPlugin(MorphSVGPlugin);

export default class NavLogoMorph extends ComponentCore {
	constructor() {
		super();
		this.handleMouseEnter = this.handleMouseEnter.bind(this);
		this.handleMouseLeave = this.handleMouseLeave.bind(this);
		this.init();
	}

	createElements() {
		this.navLogo = document.querySelector('[data-nav-logo]');
		this.logoPrimary = this.navLogo.querySelector(
			'[data-logo-primary]',
		);
		this.logoSecondary = this.navLogo.querySelector(
			'[data-logo-secondary]',
		);
	}

	addEventListeners() {
		if (!this.navLogo) return;
		this.navLogo.addEventListener(
			'mouseenter',
			this.handleMouseEnter,
		);
		this.navLogo.addEventListener(
			'mouseleave',
			this.handleMouseLeave,
		);
	}

	removeEventListeners() {
		if (!this.navLogo) return;
		this.navLogo.removeEventListener(
			'mouseenter',
			this.handleMouseEnter,
		);
		this.navLogo.removeEventListener(
			'mouseleave',
			this.handleMouseLeave,
		);
	}

	handleMouseEnter() {
		if (this.tl) this.tl.kill();
		this.tl = gsap.timeline();
		this.tl.to(
			this.logoPrimary.querySelectorAll('path'),
			{
				yPercent: -150,
				duration: 0.3,
				ease: 'power4.out',
				stagger: { from: 'random', amount: 0.1 },
			},
			0,
		);
		this.tl.to(
			this.logoSecondary,
			{
				duration: 0.4,
				ease: 'back.out',
				scale: 1,
			},
			0.1,
		);
	}

	handleMouseLeave() {
		if (this.tl) {
			this.tl.timeScale(1.4).reverse();
		}

		console.log('mouseleave');
	}

	destroy() {
		super.destroy();
	}
}
