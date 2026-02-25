import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import AnimationCore from '@animations/_core/AnimationCore';

gsap.registerPlugin(ScrollTrigger);

export default class LogoWallCycle extends AnimationCore {
	constructor(element, options = {}) {
		super(element, {
			cleanup: false,
			...options,
		});

		this.loopDelay = 1; // Time between swaps
		this.duration = 0.8;
		this.swapPairs = 2;
		this.isSwapping = false;
		this.abortController = new AbortController();
	}

	createElements() {
		this.list = this.element.querySelector('[data-logo-wall-list]');
		this.items = Array.from(
			this.list.querySelectorAll('[data-logo-wall-item]'),
		);
		this.targets = this.items
			.map((item) => item.querySelector('[data-logo-wall-target]'))
			.filter(Boolean);
	}

	createTimeline() {
		this.timeline = gsap.timeline({
			repeat: -1,
			paused: true,
		});

		this.timeline.call(() => this.swapLogos());
	}

	createScrollTrigger() {
		this.scrollTrigger = ScrollTrigger.create({
			trigger: this.element,
			start: 'top bottom',
			end: 'bottom top',
			onEnter: () => this.timeline.play(),
			onLeave: () => this.timeline.pause(),
			onEnterBack: () => this.timeline.play(),
			onLeaveBack: () => this.timeline.pause(),
		});

		document.addEventListener(
			'visibilitychange',
			() => {
				if (!this.timeline) return;
				document.hidden
					? this.timeline.pause()
					: this.timeline.play();
			},
			{ signal: this.abortController.signal },
		);
	}

	swapLogos() {
		if (this.targets.length < 4 || this.isSwapping) return;
		this.isSwapping = true;

		const indices = this.pickRandomIndices(this.swapPairs * 2);
		const pairs = [];
		for (let i = 0; i < indices.length; i += 2) {
			pairs.push([indices[i], indices[i + 1]]);
		}

		const exitTargets = indices.map((i) => this.targets[i]);

		const swapTl = gsap.timeline();

		// Exit: rotate backward and down
		swapTl.to(exitTargets, {
			rotateX: -90,
			y: 40,
			autoAlpha: 0,
			duration: this.duration,
			transformOrigin: 'center center',
			ease: 'expo.in',
		});

		// Swap DOM + enter animation (runs right after exit)
		swapTl.call(() => {
			pairs.forEach(([a, b]) => {
				const parentA =
					this.items[a].querySelector(
						'[data-logo-wall-target-parent]',
					) || this.items[a];
				const parentB =
					this.items[b].querySelector(
						'[data-logo-wall-target-parent]',
					) || this.items[b];

				const targetA = this.targets[a];
				const targetB = this.targets[b];

				parentA.appendChild(targetB);
				parentB.appendChild(targetA);

				this.targets[a] = targetB;
				this.targets[b] = targetA;
			});

			const enterTargets = indices.map((i) => this.targets[i]);
			gsap.set(enterTargets, {
				rotateX: 90,
				autoAlpha: 0,
				transformOrigin: 'center center -50px',
			});
			gsap.to(enterTargets, {
				y: 0,
				autoAlpha: 1,
				rotateX: 0,
				duration: this.duration,
				ease: 'expo.out',
				onComplete: () => {
					this.isSwapping = false;
				},
			});
		});
	}

	pickRandomIndices(count) {
		const available = Array.from(
			{ length: this.targets.length },
			(_, i) => i,
		);
		const picked = [];

		for (let i = 0; i < count && available.length > 0; i++) {
			const j = Math.floor(Math.random() * available.length);
			picked.push(available[j]);
			available.splice(j, 1);
		}

		return picked;
	}

	destroy() {
		this.abortController.abort();
		super.destroy();
	}
}
