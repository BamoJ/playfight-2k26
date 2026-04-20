import AnimationCore from '@animations/_core/AnimationCore';
import { isTabletOrMobile } from '@utils/device';

export default class CountingNumbers extends AnimationCore {
	constructor(element) {
		super(element, {
			triggerStart: 'top 75%',
			duration: 2.5,
			ease: 'power1.out',
			cleanup: false,
		});

		this.originalHTML = this.element.innerHTML;
		this.isMobile = isTabletOrMobile();
	}

	createElements() {
		const text = this.element.textContent.trim();

		// Parse suffix: trailing alphabetic chars + % (with optional space before)
		const suffixMatch = text.match(/(\s*[A-Za-z%]+)$/);
		this.suffix = suffixMatch ? suffixMatch[0] : '';
		const numberStr = this.suffix
			? text.slice(0, -this.suffix.length)
			: text;

		// Detect decimal precision for snap
		const decimalMatch = numberStr.match(/\.(\d+)/);
		this.decimals = decimalMatch ? decimalMatch[1].length : 0;
		this.snapValue =
			this.decimals > 0 ? Math.pow(10, -this.decimals) : 1;

		// Wrap number and suffix in separate spans
		this.numberSpan = document.createElement('span');
		this.numberSpan.textContent = numberStr;
		this.element.textContent = '';
		this.element.appendChild(this.numberSpan);

		if (this.suffix) {
			this.suffixSpan = document.createElement('span');
			this.suffixSpan.textContent = this.suffix;
			this.suffixSpan.style.opacity = '0';
			this.element.appendChild(this.suffixSpan);
		}
	}

	animate() {
		if (this.isMobile) {
			this.timeline.from(this.element, {
				opacity: 0,
				duration: 0.85,
				ease: 'sine.out',
			});
			return;
		}

		this.timeline.from(this.numberSpan, {
			yPercent: 100,
			opacity: 0,
			innerText: '0',
			duration: this.options.duration,
			ease: this.options.ease,
			snap: { innerText: this.snapValue },
		});

		if (this.suffixSpan) {
			this.timeline.to(
				this.suffixSpan,
				{
					opacity: 1,
					yPercent: 0,
					duration: 2,
					ease: 'power1.out',
				},
				'<',
			);
		}
	}

	destroy() {
		this.element.innerHTML = this.originalHTML;
		super.destroy();
	}
}
