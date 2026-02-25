import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import gsap from 'gsap';
import AnimationCore from '@animations/_core/AnimationCore';

gsap.registerPlugin(ScrollTrigger, SplitText);

export default class AboutStoryScroll extends AnimationCore {
	constructor(element, options = {}) {
		super(element, {
			triggerStart: 'top bottom',
			triggerEnd: 'bottom +=60%',
			scrub: 0.8,
			markers: false,
			cleanup: false,
		});
	}

	createElements() {
		this.para = this.element.querySelector(
			'[data-anim-about-scroll="para"]',
		);
		this.signature = this.element.querySelector(
			'.about_story_signature',
		);

		this.split = new SplitText(this.para, { type: 'words' });
	}

	animate() {
		gsap.set(this.split.words, {
			x: '-50vw',
			rotateX: -90,
			filter: 'blur(10px)',
			opacity: 0,
		});

		gsap.set(this.signature, { opacity: 0, x: -50 });

		this.timeline
			.to(
				this.split.words,
				{
					x: 0,
					rotateX: 0,
					opacity: 1,
					filter: 'blur(0px)',
					stagger: {
						from: 'start',
						each: 0.01,
					},
					ease: 'power2.out',
				},
				0,
			)
			.fromTo(
				this.signature,
				{
					opacity: 0,
					x: -50,
				},
				{
					opacity: 1,
					x: 0,
					ease: 'power2.out',
				},
				'>-0.4',
			);
	}

	destroy() {
		super.destroy();
		if (this.split) this.split.revert();
	}
}
