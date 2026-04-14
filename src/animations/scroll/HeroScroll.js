import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import AnimationCore from '@animations/_core/AnimationCore';
import emitter from '@utils/Emitter';

gsap.registerPlugin(Flip);

export default class HeroScroll extends AnimationCore {
	constructor(element, options = {}) {
		super(element, {
			triggerStart: 'top top',
			triggerEnd: 'bottom +=105%',
			scrub: true,
			markers: false,
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

		// Defer Flip setup until preloader's reveal finishes so Flip.getState
		// captures a clean (transform-free) state on videoFlipMove + children.
		const loader = document.querySelector('[data-loader="wrap"]');
		const preloading =
			loader && loader.style.visibility !== 'hidden';

		if (preloading) {
			this._flipSetup = () => this.setupFlip();
			emitter.once('preloader:complete', this._flipSetup);
		} else {
			this.setupFlip();
		}
	}

	setupFlip() {
		const state = Flip.getState(this.videoFlipMove);
		this.targetVideoContainer.append(this.videoFlipMove);

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
		if (this._flipSetup) {
			emitter.off('preloader:complete', this._flipSetup);
			this._flipSetup = null;
		}
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
