import { Mesh, PlaneGeometry } from 'three';
import { gsap } from 'gsap';
import emitter from '@utils/Emitter';

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

					if (
						sourceValue &&
						typeof sourceValue === 'object' &&
						sourceValue.clone
					) {
						clonedMaterial.uniforms[key].value =
							sourceValue.clone();
					} else if (
						sourceValue &&
						typeof sourceValue === 'object'
					) {
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

		// Reset interaction uniforms
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

		if (uniforms.uWaveIntensity) {
			this.timeline.to(
				uniforms.uWaveIntensity,
				{ value: 0, duration: 0.1, ease: 'power2.out' },
				0,
			);
		}

		if (uniforms.uTransition) {
			this.timeline.to(
				uniforms.uTransition,
				{ value: 0, duration: 0.1, ease: 'power2.out' },
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

		// Animate position
		this.timeline.to(
			this.transitionMesh.position,
			{
				x: targetX,
				y: targetY,
				z: 0,
				duration: 1.5,
				ease: 'expo.inOut',
			},
			0,
		);

		// Handoff to HTML
		this.timeline.call(
			() => emitter.emit('webgl:transition:handoff'),
			null,
			1.3,
		);

		// Fade out WebGL plane
		if (this.transitionMesh.material.uniforms.uOpacity) {
			this.timeline.to(
				this.transitionMesh.material.uniforms.uOpacity,
				{ value: 0, duration: 0.5, ease: 'power2.inOut' },
				1.5,
			);
		} else {
			this.timeline.to(
				this.transitionMesh.material,
				{ opacity: 0, duration: 0.5, ease: 'power2.inOut' },
				1.5,
			);
		}

		// Animate geometry size
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
				duration: 1.5,
				ease: 'expo.inOut',
				onUpdate: () => {
					const oldGeometry = this.transitionMesh.geometry;
					this.transitionMesh.geometry = new PlaneGeometry(
						sizeProxy.width,
						sizeProxy.height,
						64,
						64,
					);

					// UV correction for object-fit: cover
					if (this.transitionMesh.userData.img) {
						const img = this.transitionMesh.userData.img;
						if (img.naturalWidth && img.naturalHeight) {
							this.correctUVs(img, sizeProxy);
						}
					}

					this.transitionMesh.scale.set(1, 1, 1);
					oldGeometry.dispose();
				},
			},
			0,
		);

		// Page transition shader effect
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
			{ value: 1, duration: 1.5, ease: 'power1.inOut' },
			0,
		);
	}

	/**
	 * Correct UVs during transition to handle object-fit: cover.
	 */
	correctUVs(img, sizeProxy) {
		const imgAspect = img.naturalWidth / img.naturalHeight;
		const targetAspect = sizeProxy.width / sizeProxy.height;

		let idealUScale = 1,
			idealVScale = 1;
		let idealUOffset = 0,
			idealVOffset = 0;

		if (imgAspect > targetAspect) {
			const visibleU = targetAspect / imgAspect;
			idealUOffset = (1 - visibleU) / 2;
			idealUScale = visibleU;
		} else {
			const visibleV = imgAspect / targetAspect;
			idealVOffset = (1 - visibleV) / 2;
			idealVScale = visibleV;
		}

		const p = sizeProxy.progress;
		const shaderZoom =
			this.transitionMesh.userData.shaderZoom || 1.0;

		const uOffset = idealUOffset * p;
		const vOffset = idealVOffset * p;
		const uScale = 1 + (idealUScale - 1) * p;
		const vScale = 1 + (idealVScale - 1) * p;

		const startComp = 1.0;
		const endComp = 1.0 / shaderZoom;
		const compensation = startComp + (endComp - startComp) * p;

		const uvs =
			this.transitionMesh.geometry.attributes.uv;
		for (let i = 0; i < uvs.count; i++) {
			const u = uvs.getX(i);
			const v = uvs.getY(i);

			let newU = uOffset + u * uScale;
			let newV = vOffset + v * vScale;

			newU = (newU - 0.5) * compensation + 0.5;
			newV = (newV - 0.5) * compensation + 0.5;

			uvs.setXY(i, newU, newV);
		}
		uvs.needsUpdate = true;
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
