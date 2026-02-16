import ComponentCore from '@component-core/ComponentCore';
import E from '@unseenco/e';

export default class ThemeSwitch extends ComponentCore {
	constructor() {
		super();
		this._onNavigateIn = this._onNavigateIn.bind(this);
		this.init();
	}

	createElements() {}

	addEventListeners() {
		E.on('NAVIGATE_IN', this._onNavigateIn);
	}

	removeEventListeners() {
		E.off('NAVIGATE_IN', this._onNavigateIn);
	}

	_onNavigateIn({ to }) {
		const themeClasses = [
			'u-theme-dark',
			'u-theme-brand',
			'u-theme-light',
		];
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

		// Apply to live body
		const liveBody = document.body;
		themeClasses.forEach((cls) => liveBody.classList.remove(cls));
		if (match) liveBody.classList.add(match);

		// Also apply to the wrapper if it exists
		const liveWrapper = liveBody.firstElementChild;
		if (liveWrapper) {
			themeClasses.forEach((cls) =>
				liveWrapper.classList.remove(cls),
			);
			if (match) liveWrapper.classList.add(match);
		}
	}
}
