/**
 * Force every <video> to play inline on iOS.
 *
 * iOS Safari decides a video's fullscreen policy at parse time — if
 * playsinline / muted isn't set before the first play() (or even the
 * first src assignment), it escalates to native fullscreen on scroll,
 * tap, or re-entry. Attributes must be on the element in HTML, but
 * when they can't be added there (Webflow CMS binding collisions), we
 * force them via JS as early as possible.
 *
 * Safe to call multiple times. No-op on desktop browsers.
 */
export default function ensureInlineVideos(root = document) {
	const videos = root.querySelectorAll('video');
	videos.forEach((video) => {
		if (!video.hasAttribute('playsinline'))
			video.setAttribute('playsinline', '');
		if (!video.hasAttribute('webkit-playsinline'))
			video.setAttribute('webkit-playsinline', '');
		video.playsInline = true;

		if (video.autoplay && !video.hasAttribute('muted')) {
			video.setAttribute('muted', '');
			video.muted = true;
		}
	});
}
