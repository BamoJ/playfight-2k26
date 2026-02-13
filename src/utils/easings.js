import gsap from 'gsap';
import CustomEase from 'gsap/CustomEase';

gsap.registerPlugin(CustomEase);

export const easings = {
	linear: 'linear',

	lineEase: CustomEase.create(
		'lineEase',
		'M0,0 C0.602,0.01 -0.024,0.995 1,1 ',
	),

	paragraphEase: CustomEase.create(
		'paragraphEase',
		'M0,0 C-0.003,0.498 0.294,1 1,1 ',
	),

	transitionEase: CustomEase.create('eazy', '.6,.11,.18,.99'),
};
