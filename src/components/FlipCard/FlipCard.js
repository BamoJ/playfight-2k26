import { PlayerCore } from '../VideoPlayer/core/PlayerCore.js';
import { safePlay } from '../VideoPlayer/core/utils.js';
import { gsap } from 'gsap';

/**
 * FlipCard — interactive team card with two video faces.
 *
 * Front face: hover to play (with audio), hover out to pause.
 * Click: flip card via gsap.to rotateY, play arriving face's video.
 * Each face composes its own PlayerCore for time text + play/pause controls.
 */
export class FlipCard {
	constructor(el, parentSignal) {
		this.el = el;
		this._item = el.closest('.about_team_item') || el;
		this._ac = new AbortController();
		this._signal = this._ac.signal;

		// DOM refs
		this._frontFace = el.querySelector('.about_team_card_front');
		this._backFace = el.querySelector('.about_team_card_back');

		// Sources
		this._frontSrc = el.getAttribute('data-player-src-front') || '';
		this._backSrc = el.getAttribute('data-player-src-back') || '';

		// PlayerCore instances
		this._frontCore = new PlayerCore(this._frontFace);
		this._backCore = null; // lazy — created on first flip

		// State
		this._isFlipped = false;
		this._isHovering = false;
		this._flipTween = null;
		this._backAttached = false;

		// Abort if parent manager is destroyed
		if (parentSignal) {
			parentSignal.addEventListener('abort', () => this.destroy(), {
				once: true,
			});
		}

		this._init();
	}

	_init() {
		// Setup front PlayerCore (only if video element exists)
		if (this._frontCore.video) {
			this._frontCore.setupVideoElement();
			this._frontCore.setupMediaEvents();
			this._frontCore.setupControls();

			if (this._frontSrc) {
				this._frontCore.adapter.attach(this._frontSrc, () => {});
			}
		}

		// Set initial state
		this.el.setAttribute('data-flipcard-status', 'front');

		// Always bind events so flip works regardless of video state
		this._bindEvents();
	}

	// --- Back face lazy init ---

	_initBack() {
		if (this._backAttached) return;
		this._backAttached = true;

		this._backCore = new PlayerCore(this._backFace);

		if (this._backCore.video) {
			this._backCore.setupVideoElement();
			this._backCore.setupMediaEvents();
			this._backCore.setupControls();

			if (this._backSrc) {
				this._backCore.adapter.attach(this._backSrc, () => {});
			}
		}
	}

	// --- Events ---

	_bindEvents() {
		const { _signal: signal } = this;

		this._item.addEventListener(
			'mouseenter',
			() => this._onHoverEnter(),
			{ signal },
		);

		this._item.addEventListener(
			'mouseleave',
			() => this._onHoverLeave(),
			{ signal },
		);

		this._item.addEventListener('click', () => this._onFlip(), {
			signal,
		});
	}

	// --- Hover ---

	_onHoverEnter() {
		this._isHovering = true;
		const core = this._isFlipped ? this._backCore : this._frontCore;
		if (!core?.video) return;
		core.video.muted = false;
		safePlay(core.video);
	}

	_onHoverLeave() {
		this._isHovering = false;
		const core = this._isFlipped ? this._backCore : this._frontCore;
		if (!core?.video) return;
		core.video.pause();
		core.video.muted = true;
	}

	// --- Flip ---

	_onFlip() {
		if (this._flipTween) this._flipTween.kill();

		// Lazy-init back on first flip
		if (!this._backAttached) this._initBack();

		// Reset both videos before starting
		this._pauseAndMute(this._frontCore);
		this._pauseAndMute(this._backCore);

		this._isFlipped = !this._isFlipped;
		this.el.setAttribute(
			'data-flipcard-status',
			this._isFlipped ? 'back' : 'front',
		);

		const targetRotation = this._isFlipped ? 180 : 0;
		const arrivingCore = this._isFlipped
			? this._backCore
			: this._frontCore;

		this._flipTween = gsap.to(this.el, {
			rotateY: targetRotation,
			duration: 0.4,
			ease: 'back.out(1.7)',
			onComplete: () => {
				if (!this._isHovering || !arrivingCore?.video) return;
				arrivingCore.video.muted = false;
				safePlay(arrivingCore.video);
			},
		});
	}

	_pauseAndMute(core) {
		if (!core?.video) return;
		try {
			core.video.pause();
		} catch (_) {}
		core.video.muted = true;
	}

	// --- Cleanup ---

	destroy() {
		this._ac.abort();

		if (this._flipTween) {
			this._flipTween.kill();
			this._flipTween = null;
		}

		this._frontCore.destroy();
		if (this._backCore) this._backCore.destroy();

		delete this.el._flipCard;
	}
}
