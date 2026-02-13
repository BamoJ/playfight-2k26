import TextureCache from '@canvas/utils/TextureCache';
import { gsap } from 'gsap';
import emitter from '@utils/Emitter';

/**
 * Preloader — tracks real loading progress and orchestrates page enter.
 *
 * Customize the DOM selectors and animations per project.
 * The loading logic (texture preloading, progress tracking) stays the same.
 *
 * Required Webflow elements:
 *   [data-loader="wrapper"]     - Preloader container
 *   [data-loader="loader-num"]  - Progress number display
 *   [data-loader="progress-bar"] - Progress bar element
 */
export default class Preloader {
	constructor(options = {}) {
		this.onComplete = options.onComplete || (() => {});
		this.onAppStart = options.onAppStart || (() => {});
		this.minDuration = options.minDuration || 400;

		this.wrapper = document.querySelector(
			'[data-loader="wrapper"]',
		);
		if (!this.wrapper) {
			this.onComplete();
			return;
		}

		this.loaderNum = this.wrapper.querySelector(
			'[data-loader="loader-num"]',
		);
		this.progressBar = this.wrapper.querySelector(
			'[data-loader="progress-bar"]',
		);

		this.actualProgress = 0;
		this.displayProgress = 0;
		this.loadingComplete = false;
		this.rafId = null;
		this.isComplete = false;
		this.startTime = 0;
		this.appStarted = false;

		// Page-specific ready signal name (e.g. 'home:enter-ready')
		this.readySignal = options.readySignal || null;
		this.readyFired = false;

		if (this.readySignal) {
			emitter.once(this.readySignal, () => {
				this.readyFired = true;
			});
		}
	}

	startProgressTicker() {
		const tick = () => {
			if (this.isComplete) return;

			const elapsed = performance.now() - this.startTime;
			const timeProgress = Math.min(
				(elapsed / this.minDuration) * 100,
				100,
			);

			const target = this.loadingComplete
				? timeProgress
				: Math.min(timeProgress, this.actualProgress);

			this.displayProgress +=
				(target - this.displayProgress) * 0.1;

			const current = Math.round(this.displayProgress);
			if (this.loaderNum) {
				this.loaderNum.textContent = current;
			}
			if (this.progressBar) {
				this.progressBar.style.width = `${current}%`;
			}

			this.rafId = requestAnimationFrame(tick);
		};

		this.rafId = requestAnimationFrame(tick);
	}

	stopProgressTicker() {
		if (this.rafId) {
			cancelAnimationFrame(this.rafId);
			this.rafId = null;
		}
	}

	async start() {
		if (!this.wrapper) return;

		this.wrapper.style.visibility = 'visible';
		this.startTime = performance.now();

		this.startProgressTicker();

		await this.loadAssets();

		// Start the app
		await new Promise((r) => setTimeout(r, 100));
		this.onAppStart();
		this.appStarted = true;

		// Wait for page-specific ready signal if configured
		if (this.readySignal) {
			await this.waitForPageReady();
		}

		this.loadingComplete = true;
		this.actualProgress = 100;

		const elapsed = performance.now() - this.startTime;
		const remaining = Math.max(this.minDuration - elapsed, 0);
		if (remaining > 0) {
			await new Promise((r) => setTimeout(r, remaining));
		}

		await new Promise((r) => setTimeout(r, 150));
		this.stopProgressTicker();
		await this.complete();
	}

	async complete() {
		if (this.isComplete) return;
		this.isComplete = true;

		this.displayProgress = 100;
		if (this.loaderNum) this.loaderNum.textContent = '100';
		if (this.progressBar)
			this.progressBar.style.width = '100%';

		await new Promise((r) => setTimeout(r, 100));
		await this.animateOut();
	}

	async loadAssets() {
		const images = [...document.querySelectorAll('img')];
		const total = images.length;

		if (total === 0) {
			this.actualProgress = 95;
			return;
		}

		let loaded = 0;
		const promises = images.map((img) => {
			return TextureCache.load(img.src)
				.then(() => {
					loaded++;
					this.actualProgress = (loaded / total) * 95;
				})
				.catch(() => {
					loaded++;
					this.actualProgress = (loaded / total) * 95;
				});
		});

		await Promise.all(promises);
		this.actualProgress = 95;
	}

	waitForPageReady() {
		return new Promise((resolve) => {
			if (this.readyFired) {
				resolve();
				return;
			}

			emitter.once(this.readySignal, () => {
				this.readyFired = true;
				resolve();
			});

			setTimeout(() => {
				if (!this.readyFired) {
					console.warn(
						`[Preloader] Timeout waiting for ${this.readySignal}`,
					);
					resolve();
				}
			}, 2000);
		});
	}

	/**
	 * Override this per project for custom exit animations.
	 */
	animateOut() {
		return new Promise((resolve) => {
			const tl = gsap.timeline({
				onComplete: () => {
					this.wrapper.style.visibility = 'hidden';
					resolve();
				},
			});

			tl.to(this.wrapper, {
				opacity: 0,
				duration: 0.6,
				ease: 'power2.inOut',
			});
		});
	}
}
