import ComponentCore from '@component-core/ComponentCore';
import { MainPlayer } from './variants/MainPlayer.js';
import { LightboxPlayer } from './variants/LightboxPlayer.js';
import { BackgroundPlayer } from './variants/BackgroundPlayer.js';

const VARIANTS = {
	main: MainPlayer,
	lightbox: LightboxPlayer,
	bg: BackgroundPlayer,
};

/**
 * VideoPlayerManager — ComponentCore subclass that scans the DOM
 * for [data-video] elements and instantiates the correct variant.
 *
 * Handles lightbox open/close/ESC routing centrally so multiple
 * lightboxes on the same page don't conflict with each other.
 *
 * Re-instantiated on every Taxi page transition via `new Components()`
 * in TransitionManager. Uses el._videoPlayer marker to avoid double-init.
 */
export default class VideoPlayerManager extends ComponentCore {
	constructor() {
		super();
		this._instances = [];
		this._lightboxes = [];
		this._ac = new AbortController();
		this.init();
	}

	createElements() {
		this._scan();
		this._setupLightboxRouting();
	}

	createEvents() {}
	addEventListeners() {}
	removeEventListeners() {}

	_scan() {
		var self = this;
		document.querySelectorAll('[data-video]').forEach(function (el) {
			if (el._videoPlayer) return; // already initialized

			var variant = el.getAttribute('data-video');
			var Ctor = VARIANTS[variant];
			if (!Ctor) return;

			var instance = new Ctor(el);
			el._videoPlayer = instance;
			self._instances.push(instance);

			if (variant === 'lightbox') {
				self._lightboxes.push(instance);
			}
		});
	}

	/**
	 * Central lightbox routing — ONE document listener handles all
	 * open/close clicks and ESC key, routing to the correct instance.
	 *
	 * Matching logic:
	 *  - Open button finds its lightbox by walking up to the nearest
	 *    shared ancestor that contains a [data-video-lightbox-status] wrapper.
	 *  - If only one lightbox exists, all open buttons route to it.
	 *  - Close button finds its lightbox by the wrapper it's inside.
	 *  - ESC closes whichever lightbox is currently active.
	 */
	_setupLightboxRouting() {
		if (!this._lightboxes.length) return;

		var lightboxes = this._lightboxes;
		var signal = this._ac.signal;

		// --- Click: open / close ---
		document.addEventListener(
			'click',
			function (e) {
				// Close button
				var closeBtn = e.target.closest('[data-video-lightbox-control="close"]');
				if (closeBtn) {
					var closeWrapper = closeBtn.closest('[data-video-lightbox-status]');
					if (closeWrapper) {
						var lb = _findLightboxByWrapper(lightboxes, closeWrapper);
						if (lb) lb.close();
					}
					return;
				}

				// Open button
				var openBtn = e.target.closest('[data-video-lightbox-control="open"]');
				if (openBtn) {
					var src = openBtn.getAttribute('data-video-lightbox-src') || '';
					if (!src) return;
					var imgEl =
						openBtn.querySelector('[data-video-lightbox-placeholder]') ||
						openBtn.querySelector('[data-bunny-lightbox-placeholder]');
					var placeholderUrl = imgEl ? imgEl.getAttribute('src') : '';

					var target = _findLightboxForOpenBtn(lightboxes, openBtn);
					if (target) {
						// Close any other active lightbox first
						lightboxes.forEach(function (lb) {
							if (lb !== target && lb._isActive()) lb.close();
						});
						target.open(src, placeholderUrl);
					}
					return;
				}
			},
			{ signal },
		);

		// --- ESC key: close active lightbox ---
		document.addEventListener(
			'keydown',
			function (e) {
				if (e.key === 'Escape') {
					lightboxes.forEach(function (lb) {
						if (lb._isActive()) lb.close();
					});
				}
			},
			{ signal },
		);
	}

	destroy() {
		this._ac.abort();
		this._instances.forEach(function (inst) {
			inst.destroy();
		});
		this._instances = [];
		this._lightboxes = [];
		super.destroy();
	}
}

/**
 * Find which LightboxPlayer owns a given wrapper element.
 */
function _findLightboxByWrapper(lightboxes, wrapper) {
	for (var i = 0; i < lightboxes.length; i++) {
		if (lightboxes[i].wrapper === wrapper) return lightboxes[i];
	}
	return null;
}

/**
 * Find which LightboxPlayer an open button should target.
 *
 * Strategy:
 *  1. If there's only one lightbox, use it.
 *  2. Walk up from the open button looking for an ancestor that
 *     contains a [data-video-lightbox-status] wrapper.
 *  3. Fallback to the first lightbox.
 */
function _findLightboxForOpenBtn(lightboxes, openBtn) {
	if (lightboxes.length === 1) return lightboxes[0];

	// Walk up from the button and find the nearest ancestor that
	// contains a lightbox wrapper
	var node = openBtn.parentElement;
	while (node && node !== document.body) {
		var wrapper = node.querySelector('[data-video-lightbox-status]');
		if (wrapper) {
			var match = _findLightboxByWrapper(lightboxes, wrapper);
			if (match) return match;
		}
		node = node.parentElement;
	}

	// Fallback: first lightbox
	return lightboxes[0];
}
