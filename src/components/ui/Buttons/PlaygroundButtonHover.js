import ComponentCore from '@/components/_core/ComponentCore';
import { gsap } from 'gsap';

export default class PlaygroundButtonHover extends ComponentCore {
	constructor() {
		super();
		this.handleMouseEnter = this.handleMouseEnter.bind(this);
		this.handleMouseLeave = this.handleMouseLeave.bind(this);
		this.init();
	}

	createElements() {
		const buttons = document.querySelectorAll(
			'.playground_mode_switch_btn',
		);
		if (!buttons.length) return;
		this.items = [...buttons].map((btn) => {
			const recCenter = btn.querySelector(
				'.playground_mode_switch_rec_center',
			);
			const pgBtnSvg = btn.querySelector('.g_svg');
			const pgBtnSvgPath = pgBtnSvg?.querySelectorAll('rect');

			const tl = gsap.timeline({
				paused: true,
				defaults: { ease: 'power3.inOut', duration: 0.4 },
			});

			if (pgBtnSvgPath) {
				tl.to(
					pgBtnSvgPath,
					{
						scale: 0.0,
						transformOrigin: 'center center',
						stagger: {
							amount: 0.1,
							from: 'start',
						},
					},
					0,
				);
			}
			if (recCenter) {
				tl.to(
					recCenter,
					{ scale: 1, transformOrigin: 'center center' },
					0,
				);
			}

			return { btn, tl };
		});
	}

	addEventListeners() {
		if (!this.items) return;
		this.items.forEach(({ btn }) => {
			btn.addEventListener('mouseenter', this.handleMouseEnter);
			btn.addEventListener('mouseleave', this.handleMouseLeave);
		});
	}

	removeEventListeners() {
		if (!this.items) return;
		this.items.forEach(({ btn }) => {
			btn.removeEventListener('mouseenter', this.handleMouseEnter);
			btn.removeEventListener('mouseleave', this.handleMouseLeave);
		});
	}

	handleMouseEnter(e) {
		const item = this.items.find((i) => i.btn === e.currentTarget);
		if (!item) return;
		item.tl.timeScale(1).play();
	}

	handleMouseLeave(e) {
		const item = this.items.find((i) => i.btn === e.currentTarget);
		if (!item) return;
		item.tl.timeScale(1.4).reverse();
	}

	destroy() {
		super.destroy();
	}
}
