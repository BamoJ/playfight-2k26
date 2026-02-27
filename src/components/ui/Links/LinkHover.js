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
			...document.querySelectorAll(
				'[data-anim-link-hover], [data-anim-main-link-hover] ',
			),
		];
		if (!links.length) return;

		this.items = links.map((link) => {
			const split = new SplitText(link, {
				type: 'chars',
				smartWrap: true,
			});

			const indices = Array.from(
				{ length: split.chars.length },
				(_, i) => i,
			);
			for (let i = indices.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[indices[i], indices[j]] = [indices[j], indices[i]];
			}
			split.chars.forEach((el, i) => {
				el.style.transitionDelay = `${indices[i] * 0.015}s`;
			});

			return { link, split };
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
			link.removeEventListener('mouseenter', this.handleMouseEnter);
			link.removeEventListener('mouseleave', this.handleMouseLeave);
		});
	}

	handleMouseEnter(e) {
		e.currentTarget.classList.add('is-hover');
	}

	handleMouseLeave(e) {
		e.currentTarget.classList.remove('is-hover');
	}
}
