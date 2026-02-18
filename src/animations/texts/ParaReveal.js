import AnimationCore from '@animations/_core/AnimationCore';
import { SplitText } from 'gsap/SplitText';
import { easings } from '@utils/easings';
export default class ParaReveal extends AnimationCore {
	constructor(element) {
		super(element, {
			triggerStart: 'top 75%',
			duration: 1.2,
			ease: easings.paragraphEase,
		});

		// IMPORTANT: If element has display:contents, use first child as trigger
		const computedStyle = window.getComputedStyle(element);
		if (computedStyle.display === 'contents') {
			this.triggerElement = element.querySelector(
				'p, h1, h2, h3, h4, h5, h6, li',
			);
		}
		this.element.originalContent = this.element.innerHTML;
		this.isMobile = window.matchMedia('(max-width: 991px)').matches;

		// Split text immediately
		this.splitText();

		if (!this.isMobile) {
			let windowWidth = window.innerWidth;
			window.addEventListener('resize', () => {
				if (windowWidth !== window.innerWidth) {
					windowWidth = window.innerWidth;
					if (this.timeline) this.timeline.kill();
					if (this.scrollTrigger) this.scrollTrigger.kill();
					this.element.innerHTML = this.element.originalContent;
					this.splitText();
					// Re-initialize after resize
					this.createTimeline();
					this.animate();
					this.createScrollTrigger();
				}
			});
		}
	}

	splitText() {
		// Prevent double-splitting by reverting any existing split
		if (this.element._split) {
			this.element._split.revert();
		}

		// Split richtext paragraphs into lines
		const richTextElements = this.element.querySelectorAll(
			'p, h1, h2, h3, h4, h5, h6, li',
		);

		// Skip SplitText on mobile
		if (this.isMobile) {
			return;
		}

		if (richTextElements.length > 0) {
			this.element._split = new SplitText(richTextElements, {
				type: 'lines',
				mask: 'lines',
				linesClass: 'lineChildren',
			});
		}
	}

	animate() {
		if (this.isMobile) {
			// Mobile: fade-in the children (not the parent which has display:contents)
			const children = this.element.querySelectorAll(
				'p, h1, h2, h3, h4, h5, h6, li',
			);
			this.timeline.from(children, {
				opacity: 0,
				duration: 0.85,
				ease: 'sine.out',
			});
			return;
		}

		const lineElements =
			this.element.querySelectorAll('.lineChildren');
		if (lineElements.length === 0) return;

		this.timeline.fromTo(
			lineElements,
			{ yPercent: 100 },
			{
				yPercent: 0,
				duration: this.options.duration,
				ease: this.options.ease,
				stagger: 0.035,
			},
		);
	}

	destroy() {
		super.destroy();
	}
}
