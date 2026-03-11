import ComponentCore from '@/components/_core/ComponentCore';
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';

export default class PLModeSwitch extends ComponentCore {
	constructor() {
		super();
		this.currentMode = '4';
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

		const isTo4 = mode === '4';

		Flip.from(state, {
			duration: isTo4 ? 1.3 : 1,
			ease: 'expo.inOut',
			absoluteOnLeave: true,
			absolute: false,
			stagger: {
				amount: isTo4 ? 0.9 : 0.5,
				from: isTo4 ? 'center' : 'start',
			},
		});
		gsap.to(this.cardItem, {
			filter: 'blur(10px)',
			duration: isTo4 ? 1 : 0.4,
			yoyo: true,
			repeat: 1,
			ease: isTo4 ? 'sine.in' : 'sine.inOut',
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
