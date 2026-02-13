import { Emitter } from '@utils/Emitter';

export default class Time extends Emitter {
	constructor() {
		super();

		this.start = performance.now();
		this.current = this.start;
		this.elapsed = 0;
		this.delta = 16;
		this.playing = true;

		this.tick = this.tick.bind(this);
		this.tick();
	}

	play() {
		this.playing = true;
	}

	pause() {
		this.playing = false;
	}

	tick() {
		const current = performance.now();
		this.delta = current - this.current;
		this.elapsed += this.playing ? this.delta : 0;
		this.current = current;

		if (this.delta > 60) {
			this.delta = 60;
		}

		if (this.playing) {
			this.emit('tick');
		}

		this.ticker = window.requestAnimationFrame(this.tick);
	}

	stop() {
		window.cancelAnimationFrame(this.ticker);
	}
}
