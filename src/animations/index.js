import ParaReveal from '@animations/texts/ParaReveal';
import HeroScroll from './scroll/HeroScroll';

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
		 * SCROLL ANIMATIONS
		 */
		document
			.querySelectorAll('[data-anim-hero-scroll="container"]')
			.forEach((element) => {
				const animation = new HeroScroll(element);
				this.collection.push(animation);
				animation.init();
			});
	}

	destroy() {
		this.collection.forEach((animation) => animation.destroy());
		this.collection = [];
	}
}
