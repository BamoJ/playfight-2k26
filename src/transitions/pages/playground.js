import { Transition } from '@unseenco/taxi';
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';

export default class PlaygroundTransition extends Transition {
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

		const readyDelay = this.fromElement ? 0.67 : 0;

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
			 *  Query DOM elements
			 *  Grid container, cards, and mode
			 *  switch buttons for entrance animation
			 * ───────────────────────────────────────
			 */
			const grid = to.querySelector('[data-pl-mode="grid"]');
			const cards = to.querySelectorAll('[data-pl-mode="card-item"]');
			const plModeButtons = to.querySelectorAll(
				'.playground_mode_switch_btn',
			);
			const plModeBar = to.querySelector(
				'.playground_mode_switch_bar',
			);

			/*
			 * ───────────────────────────────────────
			 *  Fade in new content
			 *  Uses overwrite:false to protect from
			 *  Flip's killTweensOf cascade
			 * ───────────────────────────────────────
			 */
			gsap.to(to, {
				opacity: 1,
				duration: 1.5,
				ease: 'sine.in',
			});

			/*
			 * ───────────────────────────────────────
			 *  Flip 10→4 column entrance
			 *  Fakes a mode switch: captures 10-col
			 *  state, swaps back to 4-col, animates
			 *  from scattered to grid layout
			 * ───────────────────────────────────────
			 */
			grid.classList.remove('is-4-col');
			grid.classList.add('is-10-col');
			const state = Flip.getState(cards, grid);
			grid.classList.remove('is-10-col');
			grid.classList.add('is-4-col');

			Flip.from(state, {
				duration: 1.3,
				ease: 'expo.inOut',
				absoluteOnLeave: true,
				absolute: false,
				stagger: { amount: 0.9, from: 'center' },
				delay: 0.4,
				onComplete: () => {
					gsap.set(cards, { clearProps: 'all' });
				},
			});

			/*
			 * ───────────────────────────────────────
			 *  Cards blur yoyo
			 *  Adds motion blur during Flip animation
			 * ───────────────────────────────────────
			 */
			gsap.to(cards, {
				filter: 'blur(10px)',
				duration: 1,
				yoyo: true,
				repeat: 1,
				ease: 'sine.in',
				delay: 0.8,
			});

			/*
			 * ───────────────────────────────────────
			 *  Mode switch bar entrance
			 *  Bar scales in from 0 after cards
			 *  have settled into position
			 * ───────────────────────────────────────
			 */
			gsap.from(plModeBar, {
				scaleY: 0,
				duration: 1,
				ease: 'power3.inOut',
				delay: 2,
				onComplete: () => {
					gsap.set(plModeButtons, { clearProps: ' scaleY' });
				},
				stagger: { amount: 0.2, from: 'center' },
				overwrite: 'auto',
			});

			/*
			 * ───────────────────────────────────────
			 *  Mode switch buttons entrance
			 *  Buttons fade in and slide from
			 *  opposite sides (left/right)
			 * ───────────────────────────────────────
			 */
			gsap.from(plModeButtons, {
				opacity: 0,
				duration: 1,
				ease: 'sine.out',
				delay: 2.3,
				onComplete: () => {
					gsap.set(plModeButtons, { clearProps: ' opacity' });
				},
				stagger: { amount: 0.2, from: 'center' },
				overwrite: 'auto',
			});
			gsap.from(plModeButtons, {
				duration: 0.8,
				xPercent: (i) => (i === 0 ? 100 : -100),
				ease: 'back.out(1.7)',
				delay: 2.3,
				onComplete: () => {
					gsap.set(plModeButtons, { clearProps: ' x' });
				},
				stagger: { amount: 0.2, from: 'center' },
				overwrite: 'auto',
			});
		});
	}
}
