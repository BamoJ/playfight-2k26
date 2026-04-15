import { Transition } from '@unseenco/taxi';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SmoothScroll from '@utils/SmoothScroll';

export default class HomeTransition extends Transition {
	onLeave({ done }) {
		done();
	}

	onEnter({ to }, animationComplete) {
		const scroll = new SmoothScroll();

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
			 *  page swap, so WebGL loads in parallel.
			 *  Re-lock scroll immediately — TM unlocks
			 *  inside animationComplete's callback, but
			 *  HeroScroll's scrub would smear the hero
			 *  transforms if the user scrolls during the
			 *  entrance. Master timeline's onComplete
			 *  unlocks once all tweens settle.
			 * ───────────────────────────────────────
			 */
			animationComplete();
			scroll.stopScroll();

			const tl = gsap.timeline({
				onComplete: () => {
					scroll.startScroll();
					ScrollTrigger.refresh();
				},
			});

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

				tl.fromTo(
					splitHeading.lines,
					{ yPercent: 100 },
					{
						yPercent: 0,
						duration: 1.4,
						ease: 'power3.out',
						stagger: 0.055,
					},
					0,
				);
			}

			/*
			 * ───────────────────────────────────────
			 *  Typewriter fade in
			 * ───────────────────────────────────────
			 */
			const typewrite = to.querySelector('.hero_typewrite');
			if (typewrite) {
				tl.fromTo(
					typewrite,
					{ opacity: 0 },
					{
						opacity: 1,
						duration: 0.8,
						ease: 'sine.out',
					},
					0.3,
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

				tl.to(
					imgMove,
					{
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
					},
					0,
				);
			}

			/*
			 * ───────────────────────────────────────
			 *  Hero video-flip-move rise + blur clear
			 *  `from` only — tween ends at the element's
			 *  natural (HeroScroll Flip-set) position, so
			 *  no clearProps needed. HeroScroll's scrub
			 *  will overwrite the inline transform on the
			 *  first scroll tick — clearing it here would
			 *  flash the video to its target (fullscreen)
			 *  DOM position for one paint before refresh.
			 * ───────────────────────────────────────
			 */
			const videoFlip = to.querySelector(
				'[data-anim-hero-scroll="video-flip-move"]',
			);
			if (videoFlip) {
				tl.from(
					videoFlip,
					{
						opacity: 0,
						y: '110vh',
						filter: 'blur(30px)',
						duration: 2,
						ease: 'expo.out',
					},
					0.4,
				);
			}

			/*
			 * ───────────────────────────────────────
			 *  Page fade in
			 * ───────────────────────────────────────
			 */
			tl.to(
				to,
				{
					opacity: 1,
					duration: 0.65,
					ease: 'sine.out',
					onComplete: () => {
						gsap.set(to, { clearProps: 'opacity' });
					},
				},
				0,
			);
		});
	}
}
