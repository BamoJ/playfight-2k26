import { Transition } from '@unseenco/taxi';
import { gsap } from 'gsap';

/**
 * Default global transition — fade out old, fade in new.
 *
 * Override per page by creating page-specific transition classes.
 */
export default class GlobalTransition extends Transition {
	onLeave({ from, trigger, done }) {
		done();
	}

	onEnter({ to, trigger }, animationComplete) {
		const tl = gsap.timeline({
			onComplete: () => {
				gsap.set(to, { clearProps: 'opacity' });
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

		// Fade in new content
		tl.fromTo(
			to,
			{ opacity: 0 },
			{
				opacity: 1,
				duration: 0.6,
				ease: 'sine.in',
			},
			this.fromElement ? 0.4 : 0,
		);
	}
}
