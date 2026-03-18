import { Transition } from '@unseenco/taxi';
import { gsap } from 'gsap';
import emitter from '@utils/Emitter';

export default class ProjectTransition extends Transition {
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
				duration: 0.4,
				ease: 'sine.out',
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

		const readyDelay = this.fromElement ? 0.4 : 0;

		gsap.delayedCall(readyDelay, () => {
			/*
			 * ───────────────────────────────────────
			 *  Fire animationComplete early
			 *  Triggers transition:complete → canvas
			 *  page swap → Project.create() →
			 *  notifyTransitionTarget()
			 * ───────────────────────────────────────
			 */
			animationComplete();

			/*
			 * ───────────────────────────────────────
			 *  Reveal on WebGL handoff
			 *  Waits for TransitionController to
			 *  emit handoff, then fades in new
			 *  content underneath the WebGL plane
			 * ───────────────────────────────────────
			 */
			const onHandoff = () => {
				gsap.to(to, {
					opacity: 1,
					duration: 0.4,
					ease: 'sine.in',
					onComplete: () => {
						gsap.set(to, { clearProps: 'opacity' });
					},
				});
			};

			emitter.once('webgl:transition:handoff', onHandoff);

			/*
			 * ───────────────────────────────────────
			 *  Fallback reveal (3s timeout)
			 *  If WebGL transition never fires
			 *  (mobile, missing hero), force reveal
			 * ───────────────────────────────────────
			 */
			const fallbackTimer = setTimeout(() => {
				emitter.off('webgl:transition:handoff', onHandoff);
				if (parseFloat(to.style.opacity) < 1) {
					gsap.to(to, {
						opacity: 1,
						duration: 0.3,
						ease: 'sine.in',
						onComplete: () => {
							gsap.set(to, { clearProps: 'opacity' });
						},
					});
				}
			}, 3000);

			emitter.once('webgl:transition:complete', () => {
				clearTimeout(fallbackTimer);
			});
		});
	}
}
