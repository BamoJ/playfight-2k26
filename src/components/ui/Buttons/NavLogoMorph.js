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
		this.main = this.navLogo.querySelector('#main');
		this.secondary = this.navLogo.querySelector('#secondary');
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
		console.log('mouseenter');
		if (!this.tl) {
			this.tl = gsap.timeline({ paused: true });
			this.tl.to(this.main, {
				duration: 0.5,
				morphSVG: {
					shape: this.secondary,
				},
				ease: 'expo.inOut',
			});
		}

		this.tl.play();
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
