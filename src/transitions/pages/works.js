import { Transition } from '@unseenco/taxi';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';

export default class WorksTransition extends Transition {
	onLeave({ done }) {
		done();
	}

	onEnter({ to }, animationComplete) {
		/*
		 * ───────────────────────────────────────
		 *  Fade out old content
		 *  Hides old page so the WebGL clone
		 *  mesh flying animation is visible
		 * ───────────────────────────────────────
		 */
		if (this.fromElement) {
			gsap.to(this.fromElement, {
				opacity: 0,
				duration: 0.45,
				ease: 'sine.in',
			});
		}

		/*
		 * ───────────────────────────────────────
		 *  Hide new content
		 *  Keeps new page invisible while
		 *  WebGL transition animates
		 * ───────────────────────────────────────
		 */
		gsap.set(to, { opacity: 0 });

		const readyDelay = this.fromElement ? 0.8 : 0;

		gsap.delayedCall(readyDelay, () => {
			animationComplete();

			/*
			 * ───────────────────────────────────────
			 *  Heading reveal
			 *  SplitText lines slide up with mask
			 * ───────────────────────────────────────
			 */
			const heading = to.querySelector('h1');
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
