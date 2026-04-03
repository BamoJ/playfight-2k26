import E from '@unseenco/e';
import gsap from 'gsap';

const themeClasses = [
	'u-theme-dark',
	'u-theme-brand',
	'u-theme-light',
];

export default class ThemeSwitch {
	constructor() {
		this._onNavigateIn = this._onNavigateIn.bind(this);
		E.on('NAVIGATE_IN', this._onNavigateIn);
		this._applyCurrentTheme();
	}

	_applyCurrentTheme() {
		const carrier = document.querySelector('[data-page-bg]');
		if (carrier) {
			const bg = carrier.style.backgroundColor;
			if (bg) {
				document.body.style.backgroundColor = bg;
				document.body.style.color = '#fff';
				const wrapper = document.body.firstElementChild;
				if (wrapper) {
					wrapper.style.backgroundColor = bg;
					wrapper.style.color = '#fff';
				}
				return;
			}
		}
	}

	_onNavigateIn({ to }) {
		const fetchedBody = to.page.body;
		const liveBody = document.body;
		const wrapper = liveBody.firstElementChild;

		// 1. CMS color carrier (per-project background)
		const carrier = fetchedBody.querySelector('[data-page-bg]');
		if (carrier) {
			const bg = carrier.style.backgroundColor;
			if (bg) {
				liveBody.style.backgroundColor = bg;
				liveBody.style.color = '#fff';
				if (wrapper) {
					wrapper.style.backgroundColor = bg;
					wrapper.style.color = '#fff';
				}
				return;
			}
		}

		// 2. No carrier → clear inline overrides, fall back to theme classes
		liveBody.style.backgroundColor = '';
		liveBody.style.color = '';
		if (wrapper) {
			wrapper.style.backgroundColor = '';
			wrapper.style.color = '';
		}

		themeClasses.forEach((cls) => liveBody.classList.remove(cls));

		let match = [...fetchedBody.classList].find((cls) =>
			themeClasses.includes(cls),
		);
		if (!match && fetchedBody.firstElementChild) {
			match = [...fetchedBody.firstElementChild.classList].find(
				(cls) => themeClasses.includes(cls),
			);
		}

		if (match) liveBody.classList.add(match);
	}
}
