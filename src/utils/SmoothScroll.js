import Lenis from 'lenis';
import ScrollTrigger from 'gsap/ScrollTrigger';
import gsap from 'gsap';

gsap.registerPlugin(ScrollTrigger);

export default class SmoothScroll {
	static instance;

	constructor(options = {}) {
		if (SmoothScroll.instance) {
			return SmoothScroll.instance;
		}

		this.lenis = new Lenis({
			duration: 1.4,
			easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
			smoothWheel: true,
			wheelMultiplier: 1.6,
			syncTouches: true,
			autoResize: true,
			touchMultiplier: 1,
			allowNestedScroll: true,
			...options,
		});

		this.lenis.on('scroll', () => {
			ScrollTrigger.update();
		});

		gsap.ticker.lagSmoothing(0);

		this.startRAF();

		SmoothScroll.instance = this;
	}

	startRAF() {
		const RAF = (time) => {
			this.lenis.raf(time);
			requestAnimationFrame(RAF);
		};
		requestAnimationFrame(RAF);
	}

	scrollTo(target, options = {}) {
		this.lenis.scrollTo(target, { immediate: true, force: true, ...options });
	}

	startScroll() {
		this.lenis.start();
	}

	stopScroll() {
		this.lenis.stop();
	}
}
