/**
 * Component manager — initializes all DOM UI components.
 *
 * Add your project-specific components here:
 *   import MenuComponent from '@ui/menu/MenuComponent';
 *   this.instances.menu = new MenuComponent();
 */

import MenuComponent from '@ui/menu/MenuComponent';
import VideoPlayerManager from '@components/VideoPlayer/VideoPlayerManager';
import ThemeSwitch from '@components/ThemeSwitch/ThemeSwitch';

export default class Components {
	constructor() {
		this.instances = {};
		this.initComponents();
	}

	initComponents() {
		// Add project-specific components here
		this.instances.menu = new MenuComponent();
		this.instances.videoPlayer = new VideoPlayerManager();
		this.instances.themeSwitch = new ThemeSwitch();
	}

	get(name) {
		return this.instances[name];
	}

	destroy() {
		for (var key in this.instances) {
			if (
				this.instances[key] &&
				typeof this.instances[key].destroy === 'function'
			) {
				this.instances[key].destroy();
			}
		}
		this.instances = {};
	}
}
