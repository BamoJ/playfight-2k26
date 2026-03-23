import { Transition } from '@unseenco/taxi';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import TextureCache from '../../canvas/utils/TextureCache';
import emitter from '../../utils/Emitter';

export default class OriginalsTransition extends Transition {
	onLeave({ done }) {
		done();
	}

	onEnter({ to }, animationComplete) {
		// Prefetch textures — start downloads during fade-out window
		to.querySelectorAll('[data-gl-img="true"]').forEach((img) => {
			const src = img.getAttribute('data-gl-src') || img.src;
			if (src) TextureCache.load(src);
		});

		/*
		 * ───────────────────────────────────────
		 *  Fade out old content
		 *  Old page fades to 0 over 0.65s
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
		 *  Hide new content until ready
		 *  Keeps new page invisible while old
		 *  fades out and canvas loads
		 * ───────────────────────────────────────
		 */
		gsap.set(to, { opacity: 0 });

		const readyDelay = this.fromElement ? 0.7 : 0;

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
			 *  Wait for WebGL textures ready
			 *  DOM + WebGL animate together once
			 *  originals:enter-ready fires
			 * ───────────────────────────────────────
			 */
			let started = false;
			const startAnimations = () => {
				if (started) return;
				started = true;

				const heading = to.querySelector('h1');
				const title = to.querySelectorAll(
					'[data-original-info-title]',
				);
				const smallTexts = to.querySelectorAll(
					'[data-original-info-small]',
				);

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
					gsap.from(title, {
						yPercent: 120,
						duration: 1,
						ease: 'power3.out',
						delay: 0.6,
						stagger: 0.1,
					});
					gsap.from(smallTexts, {
						yPercent: 120,
						duration: 1,
						ease: 'power3.out',
						delay: 0.7,
						stagger: 0.1,
					});
				}

				gsap.to(to, {
					opacity: 1,
					duration: 0.5,
					ease: 'sine.out',
					onComplete: () => {
						gsap.set(to, { clearProps: 'opacity' });
					},
				});
			};

			emitter.once('originals:enter-ready', startAnimations);
			gsap.delayedCall(0.6, startAnimations); // fallback
		});
	}
}
