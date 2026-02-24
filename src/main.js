import '@styles/index.css';
import TransitionManager from '@transitions';
import SmoothScroll from '@utils/SmoothScroll';
import Canvas from '@canvas';
import { Originals } from '@canvas/Originals';
import emitter from '@utils/Emitter';

// --- Page Registry (WebGL) ---
const pages = {
	originals: Originals,
};

// --- Transition Registry ---
// Import page-specific transitions (optional).
// Pages without a transition use GlobalEnter by default.
const pageTransitions = {
	// project: ProjectTransition,
	// about: AboutTransition,
};

// --- App ---
class App {
	constructor() {
		new SmoothScroll();

		const canvas = new Canvas(pages);
		emitter.on('transition:complete', () => {
			canvas.onChange(canvas.detectPageName());
		});

		new TransitionManager({ pageTransitions });
	}
}

window.Webflow ||= [];
window.Webflow.push(() => {
	new App();
});
