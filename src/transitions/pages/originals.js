import { Transition } from '@unseenco/taxi';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';

export default class OriginalsTransition extends Transition {
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
		 *  Keeps new page invisible while old
		 *  fades out and canvas loads
		 * ───────────────────────────────────────
		 */
		gsap.set(to, { opacity: 0 });

		const readyDelay = this.fromElement ? 1 : 0;

		gsap.delayedCall(readyDelay, () => {
			/*
			 * ───────────────────────────────────────
			 *  Fire animationComplete early
			 *  Triggers transition:complete → canvas
			 *  page swap, so WebGL loads in parallel
			 *  with the fade-in below
			 * ───────────────────────────────────────
			 */
			animationComplete();

			/*
			 * ───────────────────────────────────────
			 *  Heading reveal
			 *  SplitText lines slide up with mask
			 * ───────────────────────────────────────
			 */
			const heading = to.querySelector('h1');
			const texts = to.querySelectorAll('[data-animate="text"]');

			if (heading) {
				const splitHeading = new SplitText(heading, {
					type: 'lines',
					mask: 'lines',
				});

				gsap.fromTo(
					splitHeading.lines,
					{ yPercent: 100 },
					{
						yPercent: 0,
						duration: 1.4,
						ease: 'power3.out',
						stagger: 0.055,
					},
				);
			}

			/*
			 * ───────────────────────────────────────
			 *  Fade in new content
			 *  New page fades in over 0.65s while
			 *  canvas textures load simultaneously
			 * ───────────────────────────────────────
			 */
			gsap.to(to, {
				opacity: 1,
				duration: 0.65,
				ease: 'sine.out',
				onComplete: () => {
					gsap.set(to, { clearProps: 'opacity' });
				},
			});
		});
	}
}
