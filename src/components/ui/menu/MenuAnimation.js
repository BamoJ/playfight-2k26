import { gsap } from 'gsap';

export const MenuAnimations = {
	open: ({ menu, container, closeBtn }) => {
		const tl = gsap.timeline();

		tl.to(menu, {
			clipPath: 'inset(0 0 0% 0%)',
			duration: 1.6,
			ease: 'expo.inOut',
		}).fromTo(
			closeBtn,
			{ opacity: 0 },
			{
				opacity: 1,
				duration: 1,
				ease: 'sine.out',
			},
			'<+0.2',
		);

		return tl;
	},

	close: ({ background, menu }) => {
		const tl = gsap.timeline();
		tl.to(
			menu,
			{
				clipPath: 'inset(0 0 100% 0%)',
				duration: 1,
				ease: 'expo.out',
			},
			'<',
		);
		return tl;
	},
};
