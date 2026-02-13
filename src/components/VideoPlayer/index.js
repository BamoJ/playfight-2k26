import Hls from 'hls.js';

export default class VideoPlayer {
	constructor(videoElement, videoSrc) {
		this.videoElement = videoElement;
		this.videoSrc = videoSrc;
		this.hls = null;

		this.initPlayer();
	}

	initPlayer() {
		if (Hls.isSupported()) {
			this.hls = new Hls();
			this.hls.loadSource(this.videoSrc);
			this.hls.attachMedia(this.videoElement);
			this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
				this.videoElement.play();
			});
		} else if (
			this.videoElement.canPlayType('application/vnd.apple.mpegurl')
		) {
			this.videoElement.src = this.videoSrc;
			this.videoElement.addEventListener('loadedmetadata', () => {
				this.videoElement.play();
			});
		} else {
			console.error('HLS is not supported in this browser.');
		}
	}
}
