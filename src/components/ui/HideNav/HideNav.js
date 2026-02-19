import ComponentCore from '@components/_core/ComponentCore';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default class HideNav extends ComponentCore {
	constructor() {
		super();
		this.navbar = null;
		this.navSVG = null;
		this.navBtnLine = null;
		this.footerTrigger = null;
		this._st = null;
		this.init();
	}

	createElements() {
		this.navbar = document.querySelector(
			'[data-nav-hide="component"]',
		);
		if (!this.navbar) return;
		this.navSVG = this.navbar.querySelector('[data-nav-hide="svg"]');
		this.navBtnLine = this.navbar.querySelectorAll(
			'.nav_button_line',
		);
		this.footerTrigger = document.querySelector('[data-footer]');
	}

	createEvents() {
		if (!this.navbar || !this.footerTrigger) return;
		this._buildTrigger();
	}

	addEventListeners() {}
	removeEventListeners() {}

	_hide() {
		if (this.navBtnLine && this.navBtnLine.length) {
			gsap.to(this.navBtnLine, {
				xPercent: 100,
				duration: 0.4,
				stagger: 0.1,
				ease: 'power4.out',
			});
		}
		if (this.navSVG) {
			gsap.to(this.navSVG.querySelectorAll('path'), {
				yPercent: -150,
				duration: 0.5,
				ease: 'power4.out',
				stagger: { from: 'random', amount: 0.25 },
			});
		}
	}

	_show() {
		if (this.navBtnLine && this.navBtnLine.length) {
			gsap.to(this.navBtnLine, {
				xPercent: 0,
				duration: 0.5,
				stagger: 0.08,
				ease: 'power4.out',
			});
		}
		if (this.navSVG) {
			gsap.to(this.navSVG.querySelectorAll('path'), {
				yPercent: 0,
				duration: 0.9,
				ease: 'power4.out',
				stagger: { from: 'random', amount: 0.25 },
			});
		}
	}

	_buildTrigger() {
		this._st = ScrollTrigger.create({
			trigger: this.footerTrigger,
			start: 'top 5%',
			markers: false,
			onEnter: () => this._hide(),
			onLeaveBack: () => this._show(),
		});
	}

	destroy() {
		if (this._st) {
			this._st.kill();
			this._st = null;
		}
		if (this.navBtnLine && this.navBtnLine.length) {
			gsap.killTweensOf(this.navBtnLine);
			gsap.set(this.navBtnLine, { clearProps: 'all' });
		}
		if (this.navSVG) {
			const paths = this.navSVG.querySelectorAll('path');
			gsap.killTweensOf(paths);
			gsap.set(paths, { clearProps: 'all' });
		}
		super.destroy();
	}
}
