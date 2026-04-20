import '@styles/index.css';
import TransitionManager from '@transitions';
import SmoothScroll from '@utils/SmoothScroll';
import Canvas from '@canvas';
import { Home } from '@canvas/Home';
import { Work } from '@canvas/Work';
import { Originals } from '@canvas/Originals';
import { About } from '@canvas/About';
import { Project } from '@canvas/Project';
import ProjectTransition from '@/transitions/pages/project';
import WorksTransition from '@/transitions/pages/works';
import PlaygroundTransition from '@/transitions/pages/playground';
import OriginalsTransition from '@transitions/pages/originals';
import AboutTransition from '@transitions/pages/about';
import HomeTransition from '@transitions/pages/home';
import Preloader from '@transitions/Preloader';
import emitter from '@utils/Emitter';
import { isMobile } from '@utils/device';
import ensureInlineVideos from '@utils/ensureInlineVideos';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// --- Page Registry (WebGL) ---
const pages = {
	home: Home,
	works: Work,
	originals: Originals,
	project: Project,
	about: About,
};

// --- Transition Registry ---
// Import page-specific transitions (optional).
// Pages without a transition use GlobalEnter by default.
const pageTransitions = {
	home: HomeTransition,
	project: ProjectTransition,
	playground: PlaygroundTransition,
	originals: OriginalsTransition,
	works: WorksTransition,
	about: AboutTransition,
};

// --- Main App ---
class App {
	constructor() {
		ensureInlineVideos();

		const scroll = new SmoothScroll();

		const canvas = isMobile() ? null : new Canvas(pages);
		if (canvas) {
			emitter.on('transition:complete', () => {
				canvas.onChange(canvas.detectPageName());
			});
		}

		const isHome = ['/', '/index', '/index.html'].includes(
			window.location.pathname,
		);
		const showPreloader = isHome; // TODO: restore sessionStorage check after debugging

		if (showPreloader) {
			scroll.stopScroll();
			const tm = new TransitionManager({
				pageTransitions,
				deferDomInit: true,
			});
			const preloader = new Preloader({
				onComplete: () => {
					tm.initDom();
				},
			});
			emitter.once('preloader:complete', () => {
				scroll.startScroll();
				ScrollTrigger.refresh();
			});
			preloader.start();
			sessionStorage.setItem('preloaderShown', 'true');
		} else {
			new TransitionManager({ pageTransitions });
		}
	}
}

window.Webflow ||= [];
window.Webflow.push(() => {
	new App();
});
