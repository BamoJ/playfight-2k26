import ParaReveal from '@animations/texts/ParaReveal';
import HeroScroll from './scroll/HeroScroll';
import AboutNav from './scroll/AboutNav';
import AboutStoryScroll from './scroll/AboutStoryScroll';
import LogoWallCycle from './scroll/LogoWallCycle';

export default class Animation {
	constructor() {
		this.collection = [];
		this.isEnabled = true;
		this.createAnimations();
	}

	createAnimations() {
		// TODO: Uncomment when animation classes are implemented
		// import FadeIn, LineReveal, ImageReveal, ImageParallax, HeadingReveal

		// Initialize text animations
		document
			.querySelectorAll('[data-anim-para="true"]')
			.forEach((element) => {
				const animation = new ParaReveal(element);
				this.collection.push(animation);
				animation.init();
			});

		/**
		 * SCROLL ANIMATIONS (single-element queries)
		 */
		const heroScrollEl = document.querySelector(
			'[data-anim-hero-scroll="container"]',
		);
		if (heroScrollEl) {
			const animation = new HeroScroll(heroScrollEl);
			this.collection.push(animation);
			animation.init();
		}

		const aboutNavEl = document.querySelector(
			'[data-anim-about-nav="true"]',
		);
		if (aboutNavEl) {
			const animation = new AboutNav(aboutNavEl);
			this.collection.push(animation);
			animation.init();
		}

		const aboutScrollEl = document.querySelector(
			'[data-anim-about-scroll="container"]',
		);
		if (aboutScrollEl) {
			const animation = new AboutStoryScroll(aboutScrollEl);
			this.collection.push(animation);
			animation.init();
		}

		document
			.querySelectorAll('[data-logo-wall-cycle-init]')
			.forEach((element) => {
				const animation = new LogoWallCycle(element);
				this.collection.push(animation);
				animation.init();
			});
	}

	destroy() {
		this.collection.forEach((animation) => animation.destroy());
		this.collection = [];
	}
}
