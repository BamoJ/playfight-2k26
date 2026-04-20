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
import LightboxButtonHover from '@ui/Buttons/LightboxButtonHover';
import CallButtonHover from '@ui/Buttons/CallButtonHover';
import LinkHover from '@ui/Links/LinkHover';
import NavButtonHover from '@ui/Buttons/NavButtonHover';

import HeroTypewriter from '@ui/HeroTypewriter/HeroTypewritter';
import HideNav from '@ui/HideNav/HideNav';

import PLModeSwitch from '@ui/PlaygroundModeSwitch/PLModeSwitch';
import ServiceList from './ui/ServiceListHover/ServiceList';
import NavLogoMorph from './ui/Buttons/NavLogoMorph';
import PlaygroundButtonHover from './ui/Buttons/PlaygroundButtonHover';
import Lightbox from './Lightbox/Lightbox';
import FlipCardManager from './FlipCard/FlipCardManager';
import { OriginalSlider } from './sliders/OriginalSlider';
import { AboutSlider } from './sliders/AboutSlider';
import { isTouch } from '@utils/device';

let currentInstance = null;
export const getComponents = () => currentInstance;

export default class Components {
	constructor() {
		this.instances = {};
		currentInstance = this;
		this.initComponents();
	}

	initComponents() {
		const touch = isTouch();

		// NavButtonHover must init before MenuComponent (creates line wrappers)
		if (!touch) this.instances.navButtonHover = new NavButtonHover();
		this.instances.menu = new MenuComponent();
		this.instances.videoPlayer = new VideoPlayerManager();
		this.instances.navLogoMorph = new NavLogoMorph();
		if (!touch)
			this.instances.playgroundButtonHover = new PlaygroundButtonHover();

		this.instances.heroTypewriter = new HeroTypewriter();
		this.instances.hideNav = new HideNav();
		if (!touch) this.instances.buttonHover = new ButtonHover();
		if (!touch)
			this.instances.lightboxButtonHover = new LightboxButtonHover();
		if (!touch) this.instances.callButtonHover = new CallButtonHover();
		if (!touch) this.instances.linkHover = new LinkHover();
		this.instances.plModeSwitch = new PLModeSwitch();
		if (!touch) this.instances.ServiceList = new ServiceList();
		this.instances.lightbox = new Lightbox();
		this.instances.flipCardManager = new FlipCardManager();
		this.initSliders();
	}

	initSliders() {
		const originalsWrapper = document.querySelector(
			'[data-slider="originals"]',
		);
		if (originalsWrapper) {
			this.instances.originalSlider = new OriginalSlider(
				originalsWrapper,
			);
		}
		const aboutWrapper = document.querySelector('[data-slider="about"]');
		if (aboutWrapper) {
			this.instances.aboutSlider = new AboutSlider(aboutWrapper);
		}
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
		if (currentInstance === this) currentInstance = null;
	}
}
