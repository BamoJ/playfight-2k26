import ComponentCore from '@component-core/ComponentCore';
import { MenuAnimations } from './MenuAnimation';
import SmoothScroll from '@utils/SmoothScroll';
import emitter from '@utils/Emitter';

export default class MenuComponent extends ComponentCore {
	constructor() {
		super();
		this.isOpen = false;
		this.scroll = new SmoothScroll();
		this.init();
	}

	createElements() {
		const menuNav = document.querySelector('.menu_nav_list');
		this.el = {
			menu: document.querySelector('[data-menu="menu"]'),
			container: document.querySelector('[data-menu="container"]'),
			openBtn: document.querySelector('[data-menu="open-btn"]'),
			closeBtn: document.querySelector('[data-menu="close-btn"]'),
			menuLinks: menuNav.querySelectorAll('a'),
			menuSmallLinks: document.querySelectorAll(
				'.menu_top_link_bottom',
			),
			menulineTop: document.querySelector('[data-menu="line-top"]'),
			menulineBottom: document.querySelector(
				'[data-menu="line-bottom"]',
			),
			lineWraps: document.querySelectorAll('.nav_button_line_wrap'),
		};
		this.el.menu.style.pointerEvents = 'none';
	}

	createEvents() {
		this.events.click = this.toggle.bind(this);
		this.events.keydown = this.onKeydown.bind(this);
	}

	addEventListeners() {
		this.events.close = this.close.bind(this);
		emitter.on('transition:start', this.events.close);

		document.addEventListener('keydown', this.events.keydown);

		if (this.el.openBtn) {
			this.el.openBtn.addEventListener('click', this.events.click);
		}
		if (this.el.closeBtn) {
			this.el.closeBtn.addEventListener('click', this.events.click);
		}
		if (this.el.menuLinks.length) {
			this.el.menuLinks.forEach((link) => {
				link.addEventListener('click', this.events.click);
			});
		}
		if (this.el.menuSmallLinks.length) {
			this.el.menuSmallLinks.forEach((link) => {
				link.addEventListener('click', this.events.click);
			});
		}
	}

	removeEventListeners() {
		emitter.off('transition:start', this.events.close);

		document.removeEventListener('keydown', this.events.keydown);

		if (this.el.openBtn) {
			this.el.openBtn.removeEventListener('click', this.events.click);
		}
		if (this.el.closeBtn) {
			this.el.closeBtn.removeEventListener(
				'click',
				this.events.click,
			);
		}
		if (this.el.menuLinks.length) {
			this.el.menuLinks.forEach((link) => {
				link.removeEventListener('click', this.events.click);
			});
		}
		if (this.el.menuSmallLinks.length) {
			this.el.menuSmallLinks.forEach((link) => {
				link.removeEventListener('click', this.events.click);
			});
		}
	}

	toggle() {
		if (this.isOpen) {
			this.close();
		} else {
			this.open();
		}
	}

	open() {
		if (this.isOpen) return;
		this.scroll.stopScroll();
		this.el.menu.style.pointerEvents = 'auto';
		emitter.emit('menu:open');
		MenuAnimations.open({
			menu: this.el.menu,
			container: this.el.container,
			menuLineTop: this.el.menulineTop,
			menuLineBottom: this.el.menulineBottom,
			lineWraps: this.el.lineWraps,
		});

		this.isOpen = true;
	}

	close() {
		if (!this.isOpen) return;

		MenuAnimations.close({
			menu: this.el.menu,
			menuLineTop: this.el.menulineTop,
			menuLineBottom: this.el.menulineBottom,
			lineWraps: this.el.lineWraps,
		}).then(() => {
			this.el.menu.style.pointerEvents = 'none';
			this.isOpen = false;
			emitter.emit('menu:close');

			this.scroll.startScroll(); // Restart main scroll when menu is closed
		});
	}

	onKeydown(event) {
		if (event.key === 'Escape' && this.isOpen) {
			this.close();
		}
	}
}
