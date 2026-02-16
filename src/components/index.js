/**
 * Component manager — initializes all DOM UI components.
 *
 * Add your project-specific components here:
 *   import MenuComponent from '@ui/menu/MenuComponent';
 *   this.instances.menu = new MenuComponent();
 */

import MenuComponent from '@ui/menu/MenuComponent';
import VideoPlayerManager from '@components/VideoPlayer/VideoPlayerManager';

export default class Components {
	constructor() {
		this.instances = {};
		this.initComponents();
	}

	initComponents() {
		// Add project-specific components here
		this.instances.menu = new MenuComponent();
		this.instances.videoPlayer = new VideoPlayerManager();
	}

	get(name) {
		return this.instances[name];
	}

	destroy() {
		for (var key in this.instances) {
			if (this.instances[key] && typeof this.instances[key].destroy === 'function') {
				this.instances[key].destroy();
			}
		}
		this.instances = {};
	}
}
