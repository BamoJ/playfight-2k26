import '@styles/index.css';
import TransitionManager from '@transitions';
import SmoothScroll from '@utils/SmoothScroll';
import Canvas from '@canvas';
import { Home } from '@canvas/Home';
import { Work } from '@canvas/Work';
import { Originals } from '@canvas/Originals';
import { About } from '@canvas/About';
import { Project } from '@canvas/Project';
import ProjectTransition from '@transitions/pages/project';
import PlaygroundTransition from '@transitions/pages/playground';
import OriginalsTransition from '@transitions/pages/originals';
import emitter from '@utils/Emitter';

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
	project: ProjectTransition,
	playground: PlaygroundTransition,
	originals: OriginalsTransition,
	// about: AboutTransition,
};

// --- Main App ---
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
