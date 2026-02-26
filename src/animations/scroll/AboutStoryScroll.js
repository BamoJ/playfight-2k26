import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { Flip } from 'gsap/Flip';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import gsap from 'gsap';
import AnimationCore from '@animations/_core/AnimationCore';

gsap.registerPlugin(
	ScrollTrigger,
	SplitText,
	Flip,
	ScrambleTextPlugin,
);

export default class AboutStoryScroll extends AnimationCore {
	constructor(element, options = {}) {
		super(element, {
			triggerStart: 'top bottom',
			triggerEnd: 'bottom +=80%',
			scrub: 1,
			markers: true,
			cleanup: false,
		});
	}

	createElements() {
		this.para = this.element.querySelector(
			'[data-anim-about-scroll="para"]',
		);
		this.signature = this.element.querySelector(
			'.about_story_signature',
		);

		/**
		 * Small Ornament ELements
		 */

		this.split = new SplitText(this.para, { type: 'words' });

		/**
		 * Small Ornament ELements
		 */

		/** CRFT */
		this.textElementWrap = document.querySelector(
			'.about_story_text_element',
		);
		this.crftText =
			this.textElementWrap.querySelector('.el_crft div');
		this.crftTargetFlip =
			this.textElementWrap.querySelector('.target_crft');

		/** Blinking Cursor */
		this.blinkingCursor = this.textElementWrap.querySelector(
			'.blinking_cursor',
		);
		this.blinkingCursorTargetFlip =
			this.textElementWrap.querySelector('.target_cursor');

		/** Scarambled Number */
		this.scrambledNumber =
			this.textElementWrap.querySelector('.el_num_txt');
		this.scrambledNumberTargetFlip =
			this.textElementWrap.querySelector('.target_num');

		/** Kanji */
		this.kanji = this.textElementWrap.querySelector(
			'.el_kanji_parent',
		);
		this.kanjiTargetFlip =
			this.textElementWrap.querySelector('.target_kanji');

		/** Store origin parents for destroy cleanup */
		this.crftOrigin = this.crftText?.parentElement;
		this.cursorOrigin = this.blinkingCursor?.parentElement;
		this.numberOrigin = this.scrambledNumber?.parentElement;
		this.kanjiOrigin = this.kanji?.parentElement;
	}

	animate() {
		gsap.set(this.split.words, {
			x: '-50vw',
			opacity: 0.1,
			filter: 'blur(4px)',
		});

		gsap.set(this.signature, { opacity: 0, x: -50 });

		this.timeline.to(
			this.split.words,
			{
				x: 0,
				opacity: 1,
				filter: 'blur(0px)',
				stagger: {
					from: 'start',
					each: 0.01,
				},
				ease: 'elastic.out(1, 0.8)',
			},
			0,
		);

		// Ornament Flip animations — each tied to a line block
		const ornaments = [
			{ el: this.crftText, target: this.crftTargetFlip },
			{
				el: this.blinkingCursor,
				target: this.blinkingCursorTargetFlip,
			},
			{
				el: this.scrambledNumber,
				target: this.scrambledNumberTargetFlip,
			},
			{ el: this.kanji, target: this.kanjiTargetFlip },
		];

		this.crftOriginalText = this.crftText?.textContent || '';
		this.numberOriginalText = this.scrambledNumber?.textContent || '';

		// Filter to only valid ornaments
		const validOrnaments = ornaments.filter(
			({ el, target }) => el && target,
		);
		const staggerOffset = 0.5;

		validOrnaments.forEach((ornament, i) => {
			const { el, target } = ornament;

			// Capture origin state FIRST (clean, no transforms applied)
			const state = Flip.getState(el);

			// Move element to target container
			target.append(el);

			// Set initial hidden state (after DOM move)
			gsap.set(el, { opacity: 0.5, filter: 'blur(4px)' });

			// Flip.from: animates from captured origin → current target position
			const flipTl = Flip.from(state, {
				scale: false,
				ease: 'power1.out',
				duration: 1,
			});

			// Stagger each ornament: 0, 0.5, 1.0, 1.5...
			const pos = (i * staggerOffset) / 1.2;

			this.timeline.add(flipTl, pos);
			this.timeline.to(
				el,
				{
					opacity: 1,
					filter: 'blur(0px)',
					duration: 1,
					ease: 'elastic.out(0.5, 1.3)',
				},
				pos,
			);

			// ScrambleText on CRFT
			if (el === this.crftText) {
				this.timeline.to(
					el,
					{
						scrambleText: {
							text: this.crftOriginalText,
							chars: '!@#$%^&*()_+{}|:<>?-=[];,./',
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
							chars: '@#$%^&*()_+{}|:<>?-=[];,./',
							speed: 1,
							revealDelay: 0.9,
						},
						duration: 1,
					},
					pos,
				);
			}
		});

		// Signature fade-in
		this.timeline.fromTo(
			this.signature,
			{
				opacity: 0,
				x: -50,
			},
			{
				opacity: 1,
				x: 0,
				ease: 'power2.out',
			},
			'>-0.4',
		);
	}

	destroy() {
		// Move ornaments back to their origin parents
		const ornamentPairs = [
			{ el: this.crftText, origin: this.crftOrigin },
			{ el: this.blinkingCursor, origin: this.cursorOrigin },
			{ el: this.scrambledNumber, origin: this.numberOrigin },
			{ el: this.kanji, origin: this.kanjiOrigin },
		];

		ornamentPairs.forEach(({ el, origin }) => {
			if (el && origin) {
				gsap.set(el, { clearProps: 'transform,opacity,filter' });
				origin.append(el);
			}
		});

		super.destroy();
		if (this.split) this.split.revert();
	}
}
