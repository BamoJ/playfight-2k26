import { Core } from '@unseenco/taxi';
import SmoothScroll from '@utils/SmoothScroll';
import Components from '@components';
import emitter from '@utils/Emitter';
import GlobalTransition from './global/GlobalEnter';

/**
 * TransitionManager — orchestrates page routing via Taxi.
 *
 * Wraps every transition with shared logic:
 *   - Stop/start smooth scroll
 *   - Emit transition:start / transition:complete events
 *   - Reinitialize DOM components
 *
 * To add page-specific transitions:
 *   1. Create a class extending Transition in transitions/pages/
 *   2. Pass it in the pageTransitions config
 */
export default class TransitionManager {
	constructor({ pageTransitions = {} } = {}) {
		this.scroll = new SmoothScroll();
		this.component = new Components();
		this.pageTransitions = pageTransitions;
		this.init();
	}

	/**
	 * Wrap a Transition class with shared orchestration logic.
	 */
	createTransitions(TransitionClass) {
		const scrollInstance = this.scroll;

		return class extends TransitionClass {
			onLeave({ from, trigger, done }) {
				scrollInstance.stopScroll();
				emitter.emit('transition:start');

				if (
					from.hasAttribute('data-loader') ||
					from.classList.contains('loader')
				) {
					const realView = document.querySelector('[data-taxi-view]');
					this.fromElement = realView || from;
				} else {
					this.fromElement = from;
				}

				super.onLeave({ from, trigger, done });
			}

			onEnter({ to, trigger, done }) {
				to.classList.add('is-transition');

				super.onEnter({ to, trigger }, () => {
					if (this.fromElement) {
						this.fromElement.remove();
					}

					to.classList.remove('is-transition');
					window.scrollTo(0, 0);
					scrollInstance.startScroll();
					new Components();
					emitter.emit('transition:complete');
					done();
				});
			}
		};
	}

	/**
	 * Create a smart router that delegates to page-specific transitions.
	 */
	createRoute() {
		const Global = this.createTransitions(GlobalTransition);
		const wrappedTransitions = {};

		for (const [name, TransClass] of Object.entries(
			this.pageTransitions,
		)) {
			wrappedTransitions[name] = this.createTransitions(TransClass);
		}

		return class extends Global {
			constructor(options) {
				super(options);
				this.specificTransitions = {};
				for (const [name, WrappedClass] of Object.entries(
					wrappedTransitions,
				)) {
					this.specificTransitions[name] = new WrappedClass(options);
				}
			}

			onEnter(args, done) {
				const path = window.location.pathname;

				// Check if any page-specific transition matches the URL
				for (const [name, trans] of Object.entries(
					this.specificTransitions,
				)) {
					if (path.includes(name)) {
						trans.fromElement = this.fromElement;
						trans.onEnter(args, done);
						return;
					}
				}

				// Fallback to global
				super.onEnter(args, done);
			}
		};
	}

	init() {
		const transitions = {
			default: this.createRoute(),
		};

		// Also register page-specific transitions for data-taxi-view matching
		for (const [name, TransClass] of Object.entries(
			this.pageTransitions,
		)) {
			transitions[name] = this.createTransitions(TransClass);
		}

		this.taxi = new Core({
			links:
				'a:not([target]):not([href^=\\#]):not([data-taxi-ignore])',
			removeOldContent: false,
			transitions,
		});
	}
}
