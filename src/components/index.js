/**
 * Component manager — initializes all DOM UI components.
 *
 * Add your project-specific components here:
 *   import MenuComponent from '@ui/menu/MenuComponent';
 *   this.instances.menu = new MenuComponent();
 */

import MenuComponent from '@ui/menu/MenuComponent';
import VideoPlayerManager from '@components/VideoPlayer/VideoPlayerManager';
import ButtonHover from '@ui/Buttons/ButtonHover';
import CallButtonHover from '@ui/Buttons/CallButtonHover';
import LinkHover from '@ui/Links/LinkHover';
import NavButtonHover from '@ui/Buttons/NavButtonHover';

import HeroTypewriter from '@ui/HeroTypewriter/HeroTypewritter';
import HideNav from '@ui/HideNav/HideNav';
import MouseImageTrail from '@ui/Mouse/MouseImageTrail';
import PLModeSwitch from '@ui/PlaygroundModeSwitch/PLModeSwitch';
import ServiceList from './ui/ServiceListHover/ServiceList';
import NavLogoMorph from './ui/Buttons/NavLogoMorph';

export default class Components {
	constructor() {
		this.instances = {};
		this.initComponents();
	}

	initComponents() {
		// NavButtonHover must init before MenuComponent (creates line wrappers)
		this.instances.navButtonHover = new NavButtonHover();
		this.instances.menu = new MenuComponent();
		this.instances.videoPlayer = new VideoPlayerManager();
		this.instances.navLogoMorph = new NavLogoMorph();

		this.instances.heroTypewriter = new HeroTypewriter();
		this.instances.hideNav = new HideNav();
		this.instances.mouseImageTrail = new MouseImageTrail();
		this.instances.buttonHover = new ButtonHover();
		this.instances.callButtonHover = new CallButtonHover();
		this.instances.linkHover = new LinkHover();
		this.instances.plModeSwitch = new PLModeSwitch();
		this.instances.ServiceList = new ServiceList();
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
