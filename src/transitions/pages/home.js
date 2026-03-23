import { Transition } from '@unseenco/taxi';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';

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

		const readyDelay = this.fromElement ? 0.8 : 0;

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

			/*
			 * ───────────────────────────────────────
			 *  Typewriter fade in
			 * ───────────────────────────────────────
			 */
			const typewrite = to.querySelector('.hero_typewrite');
			if (typewrite) {
				gsap.fromTo(
					typewrite,
					{ opacity: 0 },
					{
						opacity: 1,
						duration: 0.8,
						ease: 'sine.out',
						delay: 0.3,
					},
				);
			}

			/*
			 * ───────────────────────────────────────
			 *  Hero img-move scatter entrance
			 *  Reverse of HeroScroll's scatter-out:
			 *  start at ±50vw/±50vh + blur, animate
			 *  back to origin
			 * ───────────────────────────────────────
			 */
			const imgMove = to.querySelectorAll(
				'[data-anim-hero-scroll="img-move"]',
			);
			if (imgMove.length) {
				const fromX = gsap.utils.wrap(['-50vw', '50vw']);
				const fromY = gsap.utils.wrap([
					'-50vh',
					'-50vh',
					'50vh',
					'50vh',
					'50vh',
				]);

				gsap.set(imgMove, {
					x: (i) => fromX(i),
					y: (i) => fromY(i),
					filter: 'blur(30px)',
				});

				gsap.to(imgMove, {
					x: 0,
					y: 0,
					filter: 'blur(0px)',
					duration: 1.6,
					ease: 'expo.out',
					overwrite: false,
					stagger: {
						from: 'center',
						amount: 0.15,
					},
				});
			}

			/*
			 * ───────────────────────────────────────
			 *  Hero video-flip-move fade in
			 *  Opacity only — no transforms to avoid
			 *  Flip state conflict with HeroScroll
			 * ───────────────────────────────────────
			 */
			const videoFlip = to.querySelector(
				'[data-anim-hero-scroll="video-flip-move"]',
			);
			if (videoFlip) {
				gsap.fromTo(
					videoFlip,
					{ opacity: 0 },
					{
						opacity: 1,
						duration: 0.8,
						ease: 'sine.out',
						delay: 0.4,
						onComplete: () => {
							gsap.set(videoFlip, { clearProps: 'opacity' });
						},
					},
				);
			}

			/*
			 * ───────────────────────────────────────
			 *  Page fade in
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
