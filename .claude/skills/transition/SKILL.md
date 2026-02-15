---
name: transition
description: Build page transitions with Taxi.js routing, Lenis smooth scroll, and WebGL TransitionController. Use when creating page-to-page navigation, cross-page WebGL mesh animations, or custom transition effects.
user-invocable: true
---

# Transition — Page Routing + WebGL Transitions

## Architecture Overview

Three systems work together:
1. **Taxi.js** (`@unseenco/taxi`) — SPA-style page routing, fetches new pages, swaps DOM
2. **TransitionManager** (`src/transitions/index.js`) — Wraps Taxi with shared lifecycle (scroll, canvas, components, animations)
3. **TransitionController** (`src/canvas/TransitionController.js`) — WebGL mesh clone + fly animation between pages

Lenis (`src/utils/smoothscroll.js`) handles smooth scroll and pauses during transitions.

## TransitionManager — The Orchestrator

`src/transitions/index.js`

Wraps every Taxi transition with:

### onLeave (before navigation):
1. `scroll.stopScroll()` — pauses Lenis
2. `emitter.emit('transition:start')` — global signal
3. Handles loader element edge case (if `from` is `[data-loader]`, uses `[data-taxi-view]` instead)

### onEnter (after new page loads):
1. Adds `.is-transition` CSS class to new page (positions it `fixed` for cross-fade)
2. Calls `super.onEnter()` with completion callback
3. On completion: removes old DOM element, resets scroll to top, `scroll.startScroll()`
4. Re-creates `Components` and `Animation` instances
5. `emitter.emit('transition:complete')` — global signal
6. Calls `canvas.onChange(pageName, to)` — swaps WebGL page

### Page Detection

`detectPageName(pageElement)` checks:
1. `data-page` attribute on the element
2. `data-canvas-page` attribute
3. URL path matching against canvas registry keys (`/` maps to `home` or `index`)

## Taxi.js Setup

```js
new Core({
  links: 'a:not([target]):not([href^=\\#]):not([data-taxi-ignore])',
  removeOldContent: false,
  transitions: {
    default: this.createRoute(),
    // ...page-specific transitions
  },
});
```

- **Link interception**: All `<a>` tags except external links (`[target]`), hash links (`#`), and ignored links (`data-taxi-ignore`)
- **`removeOldContent: false`**: Old DOM stays until manually removed in the onEnter callback. This enables cross-fade.

## Default Transition (GlobalEnter)

`src/transitions/global/GlobalEnter.js`

```js
onLeave({ done }) {
  done(); // immediate — no leave animation
}

onEnter({ to, from, done }) {
  // GSAP: fade out old content (0.6s, sine.out)
  // 1500ms safety timeout
  // Calls done() → triggers TransitionManager's completion callback
}
```

## Creating a Page-Specific Transition

### 1. Create the transition class

```js
// src/transitions/pages/YourPageTransition.js
import { Transition } from '@unseenco/taxi';

export default class YourPageTransition extends Transition {
  onLeave({ from, trigger, done }) {
    // Animate old page out
    gsap.to(from, {
      opacity: 0,
      duration: 0.6,
      ease: 'sine.out',
      onComplete: done,
    });
  }

  onEnter({ to, from, done }) {
    // Animate new page in
    gsap.fromTo(to,
      { opacity: 0 },
      { opacity: 1, duration: 0.8, ease: 'sine.out', onComplete: done }
    );
  }
}
```

### 2. Register in main.js

```js
import YourPageTransition from '@transitions/pages/YourPageTransition';

const pageTransitions = {
  yourpage: YourPageTransition,
};
```

The TransitionManager wraps your class with shared lifecycle (scroll stop/start, component re-init, canvas page swap). Your `onLeave`/`onEnter` handle only the visual animation.

## WebGL TransitionController

`src/canvas/TransitionController.js`

Handles seamless mesh-to-mesh transitions between pages (e.g., clicking an image on the homepage that flies to the detail page).

### State Machine

```
Idle → waiting-for-target → animating → complete → Idle
```

### Event Flow

```
1. User clicks link
   └── HomeView emits 'webgl:transition:prepare'
       └── TransitionController.startTransition()
           ├── Clones source mesh material (deep copy)
           ├── Creates transitionMesh (shared geometry, cloned material)
           ├── Hides source plane
           └── Sets status: 'waiting-for-target'

2. Taxi navigates, new page loads
   └── New page emits 'webgl:transition:target-ready' with { rect, viewport, screen }
       └── TransitionController.animateToDOM()
           ├── Converts DOM rect → world coordinates
           ├── GSAP timeline (1.5s, expo.inOut):
           │   ├── Position animation to target
           │   ├── Size animation (rebuilds geometry every frame, 64x64 segments)
           │   ├── UV correction for object-fit:cover
           │   └── uPageTransition 0→1 for shader ripple
           ├── At t=1.3s: emits 'webgl:transition:handoff'
           │   └── HTML image fades in underneath
           └── At t=1.5s: fade uOpacity→0, then cleanup

3. Cleanup
   └── Removes transitionMesh, disposes geometry+material
       Restores source plane visibility
```

### Material Deep Copy

TransitionController clones uniforms carefully:
- THREE objects (Vector2, Color): `.clone()`
- Plain objects: spread `{ ...value }`
- Primitives: direct copy

### UV Correction (`correctUVs`)

During size transitions, `object-fit: cover` semantics must be maintained. The controller:
1. Computes ideal UV scale/offset from `img.naturalWidth/naturalHeight` vs current plane aspect
2. Interpolates based on animation progress
3. Applies `shaderZoom` compensation (default 0.9 from fragment shader's `scaleUV`)
4. Mutates geometry UV attributes directly, sets `needsUpdate = true`

### Emitting target-ready from your page

Your new page must emit this event after its WebGL is ready:

```js
// In your target page's create() or onEnter()
const rect = targetElement.getBoundingClientRect();
emitter.emit('webgl:transition:target-ready', {
  rect,
  viewport: this.viewport,
  screen: this.screen,
});
```

## Lenis Smooth Scroll Integration

`src/utils/smoothscroll.js`

**Singleton** — one Lenis instance for the entire app.

Config: `duration: 1.4`, exponential ease-out, `wheelMultiplier: 1.6`, `syncTouches: true`

**GSAP ScrollTrigger sync:**
```js
lenis.on('scroll', () => ScrollTrigger.update());
gsap.ticker.lagSmoothing(0);
```

**During transitions:**
- `scroll.stopScroll()` — prevents scroll during navigation
- After new page loads: `scroll.startScroll()`, `scroll.scrollTo(0, { immediate: true })`

## CSS: `.is-transition`

`src/styles/base.css`

```css
.is-transition {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
}
```

Applied to the incoming page during transition to position it on top of the outgoing page. Removed after transition completes.

## 60fps Rules

1. **Mesh clone, not copy** — TransitionController shares geometry (lightweight), only clones material. Never deep-copy geometry during transitions.
2. **Timeline cleanup** — Always `kill()` GSAP timelines in cleanup. Orphaned tweens accumulate and cause frame drops.
3. **Avoid overlapping transitions** — TransitionController cancels any existing active transition before starting a new one. If you add custom transition logic, guard against double-fire.
4. **Mobile skip** — TransitionController checks `window.matchMedia('(max-width: 768px)').matches` and skips WebGL transitions on mobile. Respect this pattern.
5. **64x64 segments during animation** — The size animation rebuilds PlaneGeometry every frame with 64x64 segments for smooth UV correction. This is expensive but only runs for 1.5s during transitions. Don't increase.
6. **UV correction is per-frame** — `correctUVs()` mutates UV attributes and sets `needsUpdate = true` every frame during the size animation. This triggers GPU re-upload. Acceptable for transition duration, but never use this pattern in steady-state rendering.
7. **Lenis lag smoothing** — `gsap.ticker.lagSmoothing(0)` is set globally. This prevents GSAP from dropping frames during scroll. Don't change this.

## Cross-Browser

- **Safari**: Aggressive tab throttling means transitions might stall if the tab loses focus. Delta capping in Time.js handles recovery.
- **Mobile Safari**: Touch scroll momentum can fight with Lenis. `syncTouches: true` helps. `stopScroll()` during transitions is essential.
- **Firefox**: Different RAF timing can cause slightly different transition durations. Using GSAP timelines (time-based, not frame-based) handles this.

## Key Files

- `src/transitions/index.js` — TransitionManager (Taxi wrapper)
- `src/transitions/Preloader.js` — Loading screen
- `src/transitions/global/GlobalEnter.js` — Default page transition
- `src/canvas/TransitionController.js` — WebGL mesh transition
- `src/utils/smoothscroll.js` — Lenis singleton
- `src/styles/base.css` — `.is-transition` class
- `src/main.js` — Transition registry
