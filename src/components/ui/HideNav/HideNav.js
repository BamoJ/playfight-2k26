import ComponentCore from '../../_core/ComponentCore';
export default class HideNav extends ComponentCore {
	constructor() {
		super();
		this.lastScrollTop = 0;
		this.navbar = null;
	}

	createElements() {
		this.navbar = document.querySelector('.navbar');
	}

	createEvents() {
		this.events.onScroll = this.onScroll.bind(this);
	}

	addEventListeners() {
		window.addEventListener('scroll', this.events.onScroll);
	}

	removeEventListeners() {
		window.removeEventListener('scroll', this.events.onScroll);
	}
}
