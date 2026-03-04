// import { gsap } from 'gsap';
// import { ScrollTrigger } from 'gsap/ScrollTrigger';
// import { SplitText } from 'gsap/SplitText';
// import AnimationCore from '@animations/_core/AnimationCore';

// gsap.registerPlugin(ScrollTrigger, SplitText);

// export default class ServiceListScroll extends AnimationCore {
// 	constructor(element, options = {}) {
// 		super(element, {
// 			cleanup: false,
// 			scrub: 1,
// 			triggerStart: 'top 50%',
// 			triggerEnd: 'bottom 50%',
// 			markers: false,
// 			...options,
// 		});

// 		this.items = [];
// 	}

// 	createElements() {
// 		const img = this.element.querySelectorAll(
// 			'[data-service-hover="visual"]',
// 		);
// 		const imgText = this.element.querySelectorAll(
// 			'[data-service-hover="visual-text"]',
// 		);
// 		const textBold = this.element.querySelectorAll(
// 			'[data-service-hover="text-bold"]',
// 		);
// 		const dots = this.element.querySelectorAll(
// 			'[data-service-hover="dots"]',
// 		);
// 		const textMain = this.element.querySelectorAll(
// 			'[data-service-hover="text-main"]',
// 		);
// 		const textBig = this.element.querySelectorAll(
// 			'[data-service-hover="text-big"]',
// 		);
// 		const triggers = this.element.querySelectorAll('.service_item');

// 		triggers.forEach((trigger, i) => {
// 			const item = {
// 				trigger,
// 				textMain: textMain[i],
// 				textBold: textBold[i],
// 				textBig: textBig[i],
// 				imgText: imgText[i],
// 				visual: img[i],
// 				dots: dots[i],
// 			};

// 			this.initItem(item);

// 			// First item: set to revealed state via gsap.set
// 			if (i === 0) {
// 				gsap.set(item.splitMain.chars, { yPercent: -120 });
// 				gsap.set(item.splitBold.chars, { yPercent: 0 });
// 				gsap.set(item.splitBig.chars, { yPercent: 0 });
// 				gsap.set(item.dots, { scale: 1 });
// 				gsap.set(item.visual, { clipPath: 'inset(0 0% 0 0)' });
// 				gsap.set(item.splitVisualText.chars, {
// 					yPercent: 0,
// 					visibility: 'visible',
// 				});
// 			}

// 			this.items.push(item);
// 		});
// 	}

// 	initItem(item) {
// 		gsap.set(item.textBold, { y: '0%' });
// 		gsap.set(item.textBig, { y: '0%' });

// 		item.splitMain = new SplitText(item.textMain, {
// 			type: 'chars, words',
// 			mask: 'chars',
// 		});
// 		item.splitBold = new SplitText(item.textBold, {
// 			type: 'chars, words',
// 			mask: 'chars',
// 		});
// 		item.splitBig = new SplitText(item.textBig, {
// 			type: 'chars, words',
// 			mask: 'chars',
// 		});
// 		item.splitVisualText = new SplitText(item.imgText, {
// 			type: 'chars, words',
// 			mask: 'words',
// 		});

// 		gsap.set(item.splitBold.chars, { yPercent: 110 });
// 		gsap.set(item.splitBig.chars, { yPercent: 110 });
// 	}

// 	addEnter(item, position) {
// 		this.timeline.to(
// 			item.splitMain.chars,
// 			{
// 				yPercent: -120,
// 				duration: 0.5,
// 				ease: 'none',
// 				stagger: { amount: 0.2 },
// 			},
// 			position,
// 		);

// 		this.timeline.to(
// 			item.splitBold.chars,
// 			{
// 				yPercent: 0,
// 				duration: 0.5,
// 				ease: 'none',
// 				stagger: { amount: 0.2 },
// 			},
// 			position + 0.05,
// 		);

// 		this.timeline.to(
// 			item.splitBig.chars,
// 			{
// 				yPercent: 0,
// 				duration: 0.6,
// 				ease: 'none',
// 				stagger: { amount: 0.2, from: 'start' },
// 			},
// 			position + 0.05,
// 		);

// 		this.timeline.to(
// 			item.dots,
// 			{ scale: 1, duration: 0.75, ease: 'none' },
// 			position,
// 		);

// 		this.timeline.to(
// 			item.visual,
// 			{
// 				clipPath: 'inset(0 0% 0 0)',
// 				duration: 0.8,
// 				ease: 'none',
// 			},
// 			position,
// 		);

// 		this.timeline.fromTo(
// 			item.splitVisualText.words,
// 			{ yPercent: 100, visibility: 'visible' },
// 			{
// 				yPercent: 0,
// 				duration: 0.4,
// 				ease: 'none',
// 				stagger: { amount: 0.3 },
// 			},
// 			position + 0.1,
// 		);
// 	}

// 	addLeave(item, position) {
// 		this.timeline.to(
// 			item.splitMain.chars,
// 			{
// 				yPercent: 0,
// 				duration: 0.4,
// 				ease: 'none',
// 				stagger: { amount: 0.15 },
// 			},
// 			position,
// 		);

// 		this.timeline.to(
// 			item.splitBold.chars,
// 			{
// 				yPercent: 110,
// 				duration: 0.4,
// 				ease: 'none',
// 				stagger: { amount: 0.1 },
// 			},
// 			position,
// 		);

// 		this.timeline.to(
// 			item.splitBig.chars,
// 			{
// 				yPercent: 110,
// 				duration: 0.4,
// 				ease: 'none',
// 				stagger: { amount: 0.2, from: 'end' },
// 			},
// 			position,
// 		);

// 		this.timeline.to(
// 			item.dots,
// 			{ scale: 0, duration: 0.3, ease: 'none' },
// 			position,
// 		);

// 		this.timeline.to(
// 			item.visual,
// 			{
// 				clipPath: 'inset(0 100% 0 0)',
// 				duration: 0.5,
// 				ease: 'none',
// 			},
// 			position,
// 		);

// 		this.timeline.to(
// 			item.splitVisualText.chars,
// 			{
// 				yPercent: 100,
// 				duration: 0.3,
// 				ease: 'none',
// 				stagger: { amount: 0.23 },
// 			},
// 			position,
// 		);
// 	}

// 	createTimeline() {
// 		this.timeline = gsap.timeline({ paused: true });

// 		const enterDur = 1;
// 		const leaveDur = 0.5;

// 		for (let i = 1; i < this.items.length; i++) {
// 			const pos = (i - 1) * (enterDur + leaveDur);

// 			// Leave previous item
// 			this.addLeave(this.items[i - 1], pos);

// 			// Enter current item (slight overlap with leave)
// 			this.addEnter(this.items[i], pos + leaveDur * 0.5);
// 		}
// 	}

// 	createScrollTrigger() {
// 		const count = this.items.length;
// 		if (count < 2) return;

// 		this.scrollTrigger = ScrollTrigger.create({
// 			trigger: this.element,
// 			start: this.options.triggerStart,
// 			end: this.options.triggerEnd,
// 			animation: this.timeline,
// 			scrub: this.options.scrub,
// 			markers: this.options.markers,
// 			snap: {
// 				snapTo: 1 / (count - 1),
// 				duration: { min: 0.2, max: 0.4 },
// 				ease: 'power2.out',
// 				delay: 0.1,
// 				inertia: true,
// 			},
// 		});
// 	}

// 	animate() {}

// 	destroy() {
// 		super.destroy();
// 		this.items = [];
// 	}
// }
