import '@styles/index.css';
import TransitionManager from '@transitions';
import SmoothScroll from '@utils/smoothscroll';

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
		new TransitionManager({ pageTransitions });
	}
}

window.Webflow ||= [];
window.Webflow.push(() => {
	new App();
});
