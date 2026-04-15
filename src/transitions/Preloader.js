import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import emitter from '@utils/Emitter';
import AssetTracker from '@utils/AssetTracker';

// Minimum time the counter is allowed to take, even if the page loads instantly.
// Pure padding — the site is fast, we just want the preloader to breathe.
const MIN_DURATION_MS = 2000;

export default class Preloader {
	/**
	 * Cache every DOM reference the preloader touches and init state flags.
	 * Bails early via onComplete() if the wrapper is missing (non-home pages).
	 * Binds abort() so it can be subscribed/unsubscribed as a stable listener.
	 * Listens for transition:start so a navigation mid-preload can cancel cleanly.
	 */
	constructor(options = {}) {
		this.onComplete = options.onComplete || (() => {});

		// Preloader wrapper — if it doesn't exist, fire onComplete and bail.
		this.wrapper = document.querySelector('[data-loader="wrap"]');
		if (!this.wrapper) {
			this.onComplete();
			return;
		}

		// Loader-internal DOM: counter digits + the two SVG halves.
		this.loaderNum = this.wrapper.querySelector(
			'[data-loader="loader-num"]',
		);
		this.svgLeft = this.wrapper.querySelector(
			'[data-loader="svg-left"]',
		);
		this.svgRight = this.wrapper.querySelector(
			'[data-loader="svg-right"]',
		);

		// Hero + chrome targets the exit timeline hands off to.
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
		this.labelLeft = document.querySelector(
			'[data-loader="label-left"]',
		);
		this.labelRight = document.querySelector(
			'[data-loader="label-right"]',
		);
		this.labelRightSvg = document.querySelector(
			'[data-loader="label-right-svg"]',
		);

		// Runtime state + handles the lifecycle + abort() need to read/write.
		this.rafId = null;
		this.isComplete = false;
		this.startTime = 0;
		this.tl = null;
		this.view = null;
		this.tracker = null;
		this.latestLoadProgress = 0;

		// Bind + subscribe abort so Taxi's transition:start can kill us mid-flight.
		this.abort = this.abort.bind(this);
		emitter.once('transition:start', this.abort);
	}

	/**
	 * Full preloader lifecycle: show wrapper, hide nav, start AssetTracker,
	 * drive the stepped counter via RAF, kick animateIn in parallel, wait on
	 * load-complete + time-floor, do a final burst to 100, then run animateOut.
	 * Emits preloader:complete at the end for HeroScroll's deferred Flip.getState.
	 */
	async start() {
		if (!this.wrapper) return;

		this.wrapper.style.visibility = 'visible';

		// Taxi view reference — page content sits behind the preloader layer.
		this.view = document.querySelector('[data-taxi-view]');

		// Nav starts hidden (logo paths up, button lines off-right) — animateOut reveals it.
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

		// AssetTracker watches image/video/font/window milestones — feeds real load %.
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

		// Piecewise-linear interpolation across STAGES — returns the counter floor at time t.
		// Finds the first checkpoint whose `at` hasn't been passed and lerps into it.
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

		// RAF tick — eases `val` toward min(real progress, staged floor) and paints the digit.
		// LERP keeps motion smooth even when target jumps (e.g. big load step lands).
		let val = 0;
		const LERP = 0.09;
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

		// Final burst to 100 — the only deliberate flourish, overrides the RAF tick.
		// finalProxy lets GSAP tween a plain number we paint into loaderNum on update.
		cancelAnimationFrame(this.rafId);
		const finalProxy = { v: val };
		await gsap.to(finalProxy, {
			v: 100,
			duration: 1,
			ease: 'power1.out',
			onUpdate: () => {
				if (this.loaderNum)
					this.loaderNum.textContent = Math.round(finalProxy.v);
			},
		});

		// Flip flags + tear down tracker before the exit timeline handoff.
		this.isComplete = true;
		this.tracker.destroy();
		emitter.off('transition:start', this.abort);

		await this.animateOut();

		// Hide wrapper, log total visible time, broadcast to HeroScroll's Flip listener.
		this.wrapper.style.visibility = 'hidden';
		const totalMs = Math.round(performance.now() - this.startTime);
		console.log(
			`[Preloader] complete — total visible time ${totalMs}ms`,
		);
		emitter.emit('preloader:complete');
	}

	/**
	 * Parallel entrance timeline — counter digit + both SVG halves slide
	 * into their on-screen position from above/below (CSS-parked off-stage).
	 * Runs concurrently with start()'s counter tick; not awaited by start().
	 * Resolves when the slide finishes so callers could chain if needed.
	 */
	animateIn(duration) {
		return new Promise((resolve) => {
			const tl = gsap.timeline({ onComplete: resolve });

			// Counter digit slides up into view (CSS-parked below).
			if (this.loaderNum) {
				tl.to(this.loaderNum, {
					y: '0vh',
					duration,
					ease: 'power1.out',
				});
			}

			// Both SVG halves slide into the center at the same time (position 0).
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

	/**
	 * Exit timeline that also doubles as the hero entrance. Preloader layer
	 * unzips (counter chars + SVG halves + paths), then runExitSetup fires
	 * onComplete (Taxi init + scroll + ScrollTrigger) and parks hero imagesMove
	 * off-screen. Hero images, video, heading, body, nav/logo animate in after.
	 */
	animateOut() {
		return new Promise((resolve) => {
			// ── Setup ──
			const fromX = gsap.utils.wrap(['-50vw', '50vw']);
			const fromY = gsap.utils.wrap([
				'-50vh',
				'-50vh',
				'50vh',
				'50vh',
				'50vh',
			]);

			const leftPaths = this.svgLeft?.querySelectorAll('path') ?? [];
			const rightPaths =
				this.svgRight?.querySelectorAll('path') ?? [];
			const logoPaths = this.logo?.querySelectorAll('path') ?? [];
			const navLines =
				this.navBtn?.querySelectorAll('.nav_button_line') ?? [];
			const split = this.heading
				? new SplitText(this.heading, {
						type: 'lines, chars',
						mask: 'lines',
						linesClass: 'split-line',
					})
				: null;
			const numSplit = this.loaderNum
				? new SplitText(this.loaderNum, {
						type: 'chars',
						mask: 'chars',
					})
				: null;

			// Fires at timeline position '<' so HeroScroll's deferred
			// Flip.getState (triggered via preloader:complete inside
			// onComplete) captures imagesMove at (0,0) BEFORE the scatter
			// transforms apply. Don't hoist the gsap.set outside the timeline
			// — Flip would then capture the scattered state instead.
			const runExitSetup = () => {
				this.onComplete();
				if (this.imagesMove.length) {
					gsap.set(this.imagesMove, {
						x: (i) => fromX(i),
						y: (i) => fromY(i),
						filter: 'blur(30px)',
					});
				}
			};

			// ── Timeline ──
			this.tl = gsap.timeline({ onComplete: resolve });

			// Counter digits split apart — odd chars fly left, even fly right.
			// Masked inside their own char boxes so they clip instead of bleeding.
			if (numSplit)
				this.tl.to(
					numSplit.chars,
					{
						xPercent: gsap.utils.wrap([-100, 100]),
						duration: 0.5,
						ease: 'power3.inOut',
						stagger: 0.04,
					},
					0,
				);

			// Full-screen SVG halves slide together to meet at center.
			// Starts 0.5s before the counter tween ends so the motion overlaps.
			if (this.svgLeft)
				this.tl.to(
					this.svgLeft,
					{ x: '0vw', duration: 0.85, ease: 'power4.out' },
					'>-.35',
				);
			if (this.svgRight)
				this.tl.to(
					this.svgRight,
					{ x: '0vw', duration: 0.85, ease: 'power4.out' },
					'<',
				);

			// SVG paths stagger up and out of view — the curtain lifts.
			// Left and right groups run in parallel (rightPaths pinned at '<').
			if (leftPaths.length)
				this.tl.to(
					leftPaths,
					{
						yPercent: -150,
						duration: 0.4,
						ease: 'power4.inOut',
						stagger: 0.03,
					},
					'>-.15',
				);
			if (rightPaths.length)
				this.tl.to(
					rightPaths,
					{
						yPercent: -150,
						duration: 0.5,
						ease: 'power4.inOut',
						stagger: 0.03,
					},
					'<',
				);

			// Hero heading reveals — SplitText chars rise from under their line mask.
			// Pinned at '<' so it starts with the right-paths stagger, not after.
			if (split)
				this.tl.fromTo(
					split.chars,
					{ yPercent: 100 },
					{
						yPercent: 0,
						duration: 1,
						ease: 'power3.out',
						stagger: 0.015,
					},
					'<',
				);

			// Body copy fades in a beat after the heading starts revealing.
			// '<+.5' = 0.5s after heading start — lets a few chars land first.
			if (this.text)
				this.tl.fromTo(
					this.text,
					{ opacity: 0 },
					{ opacity: 1, duration: 0.8, ease: 'sine.out' },
					'<+.5',
				);

			// Preloader background quick-fades at t=0 to unblock the hero layer.
			// Short 0.1s — no drama, just needs to not cover the hero entrance.
			if (this.bg)
				this.tl.to(
					this.bg,
					{ opacity: 0, duration: 0.1, ease: 'sine.out' },
					0,
				);

			// Handoff — fires onComplete (Taxi init + scroll + ScrollTrigger) and parks imagesMove off-screen.
			// Must be a tl.call at '<' so HeroScroll's Flip captures (0,0) BEFORE the scatter transforms apply.
			this.tl.call(runExitSetup, null, '<');

			// Hero images fly back in from their scattered corners to (0,0) with blur clearing.
			// overwrite:false so this tween doesn't clobber the scatter gsap.set that just fired.
			if (this.imagesMove.length)
				this.tl.to(
					this.imagesMove,
					{
						x: 0,
						y: 0,
						filter: 'blur(0px)',
						duration: 2,
						ease: 'expo.out',
						overwrite: false,
						stagger: { from: 'center', amount: 0.15 },
					},
					'>',
				);

			// Hero video rises from 110vh with blur clearing — hands off to HeroScroll's Flip.
			// clearProps on complete so scroll-driven transforms start from a clean inline slate.
			if (this.videoFlip)
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
					'<+.51',
				);

			// Nav logo paths drop back into place (undoing the -150 yPercent park from start()).
			// Randomised stagger keeps the fall feeling organic rather than sequenced.
			if (logoPaths.length)
				this.tl.to(
					logoPaths,
					{
						yPercent: 0,
						duration: 0.8,
						ease: 'power4.out',
						stagger: { from: 'random', amount: 0.25 },
					},
					'<+.85',
				);

			// Nav button lines slide in from the right alongside the logo.
			// Pinned at '<' so both nav reveals share the same start beat.
			if (navLines.length)
				this.tl.to(
					navLines,
					{
						xPercent: 0,
						opacity: 1,
						duration: 0.8,
						stagger: 0.08,
						ease: 'power4.out',
					},
					'<',
				);

			// Labels fade in last, on top of everything — the final polish.
			// labelRightSvg gets a slight delay so it pops just after labelRight.
			if (this.labelLeft)
				this.tl.fromTo(
					this.labelLeft,
					{ xPercent: -100, opacity: 0 },
					{
						xPercent: 0,
						opacity: 1,
						duration: 1,
						ease: 'power3.out',
					},
					'<+.25',
				);
			if (this.labelRight)
				this.tl.fromTo(
					this.labelRight,
					{ xPercent: 100, opacity: 0 },
					{
						xPercent: 0,
						opacity: 1,
						duration: 1,
						ease: 'power3.out',
					},
					'<',
				);
			if (this.labelRightSvg)
				this.tl.fromTo(
					this.labelRightSvg,
					{ xPercent: 100, opacity: 0 },
					{
						xPercent: 0,
						opacity: 1,
						duration: 1,
						ease: 'power3.out',
					},
					'<',
				);
		});
	}

	/**
	 * Emergency bailout — kills the counter RAF, tracker, and exit timeline,
	 * then hard-hides the wrapper. Runs when Taxi fires transition:start mid-
	 * preload (user navigated away). Restores nav + view styles via clearProps
	 * so the next page doesn't inherit our paused-mid-animation state.
	 */
	abort() {
		if (this.isComplete) return;
		this.isComplete = true;

		// Stop the RAF counter tick.
		if (this.rafId) {
			cancelAnimationFrame(this.rafId);
			this.rafId = null;
		}

		// Tear down AssetTracker (disconnects PerformanceObserver, clears listeners).
		if (this.tracker) {
			this.tracker.destroy();
			this.tracker = null;
		}

		// Kill any in-flight tweens on the exit timeline + the loader's own targets.
		if (this.tl) this.tl.kill();
		gsap.killTweensOf(
			[this.svgLeft, this.svgRight, this.loaderNum].filter(Boolean),
		);

		this.wrapper.style.display = 'none';

		// Reset nav + view inline styles so the destination page renders clean.
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
