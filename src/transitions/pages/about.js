import { Transition } from '@unseenco/taxi';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';

export default class AboutTransition extends Transition {
	onLeave({ done }) {
		done();
	}

	onEnter({ to }, animationComplete) {
		if (this.fromElement) {
			gsap.to(this.fromElement, {
				opacity: 0,
				duration: 0.45,
				ease: 'sine.in',
			});
		}

		gsap.set(to, { opacity: 0 });

		const readyDelay = this.fromElement ? 0.8 : 0;

		gsap.delayedCall(readyDelay, () => {
			animationComplete();

			const heading = to.querySelector('h1');
			const lightboxButton = to.querySelector(
				'.about_lightbox_button',
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
						duration: 1.5,
						ease: 'power3.out',
						stagger: 0.065,
					},
				);
				gsap.from(lightboxButton, {
					opacity: 0,
					duration: 0.8,
					ease: 'sine.out',
					delay: 0.6,
				});
			}

			gsap.to(to, {
				opacity: 1,
				duration: 0.4,
				ease: 'sine.out',
				onComplete: () => {
					gsap.set(to, { clearProps: 'opacity' });
				},
			});
		});
	}
}
