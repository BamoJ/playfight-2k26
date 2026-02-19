import ComponentCore from '@component-core/ComponentCore';
import { MenuAnimations } from './MenuAnimation';
import { gsap } from 'gsap';
import SmoothScroll from '@utils/SmoothScroll';

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
		};
	}

	createEvents() {
		this.events.click = this.toggle.bind(this);
		this.events.keydown = this.onKeydown.bind(this);
	}

	addEventListeners() {
		if (this.el.openBtn) {
			this.el.openBtn.addEventListener('click', this.events.click);
			this.el.openBtn.addEventListener(
				'keydown',
				this.events.keydown,
			);
		}
		if (this.el.closeBtn) {
			this.el.closeBtn.addEventListener('click', this.events.click);
			this.el.closeBtn.addEventListener(
				'keydown',
				this.events.keydown,
			);
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
		if (this.el.openBtn) {
			this.el.openBtn.removeEventListener('click', this.events.click);
			this.el.openBtn.removeEventListener(
				'keydown',
				this.events.keydown,
			);
		}
		if (this.el.closeBtn) {
			this.el.closeBtn.removeEventListener(
				'click',
				this.events.click,
			);
			this.el.closeBtn.removeEventListener(
				'keydown',
				this.events.keydown,
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
		MenuAnimations.open({
			menu: this.el.menu,
			container: this.el.container,
			closeBtn: this.el.closeBtn,
		});

		this.isOpen = true;
	}

	close() {
		if (!this.isOpen) return;

		MenuAnimations.close({
			menu: this.el.menu,
			container: this.el.container,
			closeBtn: this.el.closeBtn,
		}).then(() => {
			this.isOpen = false;

			this.scroll.startScroll(); // Restart main scroll when menu is closed
		});
	}

	onKeydown(event) {
		if (event.key === 'Escape' && this.isOpen) {
			this.close();
		}
	}
}
