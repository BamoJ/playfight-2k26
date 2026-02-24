import { ScrollTrigger } from 'gsap/ScrollTrigger';
import AnimationCore from '@animations/_core/AnimationCore';

export default class AboutNav extends AnimationCore {
	constructor(element, options = {}) {
		super(element, {
			cleanup: false,
		});

		this.scrollTriggers = [];
	}

	createElements() {
		this.navLinks = document.querySelectorAll(
			'.about_navigation_link',
		);
	}

	createTimeline() {}

	createScrollTrigger() {
		this.navLinks.forEach((link) => {
			const href = link.getAttribute('href');
			if (!href || href.length < 2 || !href.startsWith('#')) return;

			const section = document.querySelector(href);
			if (!section) return;

			const st = ScrollTrigger.create({
				trigger: section,
				start: 'top center',
				end: 'bottom center',
				toggleClass: { targets: link, className: 'is-active' },
			});

			this.scrollTriggers.push(st);
		});
	}

	destroy() {
		this.scrollTriggers.forEach((st) => st.kill());
		this.navLinks.forEach((link) =>
			link.classList.remove('is-active'),
		);
		this.scrollTriggers = [];
		super.destroy();
	}
}
