import { Core } from '@unseenco/taxi';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SmoothScroll from '@utils/SmoothScroll';
import Components from '@components';
import emitter from '@utils/Emitter';
import GlobalTransition from './global/GlobalEnter';
import Animation from '@/animations';
import ThemeSwitch from '@utils/ThemeSwitch';

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
		this.pageTransitions = pageTransitions;
		this.init();
		this.themeSwitch = new ThemeSwitch();
		this.component = new Components();
		this.animation = new Animation();
	}

	/**
	 * Wrap a Transition class with shared orchestration logic.
	 */
	createTransitions(TransitionClass) {
		const scrollInstance = this.scroll;
		const manager = this;

		return class extends TransitionClass {
			onLeave({ from, trigger, done }) {
				scrollInstance.stopScroll();
				document.documentElement.style.overflow = 'hidden';
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
				// Snap body + first-child background to new theme instantly
				const firstChild = document.body.firstElementChild;
				document.body.style.transition = 'none';
				if (firstChild) firstChild.style.transition = 'none';
				requestAnimationFrame(() => {
					document.body.style.transition = '';
					if (firstChild) firstChild.style.transition = '';
				});

				to.classList.add('is-transition');

				super.onEnter({ to, trigger }, () => {
					const wasNavHidden =
						manager.component?.instances?.hideNav?._st?.isActive;
					if (manager.component) manager.component.destroy();
					if (manager.animation) manager.animation.destroy();
					if (this.fromElement) {
						this.fromElement.remove();
					}

					scrollInstance.scrollTo(0);
					to.classList.remove('is-transition');
					document.documentElement.style.overflow = '';
					scrollInstance.resize();
					scrollInstance.startScroll();
					manager.animation = new Animation();
					manager.component = new Components();

					const fromFooter =
						trigger instanceof Element &&
						trigger.closest('[data-footer]');
					if (fromFooter || wasNavHidden) {
						const hideNav = manager.component.instances.hideNav;
						if (hideNav) {
							hideNav.startHidden();
							gsap.delayedCall(0.5, () => hideNav._show());
						}
					}

					ScrollTrigger.refresh();

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
				// Back/forward button → always use GlobalEnter
				if (!(args.trigger instanceof Element)) {
					super.onEnter(args, done);
					return;
				}

				const path = window.location.pathname;

				// Check if any page-specific transition matches the URL
				for (const [name, trans] of Object.entries(
					this.specificTransitions,
				)) {
					const isHome =
						name === 'home' &&
						(path === '/' ||
							path === '/index' ||
							path === '/index.html');
					if (isHome || path.includes(name)) {
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
