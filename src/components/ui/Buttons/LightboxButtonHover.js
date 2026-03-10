import ComponentCore from '@/components/_core/ComponentCore';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { Flip } from 'gsap/Flip';

gsap.registerPlugin(SplitText, Flip);

export default class LightboxButtonHover extends ComponentCore {
	constructor() {
		super();
		this.handleEnter = this.handleEnter.bind(this);
		this.handleLeave = this.handleLeave.bind(this);
		this.init();
	}

	createElements() {
		this.wraps = document.querySelectorAll(
			'.media_lightbox_btn_parent',
		);

		this.wraps.forEach((wrap) => {
			const pill = wrap.querySelector('.media_lightbox_btn_inner');
			const infoBlock = wrap.querySelector(
				'.media_lightbox_btn_info',
			);
			const iconBtn = wrap.querySelector(
				'.media_lightbox_btn_play_btn',
			);

			if (!pill || !infoBlock || !iconBtn) return;

			wrap._iconNextSibling = iconBtn.nextSibling;

			const pillDefaultW = pill.offsetWidth;
			const pillOrigPadR = parseFloat(
				getComputedStyle(pill).paddingRight,
			);

			gsap.set(pill, { height: pill.offsetHeight });

			// Measure infoBlock natural width while hidden
			gsap.set(infoBlock, {
				display: 'flex',
				width: 'auto',
				visibility: 'hidden',
			});
			const infoW = infoBlock.offsetWidth + 1;
			gsap.set(infoBlock, {
				width: 0,
				opacity: 0,
				visibility: 'visible',
			});

			const split = new SplitText(infoBlock, {
				type: 'chars',
				smartWrap: true,
				mask: 'chars',
			});
			gsap.set(split.chars, {
				yPercent: 100,
				opacity: 0,
				filter: 'blur(4px)',
			});

			const pillHoverW = pillDefaultW + infoW + iconBtn.offsetWidth;

			// --- Enter timeline ---
			const tlIn = gsap.timeline({ paused: true });
			tlIn.to(
				pill,
				{
					width: pillHoverW,
					paddingRight: 0,
					duration: 0.5,
					ease: 'power2.out',
				},
				0,
			);
			tlIn.to(
				infoBlock,
				{
					width: infoW,
					opacity: 1,
					duration: 0.5,
					ease: 'power2.out',
				},
				0.05,
			);
			tlIn.fromTo(
				split.chars,
				{ yPercent: 100, opacity: 0, filter: 'blur(4px)' },
				{
					yPercent: 0,
					opacity: 1,
					filter: 'blur(0px)',
					duration: 0.2,
					stagger: { amount: 0.12, grid: [10, 5] },
				},
				0,
			);

			// --- Leave timeline ---
			const tlOut = gsap.timeline({ paused: true });
			tlOut.to(
				split.chars,
				{
					yPercent: 100,
					opacity: 0,
					filter: 'blur(4px)',
					duration: 0.2,
					stagger: { amount: 0.1, from: 'start' },
				},
				0,
			);
			tlOut.to(
				infoBlock,
				{
					width: 0,
					opacity: 0,
					duration: 0.4,
					ease: 'power3.out',
				},
				0,
			);
			tlOut.to(
				pill,
				{
					width: pillDefaultW,
					paddingRight: pillOrigPadR,
					duration: 0.4,
					ease: 'power3.out',
				},
				0,
			);

			wrap._tlIn = tlIn;
			wrap._tlOut = tlOut;
		});
	}

	addEventListeners() {
		this.wraps.forEach((wrap) => {
			wrap.addEventListener('mouseenter', this.handleEnter);
			wrap.addEventListener('mouseleave', this.handleLeave);
		});
	}

	removeEventListeners() {
		this.wraps.forEach((wrap) => {
			wrap.removeEventListener('mouseenter', this.handleEnter);
			wrap.removeEventListener('mouseleave', this.handleLeave);
		});
	}

	handleEnter(e) {
		const wrap = e.currentTarget;
		const pill = wrap.querySelector('.media_lightbox_btn_inner');
		const iconBtn = wrap.querySelector(
			'.media_lightbox_btn_play_btn',
		);

		wrap._tlOut?.pause(0);
		wrap._tlIn?.restart();

		const state = Flip.getState(iconBtn);
		pill.appendChild(iconBtn);
		Flip.from(state, {
			duration: 0.3,
			ease: 'power1.out',
		});
	}

	handleLeave(e) {
		const wrap = e.currentTarget;
		const iconBtn = wrap.querySelector(
			'.media_lightbox_btn_play_btn',
		);

		wrap._tlIn?.pause();
		wrap._tlOut?.restart();

		const state = Flip.getState(iconBtn);
		wrap.insertBefore(iconBtn, wrap._iconNextSibling || null);
		Flip.from(state, {
			duration: 0.3,
			ease: 'power1.out',
		});
	}

	destroy() {
		this.wraps.forEach((wrap) => {
			if (wrap._tlIn) {
				wrap._tlIn.kill();
				wrap._tlIn = null;
			}
			if (wrap._tlOut) {
				wrap._tlOut.kill();
				wrap._tlOut = null;
			}

			const pill = wrap.querySelector('.media_lightbox_btn_inner');
			const infoBlock = wrap.querySelector(
				'.media_lightbox_btn_info',
			);
			const iconBtn = wrap.querySelector(
				'.media_lightbox_btn_play_btn',
			);

			if (iconBtn) {
				gsap.killTweensOf(iconBtn);
				if (wrap._iconNextSibling && iconBtn.parentNode !== wrap) {
					wrap.insertBefore(iconBtn, wrap._iconNextSibling);
				}
			}
			if (pill) gsap.set(pill, { clearProps: 'all' });
			if (infoBlock) gsap.set(infoBlock, { clearProps: 'all' });
		});
		super.destroy();
	}
}
