import ComponentCore from '@/components/_core/ComponentCore';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(SplitText);

export default class ButtonHover extends ComponentCore {
	constructor() {
		super();
		this.handleMouseMove = this.handleMouseMove.bind(this);
		this.handleMouseLeave = this.handleMouseLeave.bind(this);
		this.init();
	}

	createElements() {
		this.items = [...document.querySelectorAll('.btn_main_wrap')].map(
			(btn) => {
				const text = btn.querySelector('.btn_main_text');
				const textHover = btn.querySelector('.btn_main_text.is-abs');
				const splitText = new SplitText(text, {
					type: 'chars',
					smartWrap: true,
				});
				const splitHover = new SplitText(textHover, {
					type: 'chars',
					smartWrap: true,
				});

				gsap.set(textHover, { opacity: 1, y: 0, filter: 'none' });

				const defaultWidth = btn.offsetWidth;
				const hoverWidth =
					textHover.scrollWidth + (defaultWidth - text.scrollWidth);

				const tl = gsap.timeline({
					paused: true,
					defaults: { ease: 'back.out(1.2)' },
					onReverseComplete: () =>
						gsap.set(btn, { clearProps: 'width,scale' }),
				});

				tl.to(
					btn,
					{
						width: hoverWidth,
						scale: 1.05,
						duration: 0.3,
						ease: 'power2.out',
					},
					0,
				);
				tl.to(
					splitText.chars,
					{
						yPercent: -100,
						opacity: 0,
						filter: 'blur(4px)',
						duration: 0.25,
						stagger: { amount: 0.1, from: 'random' },
					},
					0,
				);
				tl.fromTo(
					splitHover.chars,
					{ yPercent: 100, opacity: 0, filter: 'blur(4px)' },
					{
						yPercent: 0,
						opacity: 1,
						filter: 'blur(0px)',
						duration: 0.25,
						stagger: { amount: 0.1, grid: [10, 5] },
					},
					0.1,
				);

				return { btn, tl };
			},
		);
	}

	addEventListeners() {
		this.items.forEach(({ btn }) => {
			btn.addEventListener('mouseover', this.handleMouseMove);
			btn.addEventListener('mouseleave', this.handleMouseLeave);
		});
	}

	removeEventListeners() {
		this.items.forEach(({ btn }) => {
			btn.removeEventListener('mouseover', this.handleMouseMove);
			btn.removeEventListener('mouseleave', this.handleMouseLeave);
		});
	}

	handleMouseMove(e) {
		const item = this.items.find((i) => i.btn === e.currentTarget);
		if (!item) return;
		item.tl.timeScale(1).play();
	}

	handleMouseLeave(e) {
		const item = this.items.find((i) => i.btn === e.currentTarget);
		if (!item) return;
		item.tl.timeScale(1.4).reverse();
	}
}
