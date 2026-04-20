export const MOBILE_BP = 767;
export const TABLET_BP = 991;

export const isMobile = () =>
	window.matchMedia(`(max-width: ${MOBILE_BP}px)`).matches;

export const isTabletOrMobile = () =>
	window.matchMedia(`(max-width: ${TABLET_BP}px)`).matches;

export const isTouch = () =>
	window.matchMedia('(hover: none), (pointer: coarse)').matches;
