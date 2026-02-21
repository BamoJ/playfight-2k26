import ComponentCore from '@/components/_core/ComponentCore';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(SplitText);

export default class LinkHover extends ComponentCore {
	constructor() {
		super();
		this.handleMouseEnter = this.handleMouseEnter.bind(this);
		this.handleMouseLeave = this.handleMouseLeave.bind(this);
		this.init();
	}

	createElements() {
		const links = [
			...document.querySelectorAll('[data-anim-link-hover]'),
		];
		if (!links.length) return;

		this.items = links.map((link) => {
			const split = new SplitText(link, {
				type: 'chars',
				smartWrap: true,
			});

			const tl = gsap.timeline({ paused: true });

			tl.to(split.chars, {
				y: '-1.3em',
				rotate: 0.001,
				duration: 0.6,
				ease: 'power3.out',
				stagger: { amount: 0.1, from: 'random' },
			});

			return { link, tl, split };
		});
	}

	addEventListeners() {
		if (!this.items) return;
		this.items.forEach(({ link }) => {
			link.addEventListener('mouseenter', this.handleMouseEnter);
			link.addEventListener('mouseleave', this.handleMouseLeave);
		});
	}

	removeEventListeners() {
		if (!this.items) return;
		this.items.forEach(({ link }) => {
			link.removeEventListener('mouseenter', this.handleMouseLeave);
			link.removeEventListener('mouseleave', this.handleMouseLeave);
		});
	}

	handleMouseEnter(e) {
		const item = this.items.find((i) => i.link === e.currentTarget);
		if (!item) return;
		item.tl.timeScale(1).play();
	}

	handleMouseLeave(e) {
		const item = this.items.find((i) => i.link === e.currentTarget);
		if (!item) return;
		item.tl.timeScale(1.4).reverse();
	}
}
