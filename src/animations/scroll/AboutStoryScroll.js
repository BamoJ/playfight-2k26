import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import gsap from 'gsap';
import AnimationCore from '@animations/_core/AnimationCore';
import Lottie from 'lottie-web';

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin);

export default class AboutStoryScroll extends AnimationCore {
	constructor(element, options = {}) {
		super(element, {
			triggerStart: 'top bottom',
			triggerEnd: 'bottom +=50%',
			scrub: 1,
			markers: true,
			cleanup: false,
		});
	}

	createElements() {
		this.para = this.element
			.querySelector('[data-anim-about-scroll="para"]')
			.querySelector('.g_paragraph');
		this.signatureContainer = this.element.querySelector(
			'[data-anim-about-scroll="lottie"]',
		);

		const paraLines = this.para.querySelectorAll('p');
		this.split = new SplitText(paraLines, {
			type: 'lines',
		});

		/**
		 * LOTTIE SIGNATURE ANIMATION
		 * - Lottie animation is controlled via GSAP timeline (play, pause, etc.)
		 * - Lottie anim is set to autoplay: false and loop: false in JSON export
		 */
		this.lottie = Lottie.loadAnimation({
			container: this.signatureContainer, // the dom element that will contain the animation
			renderer: 'svg',
			loop: false,
			autoplay: false,
			path: 'https://cdn.prod.website-files.com/697fef4d1b1e73b328ad49cd/69a7036b2157751d656eb83c_3.2.json',
		});

		/** CRFT */
		this.textElementWrap = document.querySelector(
			'.about_story_elements',
		);
		this.crftText = this.textElementWrap.querySelector('.el_crft');

		/** Blinking Cursor */
		this.blinkingCursor = this.textElementWrap.querySelector(
			'.blinking_cursor',
		);

		/** Scarambled Number */
		this.scrambledNumber =
			this.textElementWrap.querySelector('.el_num_txt');

		/** Kanji */
		this.kanji = this.textElementWrap.querySelector(
			'.el_kanji_parent',
		);
		this.kanjiScrambled = this.textElementWrap.querySelectorAll(
			'[data-el-kanji-scrambled]',
		);
	}

	createScrollTrigger() {
		const triggerEl = this.triggerElement || this.element;
		this.scrollTrigger = ScrollTrigger.create({
			trigger: triggerEl,
			start: this.options.triggerStart,
			end: this.options.triggerEnd,
			animation: this.timeline,
			scrub: this.options.scrub,
			markers: this.options.markers,
			onUpdate: (self) => {
				if (!this.lottie.totalFrames) return;
				const start = 0.8;
				const progress = Math.max(
					0,
					(self.progress - start) / (1 - start),
				);
				const frame = Math.min(
					Math.round(progress * this.lottie.totalFrames),
					this.lottie.totalFrames - 1,
				);
				this.lottie.goToAndStop(frame, true);
			},
		});
	}

	animate() {
		const scrambleChars = '!@#$%^&*()_+{}|:<>?-=[];,./©®';
		const kanjiScrambleChars = '∆◊≈†‡§¶•ΩΣπ∂ƒ©®™≠±÷×∞µ√∫≤≥';

		gsap.set(this.split.lines, {
			x: '-15vw',
			opacity: 0.2,
			filter: 'blur(5px)',
			willChange: 'transform, opacity, filter',
		});

		this.timeline
			.to(
				this.split.lines,
				{
					x: 0,
					stagger: {
						from: 'start',
						each: 0.1,
					},
					ease: 'elastic.inOut(0.3,1.0)',
					duration: 2,
				},
				0,
			)
			.to(
				this.split.lines,
				{
					opacity: 1,
					filter: 'blur(0px)',
					stagger: {
						from: 'start',
						each: 0.1,
					},
					duration: 2,
					ease: 'none',
				},
				0,
			);

		// Ornament elements
		const ornaments = [
			this.crftText,
			this.blinkingCursor,
			this.scrambledNumber,
			this.kanji,
		].filter(Boolean);

		this.crftOriginalText = this.crftText?.textContent || '';
		this.numberOriginalText = this.scrambledNumber?.textContent || '';
		this.kanjiOriginalTexts = [...this.kanjiScrambled].map(
			(el) => el.textContent || '',
		);

		const staggerOffset = 0.5;

		ornaments.forEach((el, i) => {
			const pos = i * staggerOffset + (el === this.kanji ? 0.5 : 0);

			// ScrambleText on CRFT
			if (el === this.crftText) {
				this.timeline.to(
					el,
					{
						scrambleText: {
							text: this.crftOriginalText,
							chars: scrambleChars,
							speed: 2,
							revealDelay: 0.5,
							rightToLeft: true,
						},
						duration: 1,
					},
					pos,
				);
			}

			// ScrambleText on the number element
			if (el === this.scrambledNumber) {
				this.timeline.to(
					el,
					{
						scrambleText: {
							text: this.numberOriginalText,
							chars: scrambleChars,
							speed: 1,
							revealDelay: 0.9,
						},
						duration: 1,
					},
					pos,
				);
			}

			// ScrambleText on the kanji elements
			if (el === this.kanji && this.kanjiScrambled.length) {
				this.kanjiScrambled.forEach((kanjiEl, ki) => {
					this.timeline.to(
						kanjiEl,
						{
							scrambleText: {
								text: this.kanjiOriginalTexts[ki],
								chars: kanjiScrambleChars,
								speed: 1,
								revealDelay: 0.5,
								rightToLeft: true,
							},
							duration: 1,
						},
						pos,
					);
				});
			}
		});
	}

	destroy() {
		[this.crftText, this.blinkingCursor, this.scrambledNumber, this.kanji]
			.filter(Boolean)
			.forEach((el) =>
				gsap.set(el, { clearProps: 'transform,opacity,filter' }),
			);

		this.lottie?.destroy();
		super.destroy();
		if (this.split) this.split.revert();
	}
}
