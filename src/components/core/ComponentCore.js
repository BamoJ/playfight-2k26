export default class ComponentCore {
	constructor() {
		this.events = {};
		this.isInitialized = false;
	}

	init() {
		if (this.isInitialized) return;
		this.createElements();
		this.createEvents();
		this.addEventListeners();
		this.isInitialized = true;
	}

	destroy() {
		this.removeEventListeners();
		this.isInitialized = false;
	}

	createElements() {}
	createEvents() {}
	addEventListeners() {}
	removeEventListeners() {}
}
