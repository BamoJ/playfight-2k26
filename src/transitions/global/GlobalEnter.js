import { Transition } from '@unseenco/taxi';
import { gsap } from 'gsap';
import emitter from '@utils/Emitter';

/**
 * Default global transition — fade out old, fade in new.
 *
 * For pages with WebGL (e.g. Home), listens for a ready signal
 * before running enter animations.
 *
 * Override per page by creating page-specific transition classes.
 */
export default class GlobalTransition extends Transition {
	constructor(options) {
		super(options);
	}

	onLeave({ from, trigger, done }) {
		done();
	}

	onEnter({ to, trigger }, animationComplete) {
		const tl = gsap.timeline({
			onComplete: () => {
				gsap.set(to, { clearProps: 'all' });
				animationComplete();
			},
		});

		// Fade out old content
		if (this.fromElement) {
			tl.to(
				this.fromElement,
				{
					opacity: 0,
					duration: 0.6,
					ease: 'sine.out',
				},
				0,
			);
		}

		// Safety timeout
		setTimeout(() => {
			if (document.body.contains(this.fromElement)) {
				animationComplete();
			}
		}, 1500);
	}
}
