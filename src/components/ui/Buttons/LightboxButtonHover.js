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
		this.items = [];
		this.init();
	}

	createElements() {
		this.items = [
			...document.querySelectorAll('.media_lightbox_btn_parent'),
		]
			.map((wrap) => {
				const pill = wrap.querySelector('.media_lightbox_btn_inner');
				const infoBlock = wrap.querySelector(
					'.media_lightbox_btn_info',
				);
				const iconBtn = wrap.querySelector(
					'.media_lightbox_btn_play_btn',
				);

				if (!pill || !infoBlock || !iconBtn) return null;

				const iconNextSibling = iconBtn.nextSibling;
				const pillDefaultW = pill.offsetWidth;
				const pillOrigPadR = parseFloat(
					getComputedStyle(pill).paddingRight,
				);

				gsap.set(pill, {
					height: pill.offsetHeight,
					width: pillDefaultW,
				});

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

				return {
					wrap,
					pill,
					infoBlock,
					iconBtn,
					iconNextSibling,
					pillDefaultW,
					pillOrigPadR,
					infoW,
					pillHoverW: pillDefaultW + infoW + iconBtn.offsetWidth,
					split,
					flipTween: null,
				};
			})
			.filter(Boolean);

		this.wraps = this.items.map((item) => item.wrap);
	}

	addEventListeners() {
		this.items.forEach(({ wrap }) => {
			wrap.addEventListener('mouseenter', this.handleEnter);
			wrap.addEventListener('mouseleave', this.handleLeave);
		});
	}

	removeEventListeners() {
		this.items.forEach(({ wrap }) => {
			wrap.removeEventListener('mouseenter', this.handleEnter);
			wrap.removeEventListener('mouseleave', this.handleLeave);
		});
	}

	getItem(wrap) {
		return this.items.find((item) => item.wrap === wrap);
	}

	killMotion(item) {
		if (!item) return;

		item.flipTween?.kill();
		gsap.set(item.iconBtn, { clearProps: 'transform' });
		gsap.killTweensOf(item.pill);
		gsap.killTweensOf(item.infoBlock);
		gsap.killTweensOf(item.split.chars);
	}

	moveIcon(item, targetParent, beforeNode = null) {
		if (!item || item.iconBtn.parentNode === targetParent) return;

		item.flipTween?.kill();

		const state = Flip.getState(item.iconBtn);

		if (beforeNode) {
			targetParent.insertBefore(item.iconBtn, beforeNode);
		} else {
			targetParent.appendChild(item.iconBtn);
		}

		item.flipTween = Flip.from(state, {
			duration: 0.4,
			ease: 'power2.out',
			overwrite: true,
		});
	}

	handleEnter(e) {
		const item = this.getItem(e.currentTarget);
		if (!item) return;

		this.killMotion(item);

		gsap.to(item.pill, {
			width: item.pillHoverW,
			paddingRight: 10,
			duration: 0.5,
			ease: 'power2.out',
			overwrite: true,
		});

		gsap.to(item.infoBlock, {
			width: item.infoW,
			opacity: 1,
			duration: 0.5,
			ease: 'power2.out',
			overwrite: true,
			delay: 0.05,
		});

		gsap.to(item.split.chars, {
			yPercent: 0,
			opacity: 1,
			filter: 'blur(0px)',
			duration: 0.3,
			stagger: { amount: 0.12, grid: [10, 5] },
			overwrite: true,
		});

		this.moveIcon(item, item.pill);
	}

	handleLeave(e) {
		const item = this.getItem(e.currentTarget);
		if (!item) return;

		this.killMotion(item);

		gsap.to(item.split.chars, {
			yPercent: 100,
			opacity: 0,
			filter: 'blur(4px)',
			duration: 0.2,
			stagger: { amount: 0.01, from: 'center' },
			overwrite: true,
		});

		gsap.to(item.infoBlock, {
			width: 0,
			opacity: 0,
			duration: 0.3,
			ease: 'sine.out',
			overwrite: true,
		});

		gsap.to(item.pill, {
			width: item.pillDefaultW,
			paddingRight: item.pillOrigPadR,
			duration: 0.3,
			ease: 'sine.out',
			overwrite: true,
			delay: 0,
		});

		this.moveIcon(item, item.wrap, item.iconNextSibling || null);
	}

	destroy() {
		super.destroy();

		this.items.forEach((item) => {
			this.killMotion(item);
			item.split?.revert();
		});

		this.items = [];
		this.wraps = [];
	}
}
