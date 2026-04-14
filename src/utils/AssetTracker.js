export default class AssetTracker {
	constructor() {
		this.started = false;
		this.destroyed = false;
		this.observer = null;

		this.loadedBytes = 0;
		this.observedTotalBytes = 0;
		this.seenUrls = new Set();

		this.milestonesTotal = 0;
		this.milestonesDone = 0;

		this.windowLoaded = false;
		this.fontsReady = false;

		this.listeners = new Set();
		this.completeResolvers = [];

		this.currentProgress = 0;
		this.lastEmitted = -1;
	}

	start() {
		if (this.started || this.destroyed) return;
		this.started = true;
		this.startTime = performance.now();
		this.resourceLog = [];

		this._seedExistingResources();
		this._observeResources();
		this._trackDomAssets();
		this._trackFonts();
		this._trackWindowLoad();

		console.log(
			`[AssetTracker] start — ${this.milestonesTotal} milestones queued, ${this.seenUrls.size} resources already loaded (${this._formatBytes(this.loadedBytes)})`,
		);

		this._recompute();
	}

	onProgress(cb) {
		this.listeners.add(cb);
		cb(this.currentProgress);
		return () => this.listeners.delete(cb);
	}

	whenComplete() {
		if (this.currentProgress >= 1) return Promise.resolve();
		return new Promise((resolve) => {
			this.completeResolvers.push(resolve);
		});
	}

	destroy() {
		if (this.destroyed) return;
		this.destroyed = true;
		if (this.observer) {
			try {
				this.observer.disconnect();
			} catch (_) {}
			this.observer = null;
		}
		this.listeners.clear();
		this.completeResolvers = [];
	}

	_seedExistingResources() {
		if (
			typeof performance === 'undefined' ||
			!performance.getEntriesByType
		)
			return;
		const entries = performance.getEntriesByType('resource');
		for (const entry of entries) this._ingestResourceEntry(entry);
	}

	_observeResources() {
		if (typeof PerformanceObserver === 'undefined') return;
		try {
			this.observer = new PerformanceObserver((list) => {
				for (const entry of list.getEntries()) {
					this._ingestResourceEntry(entry);
				}
				this._recompute();
			});
			this.observer.observe({ type: 'resource', buffered: true });
		} catch (_) {
			this.observer = null;
		}
	}

	_ingestResourceEntry(entry) {
		if (!entry || !entry.name) return;
		if (this.seenUrls.has(entry.name)) return;
		this.seenUrls.add(entry.name);

		const size =
			entry.transferSize ||
			entry.encodedBodySize ||
			entry.decodedBodySize ||
			1;

		this.loadedBytes += size;
		this.observedTotalBytes += size;

		if (this.resourceLog) {
			this.resourceLog.push({
				name: entry.name,
				size,
				type: entry.initiatorType,
				duration: Math.round(entry.duration),
			});
		}
	}

	_trackDomAssets() {
		const images = [...document.querySelectorAll('img')];
		const videos = [...document.querySelectorAll('video')];

		for (const img of images) this._trackImage(img);
		for (const video of videos) this._trackVideo(video);
	}

	_trackImage(img) {
		// Lazy images never load during preload (they wait for scroll, which is blocked).
		if (img.loading === 'lazy') return;

		this.milestonesTotal++;
		let settled = false;
		const done = () => {
			if (settled) return;
			settled = true;
			this.milestonesDone++;
			this._recompute();
		};

		// Already settled — either loaded (naturalWidth > 0) or errored (naturalWidth === 0).
		// Both mean no further event will fire.
		if (img.complete) {
			if (img.naturalWidth > 0 && typeof img.decode === 'function') {
				img.decode().then(done, done);
			} else {
				done();
			}
			return;
		}

		const onLoad = () => {
			cleanup();
			if (typeof img.decode === 'function') {
				img.decode().then(done, done);
			} else {
				done();
			}
		};
		const onError = () => {
			cleanup();
			done();
		};
		const cleanup = () => {
			img.removeEventListener('load', onLoad);
			img.removeEventListener('error', onError);
		};
		img.addEventListener('load', onLoad);
		img.addEventListener('error', onError);
	}

	_trackVideo(video) {
		// preload="none" never downloads until play() is called — can't track.
		// Skip from milestones; PerformanceObserver still catches bytes if it does load.
		if (video.preload === 'none') return;

		this.milestonesTotal++;
		let settled = false;
		const done = () => {
			if (settled) return;
			settled = true;
			cleanup();
			this.milestonesDone++;
			this._recompute();
		};
		const cleanup = () => {
			video.removeEventListener('loadeddata', done);
			video.removeEventListener('canplaythrough', done);
			video.removeEventListener('error', done);
		};

		// readyState >= 2 (HAVE_CURRENT_DATA) is enough to show a frame —
		// don't require canplaythrough, which preload="metadata" never reaches.
		if (video.readyState >= 2) {
			this.milestonesDone++;
			return;
		}
		video.addEventListener('loadeddata', done);
		video.addEventListener('canplaythrough', done);
		video.addEventListener('error', done);
	}

	_trackFonts() {
		this.milestonesTotal++;
		if (!document.fonts || !document.fonts.ready) {
			this.fontsReady = true;
			this.milestonesDone++;
			return;
		}
		document.fonts.ready.then(() => {
			this.fontsReady = true;
			this.milestonesDone++;
			console.log(
				`[AssetTracker] fonts ready @ ${this._elapsed()}ms (${document.fonts.size} fonts)`,
			);
			this._recompute();
		});
	}

	_trackWindowLoad() {
		this.milestonesTotal++;
		if (document.readyState === 'complete') {
			this.windowLoaded = true;
			this.milestonesDone++;
			return;
		}
		const onLoad = () => {
			window.removeEventListener('load', onLoad);
			this.windowLoaded = true;
			this.milestonesDone++;
			console.log(
				`[AssetTracker] window.load @ ${this._elapsed()}ms`,
			);
			this._recompute();
		};
		window.addEventListener('load', onLoad);
	}

	_elapsed() {
		return Math.round(performance.now() - this.startTime);
	}

	_formatBytes(bytes) {
		if (bytes < 1024) return `${bytes}B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
		return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
	}

	_logSummary() {
		const total = this._elapsed();
		console.groupCollapsed(
			`[AssetTracker] complete @ ${total}ms — ${this.seenUrls.size} resources, ${this._formatBytes(this.loadedBytes)}`,
		);
		const top = [...this.resourceLog]
			.sort((a, b) => b.size - a.size)
			.slice(0, 10);
		console.table(
			top.map((r) => ({
				type: r.type,
				size: this._formatBytes(r.size),
				ms: r.duration,
				url: r.name.split('/').pop().slice(0, 60),
			})),
		);
		console.groupEnd();
	}

	_recompute() {
		if (this.destroyed) return;

		// Honest progress: milestones done / milestones total.
		// Each <img>, <video>, fonts.ready, and window.load contribute one unit.
		// Bytes-stream removed — browser can't know total bytes upfront,
		// so a byte-progress fraction is fundamentally impossible.
		const milestonesTotal = Math.max(this.milestonesTotal, 1);
		let progress = this.milestonesDone / milestonesTotal;

		const allDone =
			this.milestonesTotal > 0 &&
			this.milestonesDone >= this.milestonesTotal &&
			this.windowLoaded &&
			this.fontsReady;

		progress = allDone ? 1 : Math.min(progress, 0.95);

		if (progress < this.currentProgress) return;
		this.currentProgress = progress;

		const rounded = Math.round(progress * 1000);
		if (rounded !== this.lastEmitted) {
			this.lastEmitted = rounded;
			for (const cb of this.listeners) cb(progress);
		}

		if (progress >= 1 && this.completeResolvers.length) {
			const resolvers = this.completeResolvers;
			this.completeResolvers = [];
			this._logSummary();
			for (const r of resolvers) r();
		}
	}
}
