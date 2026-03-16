import { Transition } from '@unseenco/taxi';
import { gsap } from 'gsap';
import emitter from '@utils/Emitter';

export default class ProjectTransition extends Transition {
	onLeave({ done }) {
		done();
	}

	onEnter({ to }, animationComplete) {
		// Snap body background to new theme color instantly (no visible blip)
		document.body.style.transition = 'none';
		void document.body.offsetHeight;
		document.body.style.transition = '';

		// Fade out old content so the WebGL clone mesh is visible
		if (this.fromElement) {
			gsap.to(this.fromElement, {
				opacity: 0,
				duration: 0.4,
				ease: 'sine.out',
			});
		}

		// Keep new content invisible while WebGL animates
		gsap.set(to, { opacity: 0 });

		const readyDelay = this.fromElement ? 0.4 : 0;

		gsap.delayedCall(readyDelay, () => {
			// Fire animationComplete so TransitionManager swaps pages,
			// resets scroll, and emits transition:complete —
			// which triggers canvas.onChange() → Project.create() → notifyTransitionTarget()
			animationComplete();

			// Reveal new content when WebGL hands off
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

			// Fallback if WebGL transition never fires (mobile, missing hero)
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
