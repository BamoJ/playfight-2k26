import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import emitter from '@utils/Emitter';
import TextureCache from '@canvas/utils/TextureCache';

export default class Preloader {
	constructor(options = {}) {
		this.onComplete = options.onComplete || (() => {});
		this.minDuration = options.minDuration || 400;

		this.wrapper = document.querySelector('[data-loader="wrap"]');
		if (!this.wrapper) {
			this.onComplete();
			return;
		}

		this.loaderNum = this.wrapper.querySelector(
			'[data-loader="loader-num"]',
		);
		this.svgLeft = this.wrapper.querySelector(
			'[data-loader="svg-left"]',
		);
		this.svgRight = this.wrapper.querySelector(
			'[data-loader="svg-right"]',
		);

		this.imagesMove = document.querySelectorAll(
			'[data-anim-hero-scroll="img-move"]',
		);
		this.videoFlip = document.querySelector(
			'[data-anim-hero-scroll="video-flip-move"]',
		);
		this.heading = document.querySelector(
			'[data-loader="heading"] h1',
		);
		this.text = document.querySelector('[data-loader="text"]');
		this.logo = document.querySelector('[data-loader="logo"]');
		this.navBtn = document.querySelector('[data-loader="nav-btn"]');
		this.bg = this.wrapper.querySelector('[data-loader="bg"]');

		this.actualProgress = 0;
		this.displayProgress = 0;
		this.loadingComplete = false;
		this.rafId = null;
		this.isComplete = false;
		this.startTime = 0;
		this.tl = null;
		this.view = null;

		this.abort = this.abort.bind(this);
		emitter.once('transition:start', this.abort);
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

			this.displayProgress += (target - this.displayProgress) * 0.1;

			const current = Math.round(this.displayProgress);
			if (this.loaderNum) {
				this.loaderNum.textContent = current;
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

		// Hide page content behind preloader
		this.view = document.querySelector('[data-taxi-view]');
		if (this.view) gsap.set(this.view, { opacity: 0 });

		// Hide nav
		if (this.logo) {
			gsap.set(this.logo.querySelectorAll('path'), {
				yPercent: -150,
			});
		}
		if (this.navBtn) {
			const lines = this.navBtn.querySelectorAll('.nav_button_line');
			if (lines.length) {
				gsap.set(lines, { xPercent: 100, opacity: 0 });
			}
		}

		// Load assets, measure how long it took
		const loadStart = performance.now();
		await this.loadAssets();
		const loadTime = (performance.now() - loadStart) / 1000;

		// Entrance duration = actual load time, min 4s
		const duration = Math.max(loadTime, 4);
		this.minDuration = duration * 1000;
		this.loadingComplete = true;
		this.actualProgress = 100;

		// Reset ticker for entrance phase — counter 0→100 over 'duration'
		this.displayProgress = 0;
		this.startTime = performance.now();
		this.startProgressTicker();

		await this.animateIn(duration);

		this.stopProgressTicker();
		this.isComplete = true;
		emitter.off('transition:start', this.abort);
		this.displayProgress = 100;
		if (this.loaderNum) this.loaderNum.textContent = '100';
		await new Promise((r) => setTimeout(r, 100));

		// Exit + hero entrance
		await this.animateOut();

		this.wrapper.style.visibility = 'hidden';
	}

	animateIn(duration) {
		return new Promise((resolve) => {
			const tl = gsap.timeline({ onComplete: resolve });

			if (this.loaderNum) {
				tl.fromTo(
					this.loaderNum,
					{ y: '100vh' },
					{ y: '0vh', duration, ease: 'power3.out' },
				);
			}

			if (this.svgLeft) {
				tl.fromTo(
					this.svgLeft,
					{ y: '100vh' },
					{ y: '0vh', duration, ease: 'power3.out' },
					0,
				);
			}
			if (this.svgRight) {
				tl.fromTo(
					this.svgRight,
					{ y: '100vh' },
					{ y: '0vh', duration, ease: 'power3.out' },
					0,
				);
			}
		});
	}

	animateOut() {
		return new Promise((resolve) => {
			this.tl = gsap.timeline({ onComplete: resolve });

			/*
			 * ───────────────────────────────────────
			 *  Preloader exit
			 * ───────────────────────────────────────
			 */
			if (this.svgLeft) {
				this.tl.to(
					this.svgLeft,
					{
						x: '0',
						duration: 0.5,
						ease: 'power3.inOut',
					},
					0,
				);
			}
			if (this.bg) {
				this.tl.to(
					this.bg,
					{
						opacity: '0',
						duration: 0.2,
						ease: 'sine.out',
					},
					0,
				);
			}
			if (this.svgRight) {
				this.tl.to(
					this.svgRight,
					{
						x: '0',
						duration: 0.5,
						ease: 'power3.inOut',
					},
					0.05,
				);
			}
			if (this.loaderNum) {
				this.tl.to(
					this.loaderNum,
					{ opacity: 0, duration: 2, ease: 'sine.out' },
					0.1,
				);
			}

			/*
			 * ───────────────────────────────────────
			 *  Hide wrapper → initDom → set scatter
			 *  All sync so HeroScroll captures (0,0)
			 *  before scatter positions are applied
			 * ───────────────────────────────────────
			 */
			const fromX = gsap.utils.wrap(['-50vw', '50vw']);
			const fromY = gsap.utils.wrap([
				'-50vh',
				'-50vh',
				'50vh',
				'50vh',
				'50vh',
			]);

			this.tl.call(
				() => {
					this.onComplete();
					if (this.imagesMove.length) {
						gsap.set(this.imagesMove, {
							x: (i) => fromX(i),
							y: (i) => fromY(i),
							filter: 'blur(30px)',
						});
					}
				},
				null,
				'<',
			);

			/*
			 * ───────────────────────────────────────
			 *  Hero entrance
			 * ───────────────────────────────────────
			 */
			this.tl.addLabel('reveal', 0.6);

			// Page view fade in
			if (this.view) {
				this.tl.to(
					this.view,
					{
						opacity: 1,
						duration: 0.65,
						ease: 'sine.out',
						onComplete: () =>
							gsap.set(this.view, {
								clearProps: 'opacity',
							}),
					},
					'reveal',
				);
			}

			// img-move scatter entrance
			if (this.imagesMove.length) {
				this.tl.to(
					this.imagesMove,
					{
						x: 0,
						y: 0,
						filter: 'blur(0px)',
						duration: 2,
						ease: 'expo.out',
						overwrite: false,
						stagger: {
							from: 'center',
							amount: 0.15,
						},
					},
					'reveal',
				);
			}

			// Heading SplitText reveal
			if (this.heading) {
				const split = new SplitText(this.heading, {
					type: 'lines, chars',
					mask: 'lines',
				});
				this.tl.fromTo(
					split.chars,
					{ yPercent: 100 },
					{
						yPercent: 0,
						duration: 0.7,
						ease: 'power3.out',
						stagger: 0.015,
					},
					'reveal',
				);
			}

			// Text fade in
			if (this.text) {
				this.tl.fromTo(
					this.text,
					{ opacity: 0 },
					{
						opacity: 1,
						duration: 0.8,
						ease: 'sine.out',
					},
					'reveal+=0.3',
				);
			}

			// Nav logo reveal
			if (this.logo) {
				this.tl.to(
					this.logo.querySelectorAll('path'),
					{
						yPercent: 0,
						duration: 0.4,
						ease: 'power4.out',
						stagger: { from: 'random', amount: 0.25 },
					},
					'reveal',
				);
			}

			// Nav button reveal
			if (this.navBtn) {
				const lines = this.navBtn.querySelectorAll(
					'.nav_button_line',
				);
				if (lines.length) {
					this.tl.to(
						lines,
						{
							xPercent: 0,
							opacity: 1,
							duration: 0.5,
							stagger: 0.08,
							ease: 'power4.out',
						},
						'reveal',
					);
				}
			}
		});
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

	abort() {
		if (this.isComplete) return;
		this.isComplete = true;
		this.stopProgressTicker();

		if (this.tl) this.tl.kill();
		gsap.killTweensOf(
			[this.svgLeft, this.svgRight, this.loaderNum].filter(Boolean),
		);

		this.wrapper.style.display = 'none';

		if (this.logo) {
			gsap.set(this.logo.querySelectorAll('path'), {
				clearProps: 'all',
			});
		}
		if (this.navBtn) {
			const lines = this.navBtn.querySelectorAll('.nav_button_line');
			if (lines.length) gsap.set(lines, { clearProps: 'all' });
		}
		if (this.view) gsap.set(this.view, { clearProps: 'opacity' });

		this.onComplete();
	}
}
