import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default class AnimationCore {
	constructor(element, options = {}) {
		// Main element selector
		this.element =
			element instanceof Element
				? element
				: document.querySelector(element);

		// Enhanced default options
		this.options = {
			triggerStart: 'top 90%',
			duration: 1.5,
			ease: 'power3.out',
			scrub: false,
			cleanup: true,
			markers: false,
			...options,
		};

		// For storing multiple elements/selectors
		this.elements = {};

		// For storing GSAP instances
		this.timeline = null;
		this.scrollTrigger = null;
	}

	createElements() {
		// Will be implemented by child classes
	}

	createTimeline(config = {}) {
		this.timeline = gsap.timeline({
			paused: true,
			onComplete: () => {
				if (this.options.cleanup) {
					this.destroy();
				}
			},
			...config,
		});
	}
	// In AnimationCore.js line 48-73:
	createScrollTrigger() {
		const triggerEl = this.triggerElement || this.element;

		if (this.options.scrub) {
			this.scrollTrigger = ScrollTrigger.create({
				trigger: triggerEl,
				start: this.options.triggerStart,
				end: this.options.triggerEnd,
				animation: this.timeline,
				scrub: this.options.scrub,
				markers: this.options.markers,
			});
		} else {
			this.scrollTrigger = ScrollTrigger.create({
				trigger: triggerEl,
				start: this.options.triggerStart,
				markers: this.options.markers,
				once: true,
				onEnter: () => {
					this.timeline.play();
					this.onEnter();
				},
			});
		}
	}

	// Lifecycle Hooks (can be overridden by child classes)
	onEnter() {}
	onLeave() {}
	onEnterBack() {}
	onLeaveBack() {}

	animate() {
		// Will be implemented by child classes
	}

	init() {
		if (!this.element) {
			console.log('No element found for animation');
			return;
		}

		this.createElements();
		this.createTimeline();
		this.animate();
		this.createScrollTrigger();
	}

	destroy() {
		if (this.timeline) {
			this.timeline.kill();
		}
		if (this.scrollTrigger) {
			this.scrollTrigger.kill();
		}
	}
}
