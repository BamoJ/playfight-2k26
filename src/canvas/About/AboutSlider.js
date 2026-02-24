import { DOMPlane } from '../DOMPlane';
import { gsap } from 'gsap';
import emitter from '@utils/Emitter';
import defaultVert from '../shaders/defaultVert.glsl';
import defaultFrag from '../shaders/defaultFrag.glsl';

export class AboutSlider extends DOMPlane {
	constructor(options) {
		super(options);
		this.planes = [];
		this.init();
	}

	createSlider() {}
}
