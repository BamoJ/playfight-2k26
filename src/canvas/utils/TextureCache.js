import { TextureLoader } from 'three';

class TextureCache {
	constructor() {
		this.cache = new Map();
		this.loader = new TextureLoader();
		this.pending = new Map();
	}

	/**
	 * Load a texture or return cached version
	 * @param {string} src - Image/video URL
	 * @returns {Promise<THREE.Texture>}
	 */
	load(src) {
		if (!src) return Promise.reject(new Error('No source provided'));

		if (this.cache.has(src)) {
			return Promise.resolve(this.cache.get(src));
		}

		if (this.pending.has(src)) {
			return this.pending.get(src);
		}

		const promise = new Promise((resolve, reject) => {
			this.loader.load(
				src,
				(texture) => {
					this.cache.set(src, texture);
					this.pending.delete(src);
					resolve(texture);
				},
				undefined,
				(err) => {
					console.error(
						`[TextureCache] Failed to load ${src}`,
						err,
					);
					this.pending.delete(src);
					reject(err);
				},
			);
		});

		this.pending.set(src, promise);
		return promise;
	}

	get(src) {
		return this.cache.get(src);
	}

	has(src) {
		return this.cache.has(src);
	}

	clear() {
		this.cache.forEach((texture) => texture.dispose());
		this.cache.clear();
		this.pending.clear();
	}
}

export default new TextureCache();
