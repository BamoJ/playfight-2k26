import ComponentCore from '@/components/_core/ComponentCore';

export default class MouseImageTrail extends ComponentCore {
	constructor() {
		super();
		this.config = {
			leadEase: 0.25,
			trailEase: 0.16,
			pathFollow: 1,
		};

		this.instances = [];
	}

	createElements() {
		this.container = document.querySelector(
			'[data-stacked-trail-area]',
		);
		this.images = this.container.querySelectorAll(
			'[data-stacked-trail-image]',
		);
	}
	createEvents() {}

	handleMouseMove(event) {}

	handleMouseLeave(event) {}
}
