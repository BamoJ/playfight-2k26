import '@styles/index.css';
import TransitionManager from '@transitions';
import Preloader from './transitions/Preloader';

// --- Page Registry ---
// Import your page classes and register them here.
import { Home } from '@canvas/Home';

const pages = {
	home: Home,
	// project: Project,
	// about: About,
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
		this.initApp();
	}

	initApp() {
		const preloader = new Preloader({
			// Set a ready signal if a page needs to signal "I'm ready"
			// before the preloader completes (e.g. after DomScroll init)
			readySignal: 'home:enter-ready',

			onAppStart: () => {
				new TransitionManager({ pages, pageTransitions });
			},
		});

		preloader.start().catch((err) => {
			console.error('[App] Preloader failed:', err);

			const wrapper = document.querySelector(
				'[data-loader="wrapper"]',
			);
			if (wrapper) wrapper.style.display = 'none';

			if (!preloader.appStarted) {
				new TransitionManager({ pages, pageTransitions });
			}
		});
	}
}

window.Webflow ||= [];
window.Webflow.push(() => {
	new App();
});
