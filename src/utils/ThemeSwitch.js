import E from '@unseenco/e';

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

	_applyCurrentTheme() {}

	_onNavigateIn({ to }) {
		const fetchedBody = to.page.body;

		// Find theme class from the fetched page — check body first, then first child wrapper
		let match = themeClasses.find((cls) =>
			fetchedBody.classList.contains(cls),
		);
		if (!match && fetchedBody.firstElementChild) {
			match = themeClasses.find((cls) =>
				fetchedBody.firstElementChild.classList.contains(cls),
			);
		}

		// Apply to body only
		const liveBody = document.body;
		themeClasses.forEach((cls) => liveBody.classList.remove(cls));
		if (match) liveBody.classList.add(match);
	}
}
