import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import AnimationCore from '@animations/_core/AnimationCore';

gsap.registerPlugin(Flip);

export default class HeroScroll extends AnimationCore {
	constructor(element, options = {}) {
		super(element, {
			triggerStart: 'top top',
			triggerEnd: 'bottom +=105%',
			scrub: true,
			markers: true,
			cleanup: false,
		});
	}

	createElements() {
		this.container = this.element;
		this.imgMove = this.container.querySelectorAll(
			'[data-anim-hero-scroll="img-move"]',
		);
		this.videoFlipMove = this.container.querySelector(
			'[data-anim-hero-scroll="video-flip-move"]',
		);
		this.targetVideoContainer = this.container.querySelector(
			'[data-anim-hero-scroll="target-video-container"]',
		);
		this.flipOriginParent = this.videoFlipMove?.parentElement;
	}

	createTimeline() {
		super.createTimeline({
			defaults: {
				ease: 'none',
			},
		});
		if (
			!this.videoFlipMove ||
			!this.targetVideoContainer ||
			!this.flipOriginParent
		)
			return;

		const state = Flip.getState(this.videoFlipMove);
		const target = this.targetVideoContainer;
		target.append(this.videoFlipMove);

		const targetX = gsap.utils.wrap(['-50vw', '50vw']);
		const targetY = gsap.utils.wrap([
			'-50vh',
			'-50vh',
			'50vh',
			'50vh',
			'50vh',
		]);
		const flipTl = Flip.from(state, {
			ease: 'none',
			scale: true,
		});

		this.timeline
			.to(this.imgMove, {
				x: targetX,
				y: targetY,
				filter: 'blur(30px)',
				stagger: {
					from: 'center',
					amount: 0.02,
				},
			})
			.add(flipTl, 0);
	}

	destroy() {
		if (this.flipOriginParent && this.videoFlipMove) {
			gsap.set(this.videoFlipMove, {
				clearProps: 'transform,opacity',
			});
			gsap.set(this.imgMove, { clearProps: 'x,y,filter' });
			this.flipOriginParent.append(this.videoFlipMove);
		}
		super.destroy();
	}
}
