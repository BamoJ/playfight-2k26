import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import emitter from '@utils/Emitter';
import AssetTracker from '@utils/AssetTracker';

// Minimum time the counter is allowed to take, even if the page loads instantly.
// Pure padding — the site is fast, we just want the preloader to breathe.
const MIN_DURATION_MS = 2000;

export default class Preloader {
	constructor(options = {}) {
		this.onComplete = options.onComplete || (() => {});

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
		this.sideBar = document.querySelector('[data-sidebar]');

		this.rafId = null;
		this.isComplete = false;
		this.startTime = 0;
		this.tl = null;
		this.view = null;
		this.tracker = null;
		this.latestLoadProgress = 0;

		this.abort = this.abort.bind(this);
		emitter.once('transition:start', this.abort);
	}

	async start() {
		if (!this.wrapper) return;

		this.wrapper.style.visibility = 'visible';

		// Hide page content behind preloader
		this.view = document.querySelector('[data-taxi-view]');

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

		this.startTime = performance.now();
		console.log('[Preloader] start');

		this.tracker = new AssetTracker();
		this.tracker.onProgress((p) => {
			this.latestLoadProgress = p;
		});
		this.tracker.start();

		// Stepped counter: ramp → plateau → ramp → plateau → ramp → plateau.
		// Creates visible pauses at 70, 80, 90 like classic loaders.
		// Each entry = { pct: target %, at: fraction of MIN_DURATION_MS to reach it }.
		// Between checkpoints the counter ramps; AFTER a checkpoint's `at` time
		// it plateaus until the next `at` time kicks in.
		const STAGES = [
			{ pct: 70, at: 0.25 }, // 0 → 70 by 25% of time
			{ pct: 70, at: 0.45 }, // plateau at 70 until 45%
			{ pct: 80, at: 0.6 }, // 70 → 80 by 60%
			{ pct: 80, at: 0.75 }, // plateau at 80 until 75%
			{ pct: 90, at: 0.9 }, // 80 → 90 by 90%
			{ pct: 90, at: 1.0 }, // plateau at 90 until end
		];

		const stagedFloor = (t) => {
			let prevPct = 0;
			let prevAt = 0;
			for (const s of STAGES) {
				if (t <= s.at) {
					const range = s.at - prevAt || 1;
					return prevPct + ((t - prevAt) / range) * (s.pct - prevPct);
				}
				prevPct = s.pct;
				prevAt = s.at;
			}
			return prevPct;
		};

		let val = 0;
		const LERP = 0.06;
		const tick = () => {
			if (this.isComplete) return;
			const elapsed = performance.now() - this.startTime;
			const t = Math.min(elapsed / MIN_DURATION_MS, 1);
			const floor = stagedFloor(t);
			const target = Math.min(this.latestLoadProgress * 100, floor);
			val += (target - val) * LERP;
			if (this.loaderNum)
				this.loaderNum.textContent = Math.round(val);
			this.rafId = requestAnimationFrame(tick);
		};
		this.rafId = requestAnimationFrame(tick);

		// animateIn runs in parallel — not awaited, doesn't gate the counter.
		this.animateIn(1.2);

		// Wait on BOTH: real load done AND time floor reached. 8s safety escape.
		let timedOut = false;
		await Promise.race([
			Promise.all([
				this.tracker.whenComplete(),
				new Promise((r) => setTimeout(r, MIN_DURATION_MS)),
			]),
			new Promise((r) =>
				setTimeout(() => {
					timedOut = true;
					r();
				}, 8000),
			),
		]);

		const loadMs = Math.round(performance.now() - this.startTime);
		console.log(
			`[Preloader] load finished @ ${loadMs}ms${timedOut ? ' (timed out)' : ''}`,
		);

		// Final burst to 100 — the only deliberate flourish.
		cancelAnimationFrame(this.rafId);
		const finalProxy = { v: val };
		await gsap.to(finalProxy, {
			v: 100,
			duration: 0.6,
			ease: 'power1.out',
			onUpdate: () => {
				if (this.loaderNum)
					this.loaderNum.textContent = Math.round(finalProxy.v);
			},
		});

		this.isComplete = true;
		this.tracker.destroy();
		emitter.off('transition:start', this.abort);

		await this.animateOut();

		this.wrapper.style.visibility = 'hidden';
		const totalMs = Math.round(performance.now() - this.startTime);
		console.log(
			`[Preloader] complete — total visible time ${totalMs}ms`,
		);
		emitter.emit('preloader:complete');
	}

	animateIn(duration) {
		return new Promise((resolve) => {
			const tl = gsap.timeline({ onComplete: resolve });

			if (this.loaderNum) {
				tl.to(this.loaderNum, {
					y: '0vh',
					duration,
					ease: 'power1.out',
				});
			}

			if (this.svgLeft) {
				tl.to(
					this.svgLeft,
					{ y: '0vh', duration, ease: 'power1.out' },
					0,
				);
			}
			if (this.svgRight) {
				tl.to(
					this.svgRight,
					{ y: '0vh', duration, ease: 'power1.out' },
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
			 * ───────────────s────────────────────────
			 */
			if (this.svgLeft) {
				this.tl.to(
					this.svgLeft,
					{
						x: '0vw',
						duration: 2,
						ease: 'power4.inOut',
					},
					0,
				);
			}
			if (this.svgRight) {
				this.tl.to(
					this.svgRight,
					{
						x: '0vw',
						duration: 2,
						ease: 'power4.inOut',
					},
					0,
				);
			}
			if (this.svgLeft.querySelectorAll('path').length) {
				this.tl.to(
					this.svgLeft.querySelectorAll('path'),
					{
						yPercent: -150,
						duration: 0.4,
						ease: 'power4.out',
						stagger: 0.03,
					},
					'>+.1',
				);
			}
			if (this.svgRight.querySelectorAll('path').length) {
				this.tl.to(
					this.svgRight.querySelectorAll('path'),
					{
						yPercent: -150,
						duration: 0.5,
						ease: 'power3.out',
						stagger: 0.03,
					},
					'<',
				);
			}
			if (this.bg) {
				this.tl.to(
					this.bg,
					{
						opacity: '0',
						duration: 0.1,
						ease: 'sine.out',
					},
					0,
				);
			}

			if (this.loaderNum) {
				this.tl.to(
					this.loaderNum,
					{ opacity: 0, duration: 0.5, ease: 'sine.out' },
					0,
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

			// img-move scatter entrance
			if (this.imagesMove.length) {
				this.tl.to(
					this.imagesMove,
					{
						x: 0,
						y: 0,
						filter: 'blur(0px)',
						duration: 3,
						ease: 'expo.out',
						overwrite: false,
						stagger: {
							from: 'center',
							amount: 0.15,
						},
					},
					'>',
				);
			}

			// videoFlip entrance — animate outer directly.
			// HeroScroll's Flip.getState is deferred via 'preloader:complete',
			// so it only captures the clean end-state (post clearProps).
			if (this.videoFlip) {
				this.tl.fromTo(
					this.videoFlip,
					{ opacity: 0, y: '110vh', filter: 'blur(30px)' },
					{
						opacity: 1,
						y: 0,
						filter: 'blur(0px)',
						duration: 2,
						ease: 'expo.out',
						onComplete: () =>
							gsap.set(this.videoFlip, {
								clearProps: 'transform,filter,opacity',
							}),
					},
					0.4,
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
						duration: 1,
						ease: 'power3.out',
						stagger: 0.015,
					},
					'>-.4',
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
					'<+.5',
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
					1.3,
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
						1.3,
					);
				}
			}
		});
	}

	abort() {
		if (this.isComplete) return;
		this.isComplete = true;
		if (this.rafId) {
			cancelAnimationFrame(this.rafId);
			this.rafId = null;
		}

		if (this.tracker) {
			this.tracker.destroy();
			this.tracker = null;
		}

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
