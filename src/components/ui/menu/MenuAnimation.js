import { gsap } from 'gsap';

export const MenuAnimations = {
	open: ({ menu, menuLineTop, menuLineBottom }) => {
		const tl = gsap.timeline();

		tl.to(menu, {
			clipPath: 'inset(0 0 0% 0%)',
			duration: 1.6,
			ease: 'expo.inOut',
		});
		tl.to(
			menuLineTop,
			{
				y: 4,
				duration: 0.6,
				ease: 'power4.out',
			},
			'<+.35',
		);
		tl.to(
			menuLineBottom,
			{
				y: -4,
				duration: 0.6,
				ease: 'power4.out',
			},
			'<',
		)
			.to(
				menuLineTop,
				{
					rotate: -45,
					duration: 0.6,
					ease: 'circ.inOut',
				},
				'<+.1',
			)
			.to(
				menuLineBottom,
				{
					rotate: 45,
					duration: 0.6,
					ease: 'circ.inOut',
				},
				'<',
			);

		return tl;
	},

	close: ({ menu, menuLineTop, menuLineBottom }) => {
		const tl = gsap.timeline();

		tl.to(menuLineTop, {
			y: 0,
			rotate: 0,
			duration: 0.4,
			ease: 'expo.out',
		});
		tl.to(
			menuLineBottom,
			{
				y: 0,
				rotate: 0,
				duration: 0.4,
				ease: 'expo.out',
			},
			'<',
		);
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
