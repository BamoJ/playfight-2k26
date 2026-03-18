import { Mesh, PlaneGeometry } from 'three';
import { gsap } from 'gsap';
import CustomEase from 'gsap/CustomEase';
import emitter from '@utils/Emitter';

gsap.registerPlugin(CustomEase);

const FADE = {
	duration: 0.3,
	ease: 'sine.in',
};

const TRANSITION = CustomEase.create('transition', '0.4, 0, 0.2, 1');

/**
 * TransitionController — handles cross-page WebGL mesh transitions.
 *
 * Pattern: Clone mesh → animate to target DOM position → handoff to HTML.
 *
 * State machine:
 *   [Idle] → webgl:transition:prepare → [Waiting] → webgl:transition:target-ready → [Animating] → [Complete] → [Idle]
 *
 * Events consumed:
 *   - webgl:transition:prepare   { mesh, targetUrl, sourcePage, startPosition? }
 *   - webgl:transition:target-ready  { rect, viewport, screen }
 *
 * Events emitted:
 *   - webgl:transition:handoff   (HTML image can fade in)
 *   - webgl:transition:complete  (cleanup done)
 */
export class TransitionController {
	constructor(canvas) {
		this.canvas = canvas;
		this.transitionMesh = null;
		this.timeline = null;
		this.activePageTransition = null;

		emitter.on(
			'webgl:transition:prepare',
			this.handleTransitionPrepare.bind(this),
		);
		emitter.on(
			'webgl:transition:target-ready',
			this.handleTargetReady.bind(this),
		);
	}

	handleTransitionPrepare(data) {
		if (window.matchMedia('(max-width: 768px)').matches) return;

		const { mesh, targetUrl, sourcePage, startPosition } = data;
		if (!mesh) return;

		if (this.activePageTransition) {
			this.cancelPageTransition();
		}

		this.startTransition(mesh, targetUrl, sourcePage, startPosition);
	}

	startTransition(sourcePlane, targetUrl, sourcePage, startPosition) {
		if (!sourcePlane) return;

		// Clone material with deep-copied uniforms
		const clonedMaterial = sourcePlane.material.clone();
		clonedMaterial.transparent = true;
		clonedMaterial.opacity = 1;

		if (
			sourcePlane.material.uniforms &&
			sourcePlane.material.uniforms.uOpacity
		) {
			gsap.killTweensOf(sourcePlane.material.uniforms.uOpacity);
			sourcePlane.material.uniforms.uOpacity.value = 1;
		}

		if (sourcePlane.material.uniforms) {
			Object.keys(sourcePlane.material.uniforms).forEach((key) => {
				if (clonedMaterial.uniforms[key]) {
					const sourceValue =
						sourcePlane.material.uniforms[key].value;

					if (Array.isArray(sourceValue)) {
						clonedMaterial.uniforms[key].value = [...sourceValue];
					} else if (
						sourceValue &&
						typeof sourceValue === 'object' &&
						sourceValue.clone
					) {
						clonedMaterial.uniforms[key].value = sourceValue.clone();
					} else if (sourceValue && typeof sourceValue === 'object') {
						clonedMaterial.uniforms[key].value = {
							...sourceValue,
						};
					} else {
						clonedMaterial.uniforms[key].value = sourceValue;
					}
				}
			});
		}

		if (clonedMaterial.uniforms.uOpacity) {
			clonedMaterial.uniforms.uOpacity.value = 1;
		}

		this.transitionMesh = new Mesh(
			sourcePlane.geometry,
			clonedMaterial,
		);

		this.transitionMesh.position.copy(sourcePlane.position);
		this.transitionMesh.scale.set(1, 1, 1);
		this.transitionMesh.rotation.copy(sourcePlane.rotation);

		if (
			startPosition &&
			typeof startPosition.x === 'number' &&
			!isNaN(startPosition.x) &&
			typeof startPosition.y === 'number' &&
			!isNaN(startPosition.y)
		) {
			this.transitionMesh.position.x = startPosition.x;
			this.transitionMesh.position.y = startPosition.y;
		}

		this.transitionMesh.userData = { ...sourcePlane.userData };
		this.canvas.scene.add(this.transitionMesh);
		this.transitionMesh.visible = true;
		sourcePlane.visible = false;

		this.activePageTransition = {
			status: 'waiting-for-target',
			mesh: this.transitionMesh,
			sourcePlane,
			targetUrl,
			sourcePage,
			startTime: Date.now(),
		};

		this.timeline = gsap.timeline();

		/* ====================================================
		 *
		 *
		 *  RESET — zero out interaction uniforms so the
		 *  clone starts clean (no hover, scroll, or bulge
		 *  artifacts carrying into the transition)
		 *
		 *
		 * ==================================================== */
		const uniforms = this.transitionMesh.material.uniforms;

		if (uniforms.uHover) {
			gsap.killTweensOf(uniforms.uHover);
			this.timeline.to(
				uniforms.uHover,
				{ value: 0, duration: 0.1, ease: 'power2.out' },
				0,
			);
		}

		if (uniforms.uOffset?.value) {
			this.timeline.to(
				uniforms.uOffset.value,
				{ x: 0, y: 0, duration: 0.1, ease: 'power2.out' },
				0,
			);
		}

		if (uniforms.uMouseVelocity?.value) {
			this.timeline.to(
				uniforms.uMouseVelocity.value,
				{ x: 0, y: 0, duration: 0.5, ease: 'power2.out' },
				0,
			);
		}

		if (uniforms.uReveal) {
			this.timeline.to(
				uniforms.uReveal,
				{ value: 1.0, duration: 0.1, ease: 'power2.out' },
				0,
			);
		}

		if (uniforms.uBulge) {
			this.timeline.to(
				uniforms.uBulge,
				{ value: 0, duration: 0.35, ease: 'sine.out' },
				0,
			);
		}

		if (uniforms.uStrength) {
			this.timeline.to(
				uniforms.uStrength,
				{ value: 0, duration: 0.35, ease: 'sine.out' },
				0,
			);
		}
	}

	async animateToDOM(targetRect, viewport, screen) {
		if (!this.transitionMesh || !targetRect) return;

		const targetWidth =
			(targetRect.width / screen.width) * viewport.width;
		const targetHeight =
			(targetRect.height / screen.height) * viewport.height;
		const targetX =
			((targetRect.left + targetRect.width / 2) / screen.width) *
				viewport.width -
			viewport.width / 2;
		const targetY =
			viewport.height / 2 -
			((targetRect.top + targetRect.height / 2) / screen.height) *
				viewport.height;

		this.timeline = gsap.timeline({
			onComplete: () => this.cleanup(),
		});

		/* ====================================================
		 *
		 *
		 *  POSITION — fly mesh to target DOM coordinates
		 *
		 *
		 * ==================================================== */
		this.timeline.to(
			this.transitionMesh.position,
			{
				x: targetX,
				y: targetY,
				z: 0,
				duration: 1.25,
				ease: 'expo.inOut',
			},
			0,
		);

		/* ====================================================
		 *
		 *
		 *  HANDOFF — Emitter/Signal HTML image to fade in
		 *
		 *
		 * ==================================================== */
		this.timeline.call(
			() => emitter.emit('webgl:transition:handoff'),
			null,
			1.3,
		);

		/* ====================================================
		 *
		 *
		 *  FADE — dissolve WebGL plane after handoff
		 *
		 *
		 * ==================================================== */
		if (this.transitionMesh.material.uniforms.uOpacity) {
			this.timeline.to(
				this.transitionMesh.material.uniforms.uOpacity,
				{ value: 0, duration: FADE.duration, ease: FADE.ease },
				1.5,
			);
		} else {
			this.timeline.to(
				this.transitionMesh.material,
				{ opacity: 0, duration: FADE.duration, ease: FADE.ease },
				1.5,
			);
		}

		/* ====================================================
		 *
		 *
		 *  SIZE — morph geometry to target dimensions
		 *
		 *
		 * ==================================================== */
		const startWidth =
			this.transitionMesh.geometry.parameters.width *
			this.transitionMesh.scale.x;
		const startHeight =
			this.transitionMesh.geometry.parameters.height *
			this.transitionMesh.scale.y;

		const sizeProxy = {
			width: startWidth,
			height: startHeight,
			progress: 0,
		};

		this.timeline.to(
			sizeProxy,
			{
				width: targetWidth,
				height: targetHeight,
				progress: 1,
				duration: 1.25,
				ease: 'expo.inOut',
				onUpdate: () => {
					const oldGeometry = this.transitionMesh.geometry;
					this.transitionMesh.geometry = new PlaneGeometry(
						sizeProxy.width,
						sizeProxy.height,
						64,
						64,
					);
					this.transitionMesh.scale.set(1, 1, 1);
					oldGeometry.dispose();
				},
			},
			0,
		);

		/* ====================================================
		 *
		 *
		 *  SHADER — sine wave distortion during flight
		 *
		 *
		 * ==================================================== */
		if (
			this.transitionMesh.material.uniforms.uPageTransition ===
			undefined
		) {
			this.transitionMesh.material.uniforms.uPageTransition = {
				value: 0,
			};
		} else {
			this.transitionMesh.material.uniforms.uPageTransition.value = 0;
		}

		this.timeline.to(
			this.transitionMesh.material.uniforms.uPageTransition,
			{ value: 1, duration: 1.25, ease: 'power1.inOut' },
			0,
		);

		/* ====================================================
		 *
		 *
		 *  UV COVER — animate uCoverScale source → target
		 *
		 *
		 * ==================================================== */
		const uniforms = this.transitionMesh.material.uniforms;
		if (uniforms.uCoverScale && this.transitionMesh.userData.img) {
			const img = this.transitionMesh.userData.img;
			const imgAspect = img.naturalWidth / img.naturalHeight;
			const targetAspect = targetWidth / targetHeight;

			const targetCoverScale =
				imgAspect > targetAspect
					? [targetAspect / imgAspect, 1.0]
					: [1.0, imgAspect / targetAspect];

			const sourceCoverScale = [...uniforms.uCoverScale.value];

			const coverProxy = { t: 0 };
			this.timeline.to(
				coverProxy,
				{
					t: 1,
					duration: 1.25,
					ease: 'expo.inOut',
					onUpdate: () => {
						uniforms.uCoverScale.value[0] =
							sourceCoverScale[0] +
							(targetCoverScale[0] - sourceCoverScale[0]) *
								coverProxy.t;
						uniforms.uCoverScale.value[1] =
							sourceCoverScale[1] +
							(targetCoverScale[1] - sourceCoverScale[1]) *
								coverProxy.t;
					},
				},
				0,
			);
		}
	}

	handleTargetReady({ rect, viewport, screen }) {
		if (!this.activePageTransition) return;
		if (this.activePageTransition.status !== 'waiting-for-target')
			return;

		this.activePageTransition.status = 'animating';
		this.animateToDOM(rect, viewport, screen);

		if (this.timeline) {
			this.timeline.eventCallback('onComplete', () => {
				if (this.activePageTransition) {
					this.activePageTransition.status = 'complete';
				}
				this.cleanup();
				this.activePageTransition = null;
			});
		}
	}

	hasActiveTransition() {
		return this.activePageTransition !== null;
	}

	cancelPageTransition() {
		if (this.activePageTransition) {
			this.cleanup();
			this.activePageTransition = null;
		}
	}

	cleanup() {
		if (this.transitionMesh) {
			this.canvas.scene.remove(this.transitionMesh);
			this.transitionMesh.geometry.dispose();
			this.transitionMesh.material.dispose();
			this.transitionMesh = null;
		}

		if (
			this.activePageTransition &&
			this.activePageTransition.sourcePlane
		) {
			this.activePageTransition.sourcePlane.visible = true;
		}

		if (this.timeline) {
			this.timeline.kill();
			this.timeline = null;
		}
	}

	cancel() {
		this.cleanup();
	}
}
