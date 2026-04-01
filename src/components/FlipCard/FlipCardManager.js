import ComponentCore from '@component-core/ComponentCore';
import { FlipCard } from './FlipCard.js';

/**
 * FlipCardManager — scans DOM for .about_team_parent elements
 * and creates a FlipCard instance for each.
 *
 * Re-instantiated on every Taxi page transition via Components.
 */
export default class FlipCardManager extends ComponentCore {
	constructor() {
		super();
		this._instances = [];
		this._ac = new AbortController();
		this.init();
	}

	createElements() {
		document.querySelectorAll('.about_team_parent').forEach((el) => {
			if (el._flipCard) return;
			const instance = new FlipCard(el, this._ac.signal);
			el._flipCard = instance;
			this._instances.push(instance);
		});
	}

	createEvents() {}
	addEventListeners() {}
	removeEventListeners() {}

	destroy() {
		this._ac.abort();
		this._instances.forEach((inst) => inst.destroy());
		this._instances = [];
		super.destroy();
	}
}
