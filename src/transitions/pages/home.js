import { Transition } from '@unseenco/taxi';
import { gsap } from 'gsap';

export default class HomeTransition extends Transition {
	onLeave({ done }) {
		done();
	}

	onEnter({ to }, animationComplete) {
		/*
		 * ───────────────────────────────────────
		 *  Fade out old content
		 *  Old page fades to 0 over 0.65s
		 * ───────────────────────────────────────
		 */
		if (this.fromElement) {
			gsap.to(this.fromElement, {
				opacity: 0,
				duration: 0.65,
				ease: 'sine.in',
			});
		}

		/*
		 * ───────────────────────────────────────
		 *  Hide new content until ready
		 * ───────────────────────────────────────
		 */
		gsap.set(to, { opacity: 0 });

		const readyDelay = this.fromElement ? 0.6 : 0;

		gsap.delayedCall(readyDelay, () => {
			/*
			 * ───────────────────────────────────────
			 *  Fire animationComplete early
			 *  Triggers transition:complete → canvas
			 *  page swap, so WebGL loads in parallel
			 * ───────────────────────────────────────
			 */
			animationComplete();

			/*
			 * ───────────────────────────────────────
			 *  Reveal new content instantly
			 * ───────────────────────────────────────
			 */
			gsap.set(to, { opacity: 1 });

			const cards = to.querySelectorAll('[data-pl-mode="card-item"]');

			if (cards.length) {
				/*
				 * ───────────────────────────────────────
				 *  Cards entrance animation
				 *  Slides cards up from below with
				 *  blur + opacity stagger
				 * ───────────────────────────────────────
				 */
				gsap.from(cards, {
					yPercent: 150,
					filter: 'blur(10px)',
					opacity: 0,
					duration: 1.6,
					ease: 'expo.inOut',
					stagger: {
						amount: 1.5,
						from: 'start',
					},
					onComplete: () => {
						gsap.set(cards, {
							clearProps: 'transform,filter,opacity',
						});
					},
				});
			}
		});
	}
}
