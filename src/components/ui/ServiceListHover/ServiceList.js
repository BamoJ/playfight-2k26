import ComponentCore from '@/components/_core/ComponentCore';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';

export default class ServiceList extends ComponentCore {
	constructor() {
		super();
		this.init();
	}

	createElements() {
		this.container = document.querySelector(
			'[data-service-hover="container"]',
		);
		if (!this.container) return;

		this.img = this.container.querySelectorAll(
			'[data-service-hover="visual"]',
		);
		this.imgText = this.container.querySelectorAll(
			'[data-service-hover="visual-text"]',
		);
		this.textBold = this.container.querySelectorAll(
			'[data-service-hover="text-bold"]',
		);
		this.dots = this.container.querySelectorAll(
			'[data-service-hover="dots"]',
		);
		this.textMain = this.container.querySelectorAll(
			'[data-service-hover="text-main"]',
		);
		this.textBig = this.container.querySelectorAll(
			'[data-service-hover="text-big"]',
		);
		this.trigger = this.container.querySelectorAll('.service_item');

		this.items = [];

		this.trigger.forEach((trigger, i) => {
			gsap.set(this.textBold[i], { y: '0%' });
			gsap.set(this.textBig[i], { y: '0%' });

			const splitMain = new SplitText(this.textMain[i], {
				type: 'chars, words',
				mask: 'chars',
			});
			const splitBold = new SplitText(this.textBold[i], {
				type: 'chars, words',
				mask: 'chars',
			});
			const splitBig = new SplitText(this.textBig[i], {
				type: 'chars, words',
				mask: 'chars',
			});
			const splitVisualText = new SplitText(this.imgText[i], {
				type: 'chars, words',
				mask: 'chars',
			});

			gsap.set(splitBold.chars, { yPercent: 110 });
			gsap.set(splitBig.chars, { yPercent: 110 });

			this.items.push({
				trigger,
				splitMain,
				splitBold,
				splitBig,
				splitVisualText,
				visual: this.img[i],
				dots: this.dots[i],
			});
		});

		this.createTimelines();
	}

	createTimelines() {
		this.items.forEach((item) => {
			const tl = gsap.timeline({ paused: true });

			tl.to(
				item.splitMain.chars,
				{
					yPercent: -120,
					duration: 0.5,
					ease: 'power3.out',
					stagger: { amount: 0.2, from: 'random' },
				},
				0,
			);

			tl.to(
				item.splitBold.chars,
				{
					yPercent: 0,
					duration: 0.5,
					ease: 'power3.out',
					stagger: { amount: 0.2, from: 'random' },
				},
				0.05,
			);

			tl.to(
				item.splitBig.chars,
				{
					yPercent: 0,
					duration: 0.4,
					ease: 'power3.out',
					stagger: { amount: 0.1, from: 'random' },
				},
				0.05,
			);

			tl.to(
				item.dots,
				{ scale: 1, duration: 1, ease: 'power2.out' },
				0,
			);

			tl.to(
				item.visual,
				{
					clipPath: 'inset(0 0% 0 0)',
					duration: 0.8,
					ease: 'power3.inOut',
				},
				0,
			);

			tl.fromTo(
				item.splitVisualText.chars,
				{ yPercent: 100, visibility: 'visible' },
				{
					yPercent: 0,
					duration: 0.4,
					ease: 'power3.out',
					stagger: { amount: 0.2 },
				},
				0.1,
			);

			item.tl = tl;
		});
	}

	createEvents() {
		this.onEnter = (e) => {
			const item = this.items.find(
				(i) => i.trigger === e.currentTarget,
			);
			if (item) item.tl.restart();
		};

		this.onLeave = (e) => {
			const item = this.items.find(
				(i) => i.trigger === e.currentTarget,
			);
			if (item) item.tl.pause().progress(0);
		};
	}

	addEventListeners() {
		this.items.forEach((item) => {
			item.trigger.addEventListener('mouseenter', this.onEnter);
			item.trigger.addEventListener('mouseleave', this.onLeave);
		});
	}

	removeEventListeners() {
		this.items.forEach((item) => {
			item.trigger.removeEventListener('mouseenter', this.onEnter);
			item.trigger.removeEventListener('mouseleave', this.onLeave);
		});
	}
}
