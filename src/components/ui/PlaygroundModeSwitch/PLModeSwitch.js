import ComponentCore from '@/components/_core/ComponentCore';
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';

export default class PLModeSwitch extends ComponentCore {
	constructor() {
		super();
		this.currentMode = '10';
		this.init();
	}

	createElements() {
		this.container = document.querySelector(
			'[data-pl-mode="container"]',
		);
		if (!this.container) return;
		this.grid = this.container.querySelector('[data-pl-mode="grid"]');
		this.button4grid = this.container.querySelector(
			'[data-pl-mode="button-4"]',
		);
		this.button10grid = this.container.querySelector(
			'[data-pl-mode="button-10"]',
		);
		this.cardItem = this.container.querySelectorAll(
			'[data-pl-mode="card-item"]',
		);
	}

	switchMode(mode) {
		if (mode === this.currentMode) return;

		const state = Flip.getState(this.cardItem, this.grid);

		this.grid.classList.remove('is-10-col', 'is-4-col');
		this.grid.classList.add(`is-${mode}-col`);
		this.currentMode = mode;

		Flip.from(state, {
			duration: 1.5,
			ease: 'expo.inOut',
			absoluteOnLeave: true,
			absolute: false,
			stagger: {
				amount: 0.9,
			},
		});

		gsap.to(this.cardItem, {
			filter: 'blur(10px)',
			duration: 0.4,
			yoyo: true,
			repeat: 1,
			ease: 'sine.out',
			delay: 0.4,
		});
	}

	addEventListeners() {
		if (!this.container) return;
		this._on4 = () => this.switchMode('4');
		this._on10 = () => this.switchMode('10');
		this.button4grid.addEventListener('click', this._on4);
		this.button10grid.addEventListener('click', this._on10);
	}

	removeEventListeners() {
		if (!this.container) return;
		this.button4grid.removeEventListener('click', this._on4);
		this.button10grid.removeEventListener('click', this._on10);
	}
}
