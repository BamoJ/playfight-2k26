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

		/*
		 * ───────────────────────────────────────
		 *  Fade out old content
		 *  Old page fades to 0 over 0.65s
		 * ───────────────────────────────────────
		 */
		if (this.fromElement) {
			tl.to(this.fromElement, {
				opacity: 0,
				duration: 0.45,
				ease: 'sine.in',
			});
		}

		/*
		 * ───────────────────────────────────────
		 *  Fade in new content
		 *  New page fades in over 0.65s,
		 *  starting at 0.7s (cross-fade overlap)
		 *  animationComplete fires at timeline end
		 * ───────────────────────────────────────
		 */
		tl.fromTo(
			to,
			{ opacity: 0 },
			{
				opacity: 1,
				duration: 0.65,
				ease: 'sine.in',
			},
			this.fromElement ? 0.7 : 0,
		);
	}
}
