import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import AnimationCore from '@animations/_core/AnimationCore';

gsap.registerPlugin(ScrollTrigger);

export default class ImageParallax extends AnimationCore {
	constructor(element) {
		super(element, {
			triggerStart: 'top bottom',
			triggerEnd: 'bottom top',
			scrub: 1,
			cleanup: false,
		});
	}

	animate() {
		if (!this.element) return;

		gsap.set(this.element, {
			scale: 1.3,
			willChange: 'transform, scale',
		});

		this.timeline.to(this.element, {
			y: this.element.clientHeight * 0.175,
			ease: 'none',
		});
	}
}
