import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import gsap from 'gsap';
import AnimationCore from '@animations/_core/AnimationCore';
import Lottie from 'lottie-web/build/player/lottie_light';

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin);

export default class AboutStoryScroll extends AnimationCore {
	constructor(element, options = {}) {
		super(element, {
			triggerStart: 'top bottom',
			triggerEnd: 'bottom +=50%',
			scrub: 1,
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
		this.crftText = this.textElementWrap.querySelectorAll(
			'.el_crft [data-el="crft"]',
		);

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

		/** CRTV */
		this.crtvText =
			this.textElementWrap.querySelectorAll('.el_crtv div');

		// EL PF LOGO //
		this.pfTxt = document.querySelector('.elf_pf_txt');
		this.pfR = this.textElementWrap.querySelector('.el_r_txt');

		/** CREATIVE PROD */
		this.creativeProdTxt = this.textElementWrap.querySelectorAll(
			'.el_creative_prod_post div',
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

		/** Easing for scramble + move animations */

		const scrambleMoveEase = 'elastic.out(1,0.7)';

		/* ==============================================
		 *
		 *   PARAGRAPH LINES — move + fade in + blur out
		 *
		 * ============================================== */

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
						each: 0.15,
					},
					ease: 'elastic.inOut(0.4,1.0)',
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
						each: 0.15,
					},
					duration: 2,
					ease: 'none',
				},
				0,
			);

		/* ==============================================
		 *
		 *   CRFT — scramble + move
		 *
		 * ============================================== */
		this.timeline
			.to(
				this.crftText,
				{
					scrambleText: (_, target) => ({
						text: target.textContent,
						chars: scrambleChars,
						tweenLength: false,
						speed: 0.8,
						rightToLeft: true,
					}),
					duration: 2,
					ease: 'none',
				},
				1.3,
			)
			.from(
				this.crftText,
				{
					x: '10vw',
					duration: 2,
					filter: 'blur(5px)',
					opacity: 0,
					ease: scrambleMoveEase,
					stagger: 0.1,
				},
				'<+.1',
			);

		/* ==============================================
		 *
		 *   PF LOGO — scramble + move
		 *
		 * ============================================== */
		if (this.pfTxt) {
			this.timeline
				.to(
					this.pfTxt,
					{
						scrambleText: (_, target) => ({
							text: target.textContent,
							chars: scrambleChars,
							tweenLength: false,
							speed: 0.85,
							rightToLeft: true,
						}),
						duration: 2,
						ease: 'none',
					},
					1,
				)
				.from(
					this.pfTxt,
					{
						x: '-5vw',
						duration: 2,
						opacity: 0,
						ease: scrambleMoveEase,
					},
					'<',
				);
		}

		/* ==============================================
		 *
		 *   NUMBER — scramble + move
		 *
		 * ============================================== */
		this.timeline
			.to(
				this.scrambledNumber,
				{
					scrambleText: (_, target) => ({
						text: target.textContent,
						chars: scrambleChars,
						tweenLength: false,
						speed: 0.8,
					}),
					duration: 3,
				},
				1.9,
			)
			.from(
				this.scrambledNumber,
				{
					x: '15vw',
					filter: 'blur(5px)',
					duration: 2,
					opacity: 0.3,
					ease: scrambleMoveEase,
					stagger: 0.15,
				},
				'<+.2',
			);

		/* ==============================================
		 *
		 *   CRTV — scramble + move
		 *
		 * ============================================== */
		this.timeline
			.to(
				this.crtvText,
				{
					scrambleText: (_, target) => ({
						text: target.textContent,
						chars: scrambleChars,
						tweenLength: false,
						speed: 0.5,
						revealDelay: 1,
						rightToLeft: true,
					}),
					stagger: 0.1,
					duration: 3,
				},
				3.6,
			)
			.from(
				this.crtvText,
				{
					x: '-5vw',
					filter: 'blur(5px)',
					duration: 2,
					opacity: 0,
					ease: scrambleMoveEase,
					stagger: 0.1,
				},
				'<+.5',
			);

		/* ==============================================
		 *
		 *   KANJI — scramble + move
		 *
		 * ============================================== */
		if (this.kanjiScrambled.length) {
			this.timeline.to(
				this.kanjiScrambled,
				{
					scrambleText: (_, target) => ({
						text: target.textContent,
						chars: kanjiScrambleChars,
						tweenLength: false,
						speed: 1,
						revealDelay: 0.5,
						rightToLeft: true,
					}),
					duration: 2,
				},
				2.7,
			);
		}

		/* ==============================================
		 *
		 *   PF R — scramble + move
		 *
		 * ============================================== */
		if (this.pfR) {
			this.timeline
				.to(
					this.pfR,
					{
						scrambleText: (_, target) => ({
							text: target.textContent,
							chars: scrambleChars,
							tweenLength: false,
							speed: 0.8,
							rightToLeft: true,
						}),
						duration: 3,
					},
					4.6,
				)
				.from(
					this.pfR,
					{
						y: '15',
						duration: 2,
						opacity: 0,
						ease: scrambleMoveEase,
					},
					'<',
				);
		}

		/* ==============================================
		 *
		 *   CREATIVE PROD — scramble + move
		 *
		 * ============================================== */
		this.timeline
			.to(
				this.creativeProdTxt,
				{
					scrambleText: (_, target) => ({
						text: target.textContent,
						chars: scrambleChars,
						tweenLength: false,
						speed: 1,
						rightToLeft: true,
					}),
					stagger: 0.1,
					duration: 2,
				},
				4.2,
			)
			.from(
				this.creativeProdTxt,
				{
					x: '-10vw',
					filter: 'blur(5px)',
					duration: 2,
					opacity: 0,
					ease: scrambleMoveEase,
					stagger: 0.1,
				},
				'<+.4',
			);
	}

	destroy() {
		[
			this.crftText,
			this.crtvText,
			this.scrambledNumber,
			this.kanjiScrambled,
			this.creativeProdTxt,
			this.blinkingCursor,
			this.pfTxt,
			this.pfR,
		]
			.filter(Boolean)
			.forEach((el) =>
				gsap.set(el, { clearProps: 'transform,opacity,filter' }),
			);

		this.lottie?.destroy();
		super.destroy();
		if (this.split) this.split.revert();
	}
}
