import ComponentCore from '@/components/_core/ComponentCore';
import SmoothScroll from '@utils/SmoothScroll';
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';

gsap.registerPlugin(Flip);

export default class Lightbox extends ComponentCore {
	constructor() {
		super();
		this.galleries = [];
		this.scrollInstance = new SmoothScroll();
		this.init();
	}

	createElements() {
		this.containers = document.querySelectorAll('[data-gallery]');
		if (!this.containers.length) return;

		this.containers.forEach((container) => {
			const gallery = {
				container,
				wrapper: container.querySelector('[data-lightbox="wrapper"]'),
				triggers: container.querySelectorAll(
					'[data-lightbox="trigger"]',
				),
				triggerParents: container.querySelectorAll(
					'[data-lightbox="trigger-parent"]',
				),
				items: container.querySelectorAll('[data-lightbox="item"]'),
				nav: container.querySelectorAll('[data-lightbox="nav"]'),
				counter: {
					current: container.querySelector(
						'[data-lightbox="counter-current"]',
					),
					total: container.querySelector(
						'[data-lightbox="counter-total"]',
					),
				},
				buttons: {
					prev: container.querySelector('[data-lightbox="prev"]'),
					next: container.querySelector('[data-lightbox="next"]'),
					close: container.querySelector('[data-lightbox="close"]'),
				},
				timeline: gsap.timeline(),
			};

			if (gallery.counter.total) {
				gallery.counter.total.textContent = gallery.triggers.length;
			}

			this.galleries.push(gallery);
		});
	}

	createEvents() {
		this.handleTriggerClick = (gallery, index) => {
			this.open(gallery, index);
		};

		this.handleOutsideClick = (gallery, event) => {
			if (event.detail === 0) return;

			const clickedElement = event.target;
			const isOutside = !clickedElement.closest(
				'[data-lightbox="item"].is-active img, [data-lightbox="nav"], [data-lightbox="close"], [data-lightbox="trigger"]',
			);

			if (isOutside) {
				this.close(gallery);
			}
		};

		this.handleNext = (gallery) => {
			const currentIndex = Array.from(gallery.items).findIndex(
				(item) => item.classList.contains('is-active'),
			);
			const nextIndex = (currentIndex + 1) % gallery.items.length;
			this.updateActiveItem(gallery, nextIndex);
		};

		this.handlePrev = (gallery) => {
			const currentIndex = Array.from(gallery.items).findIndex(
				(item) => item.classList.contains('is-active'),
			);
			const prevIndex =
				(currentIndex - 1 + gallery.items.length) %
				gallery.items.length;
			this.updateActiveItem(gallery, prevIndex);
		};

		this.handleClose = (gallery) => {
			this.close(gallery);
		};

		this.handleKeydown = (event) => {
			const activeGallery = this.galleries.find((g) =>
				g.wrapper.classList.contains('is-active'),
			);
			if (!activeGallery) return;

			switch (event.key) {
				case 'Escape':
					this.close(activeGallery);
					break;
				case 'ArrowRight':
					this.handleNext(activeGallery);
					break;
				case 'ArrowLeft':
					this.handlePrev(activeGallery);
					break;
			}
		};

		// Store bound handlers per gallery for cleanup
		this.galleries.forEach((gallery) => {
			gallery._handlers = {
				triggers: [],
				outsideClick: (e) => this.handleOutsideClick(gallery, e),
				next: () => this.handleNext(gallery),
				prev: () => this.handlePrev(gallery),
				close: () => this.handleClose(gallery),
			};

			gallery.triggers.forEach((trigger, index) => {
				const handler = () => this.handleTriggerClick(gallery, index);
				gallery._handlers.triggers.push(handler);
			});
		});
	}

	addEventListeners() {
		this.galleries.forEach((gallery) => {
			gallery.triggers.forEach((trigger, index) => {
				trigger.addEventListener(
					'click',
					gallery._handlers.triggers[index],
				);
			});

			if (gallery.buttons.next) {
				gallery.buttons.next.addEventListener(
					'click',
					gallery._handlers.next,
				);
			}
			if (gallery.buttons.prev) {
				gallery.buttons.prev.addEventListener(
					'click',
					gallery._handlers.prev,
				);
			}
			if (gallery.buttons.close) {
				gallery.buttons.close.addEventListener(
					'click',
					gallery._handlers.close,
				);
			}
		});

		document.addEventListener('keydown', this.handleKeydown);
	}

	removeEventListeners() {
		this.galleries.forEach((gallery) => {
			gallery.triggers.forEach((trigger, index) => {
				trigger.removeEventListener(
					'click',
					gallery._handlers.triggers[index],
				);
			});

			if (gallery.buttons.next) {
				gallery.buttons.next.removeEventListener(
					'click',
					gallery._handlers.next,
				);
			}
			if (gallery.buttons.prev) {
				gallery.buttons.prev.removeEventListener(
					'click',
					gallery._handlers.prev,
				);
			}
			if (gallery.buttons.close) {
				gallery.buttons.close.removeEventListener(
					'click',
					gallery._handlers.close,
				);
			}

			gallery.container.removeEventListener(
				'click',
				gallery._handlers.outsideClick,
			);
		});

		document.removeEventListener('keydown', this.handleKeydown);
	}

	open(gallery, index) {
		gallery.timeline.clear();
		gsap.killTweensOf([
			gallery.wrapper,
			gallery.nav,
			gallery.triggerParents,
		]);

		const trigger = gallery.triggers[index];
		const img = trigger.querySelector('img');
		const state = Flip.getState(img);

		// Lock trigger + parent dimensions so grid doesn't collapse when img leaves
		const triggerRect = trigger.getBoundingClientRect();
		trigger.parentElement.style.height = `${triggerRect.height}px`;
		trigger.style.width = `${triggerRect.width}px`;
		trigger.style.height = `${triggerRect.height}px`;

		// Mark original element and parent
		trigger.setAttribute('data-lightbox', 'original-parent');
		img.setAttribute('data-lightbox', 'original');

		gallery._openedIndex = index;
		this.updateActiveItem(gallery, index);

		// Listen for outside clicks
		gallery.container.addEventListener(
			'click',
			gallery._handlers.outsideClick,
		);

		// Stop scroll
		this.scrollInstance.stopScroll();

		const tl = gsap.timeline();
		gallery.wrapper.classList.add('is-active');
		const targetItem = gallery.items[index];

		// Hide the original image in the lightbox item
		const lightboxImage = targetItem.querySelector('img');
		if (lightboxImage) {
			lightboxImage.style.display = 'none';
		}

		// Fade out other grid items
		gallery.triggerParents.forEach((otherTrigger) => {
			if (otherTrigger !== trigger) {
				gsap.to(otherTrigger, {
					autoAlpha: 0.8,
					duration: 0.3,
					overwrite: true,
				});
			}
		});

		// FLIP clicked image into lightbox
		if (!targetItem.contains(img)) {
			targetItem.appendChild(img);
			tl.add(
				Flip.from(state, {
					targets: img,
					absolute: false,
					duration: 0.8,
					ease: 'expo.inOut',
					scale: true,
				}),
				0,
			);
		}

		// Animate background and nav
		tl.to(
			gallery.wrapper,
			{
				backgroundColor: 'rgba(0,0,0,0.9)',
				duration: 0.4,
			},
			0.2,
		).fromTo(
			gallery.nav,
			{ autoAlpha: 0, y: '2rem' },
			{
				autoAlpha: 1,
				y: '0rem',
				duration: 0.6,
				stagger: { each: 0.1, from: 'start' },
			},
			0.2,
		);

		gallery.timeline.add(tl);
	}

	close(gallery) {
		gallery.timeline.clear();
		gsap.killTweensOf([
			gallery.wrapper,
			gallery.nav,
			gallery.triggerParents,
			gallery.items,
			gallery.container.querySelector('[data-lightbox="original"]'),
		]);

		const originalImg = gallery.container.querySelector(
			'[data-lightbox="original"]',
		);
		const originalTrigger = gallery.container.querySelector(
			'[data-lightbox="original-parent"]',
		);

		// Store ref to the height-locked element before restoring attributes
		const heightLockedEl = originalTrigger
			? originalTrigger.parentElement
			: null;

		// Did the user navigate to a different slide?
		const currentIndex = Array.from(gallery.items).findIndex((item) =>
			item.classList.contains('is-active'),
		);
		const navigated = currentIndex !== gallery._openedIndex;

		const cleanup = () => {
			gallery.wrapper.classList.remove('is-active');
			gsap.set(gallery.wrapper, { clearProps: 'zIndex' });

			gallery.items.forEach((item) => {
				item.classList.remove('is-active');
				const lightboxImage = item.querySelector('img');
				if (lightboxImage) {
					lightboxImage.style.display = '';
				}
			});

			if (heightLockedEl) {
				heightLockedEl.style.removeProperty('height');
			}

			if (originalTrigger) {
				originalTrigger.style.removeProperty('width');
				originalTrigger.style.removeProperty('height');
			}

			gsap.set(gallery.triggerParents, {
				clearProps: 'opacity,visibility',
			});

			this.scrollInstance.startScroll();
		};

		if (!navigated && originalImg && originalTrigger) {
			// Capture state while image is in lightbox (inside wrapper = above everything)
			const state = Flip.getState(originalImg);

			// Fit image to trigger's rect WITHOUT moving it in the DOM — stays in wrapper
			Flip.fit(originalImg, originalTrigger, { scale: true });

			// Animate from lightbox position to fitted trigger position
			Flip.from(state, {
				targets: originalImg,
				scale: true,
				absolute: true,
				duration: 0.8,
				ease: 'expo.out',
				onComplete: () => {
					// NOW move to trigger and clean up
					originalTrigger.appendChild(originalImg);
					gsap.set(originalImg, { clearProps: 'all' });
					originalTrigger.setAttribute('data-lightbox', 'trigger');
					originalImg.removeAttribute('data-lightbox');
					cleanup();
				},
			});
		} else {
			// Navigated to a different slide — fade out active slide, silently return original img
			const activeItem = gallery.items[currentIndex];

			if (originalImg && originalTrigger) {
				gsap.set(originalImg, { clearProps: 'all' });
				originalTrigger.appendChild(originalImg);
				originalTrigger.setAttribute('data-lightbox', 'trigger');
				originalImg.removeAttribute('data-lightbox');
			}

			gsap.to(activeItem, {
				autoAlpha: 0,
				duration: 0.3,
				ease: 'power3.out',
				onComplete: cleanup,
			});
		}

		// Fade out nav, wrapper bg, fade in trigger parents — all simultaneously
		const tl = gsap.timeline({
			defaults: { ease: 'power3.out' },
		});

		tl.to(
			gallery.nav,
			{
				autoAlpha: 0,
				y: '1rem',
				duration: 0.4,
				stagger: 0,
			},
			0,
		)
			.to(
				gallery.wrapper,
				{
					backgroundColor: 'rgba(0,0,0,0)',
					duration: 0.4,
				},
				0,
			)
			.to(
				gallery.triggerParents,
				{
					autoAlpha: 1,
					duration: 1,
					overwrite: true,
				},
				0,
			);

		gallery.timeline.add(tl);

		// Remove outside click listener
		gallery.container.removeEventListener(
			'click',
			gallery._handlers.outsideClick,
		);
	}

	updateActiveItem(gallery, index) {
		gallery.items.forEach((item) =>
			item.classList.remove('is-active'),
		);
		gallery.items[index].classList.add('is-active');

		if (gallery.counter.current) {
			gallery.counter.current.textContent = index + 1;
		}
	}

	destroy() {
		this.galleries.forEach((gallery) => {
			gallery.timeline.kill();
			gsap.killTweensOf([
				gallery.wrapper,
				gallery.nav,
				gallery.triggerParents,
				gallery.items,
			]);
		});
		super.destroy();
		this.galleries = [];
	}
}
