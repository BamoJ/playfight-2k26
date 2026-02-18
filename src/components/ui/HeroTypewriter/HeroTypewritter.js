import ComponentCore from '@components/_core/ComponentCore';
import { gsap } from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin';

gsap.registerPlugin(TextPlugin);

export default class HeroTypewriter extends ComponentCore {
	constructor() {
		super();

		this.texts = [
			'Human',
			'For Adventure.',
			'Nice.',
			'Fun.',
			'A Bit Crazy.',
			'For People.',
		];

		this.init();
	}

	createElements() {
		this.container = document.querySelector('.hero_typewrite');
		if (!this.container) return;
		this.text = this.container.querySelector('.hero_typewrite_text');
		this.cursor = this.container.querySelector('.hero_blinking_cursor');
	}

	createEvents() {
		if (!this.container) return;
		this.typewriterInit();
	}

	typewriterInit() {
		let index = 0;

		const next = () => {
			const current = this.texts[index];

			gsap
				.timeline({
					onComplete: next,
				})
				.to(this.text, {
					text: current,
					duration: current.length * 0.07,
				})
				.to(this.text, { duration: 0.8, ease: 'none' })
				.to(this.text, {
					text: '',
					duration: current.length * 0.04,
				});

			index = (index + 1) % this.texts.length;
		};

		next();
	}
}
