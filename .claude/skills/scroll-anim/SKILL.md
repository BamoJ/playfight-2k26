---
name: scroll-anim
description: Build scroll-driven DOM animations with GSAP, ScrollTrigger, and SplitText. Use when adding reveal animations, parallax effects, text animations, or any scroll-triggered animation on DOM elements.
user-invocable: true
---

# Scroll Animations — GSAP + ScrollTrigger + SplitText

## Architecture

All scroll animations extend `AnimationCore` (`src/animations/_core/AnimationCore.js`). They're instantiated by the Animation manager (`src/animations/index.js`) which queries data attributes and creates the right class. The manager is re-created on every `transition:complete` event.

## AnimationCore Base Class

`src/animations/_core/AnimationCore.js`

### Lifecycle

```
init() → createElements() → createTimeline() → animate() → createScrollTrigger()
```

### Default Options

```js
{
  triggerStart: 'top 90%',  // ScrollTrigger start position
  duration: 1.5,
  ease: 'power2.out',
  scrub: false,             // false = one-shot, true/number = scrub
  cleanup: true,            // self-destruct after playing
  markers: false,           // ScrollTrigger debug markers
}
```

### Override Hooks

```js
class YourAnimation extends AnimationCore {
  createElements() {
    // Setup DOM refs, SplitText, etc.
  }

  animate() {
    // Build GSAP timeline
    this.timeline.from(this.element, { ... });
  }
}
```

### ScrollTrigger Modes

**One-shot (default):**
```js
ScrollTrigger.create({
  trigger: this.element,
  start: 'top 90%',
  once: true,
  onEnter: () => this.timeline.play(),
});
```

**Scrub (for parallax):**
```js
ScrollTrigger.create({
  trigger: this.element,
  start: 'top bottom',
  end: 'bottom top',
  scrub: true,
  animation: this.timeline,
});
```

### Self-Cleaning Pattern

When `cleanup: true` (default), the animation destroys itself after playing:
```js
this.timeline = gsap.timeline({
  paused: true,
  onComplete: () => {
    if (this.options.cleanup) this.destroy();
  },
});
```

This frees ScrollTrigger instances and DOM references. Use `cleanup: false` for persistent animations (parallax).

## Existing Animation Types

### FadeIn

**Data attribute:** `data-anim="fade-in"`
**File:** `src/animations/global/fade/FadeIn.js`

```js
animate() {
  this.timeline.from(this.element, {
    autoAlpha: 0,
    duration: 1.5,
    ease: 'sine.out',
  });
}
```

### LineReveal

**Data attribute:** `data-anim-line="true"`
**File:** `src/animations/global/line/LineReveal.js`

```js
animate() {
  this.timeline.from(this.element, {
    scaleX: 0,
    transformOrigin: '0% 50%',
    duration: 1.7,
    ease: easings.revealEase,
  });
}
```

### ImageReveal

**Data attribute:** `data-anim-imgreveal="true"`
**File:** `src/animations/global/image/ImageReveal.js`

Clipping wipe from right:
```js
animate() {
  this.timeline.from(this.element, {
    scaleX: 0,
    transformOrigin: 'right center',
    duration: 1.7,
    ease: easings.revealEase,
  });
}
```

### ImageParallax

**Data attribute:** `data-anim-imgparallax="true"`
**File:** `src/animations/global/image/ImageParallax.js`

Scrub parallax — element pre-scaled to 1.35x:
```js
// cleanup: false — persists during scroll
animate() {
  gsap.set(this.element, { scale: 1.35 });
  this.timeline.to(this.element, {
    y: this.element.clientHeight * 0.175,
    ease: 'none',
  });
}
// Uses scrub: true
```

### HeadingReveal

**Data attribute:** `data-anim-heading="true"`
**File:** `src/animations/global/text/HeadingReveal.js`

GSAP SplitText by chars with mask:
```js
createElements() {
  this.split = new SplitText(this.element, {
    type: 'chars',
    mask: 'chars',
  });
}

animate() {
  this.timeline.from(this.split.chars, {
    yPercent: 100,
    stagger: { amount: 0.5, grid: [10, 1] },
    duration: 1.5,
    ease: 'power2.out',
  });
}
```

**Note:** SplitText is included in the standard `gsap` npm package (free since v3.13, April 2025). Import from `'gsap/SplitText'` and register with `gsap.registerPlugin(SplitText)`.

### ParaReveal

**Data attribute:** `data-anim-para="true"`
**File:** `src/animations/global/text/ParaReveal.js`

SplitText by lines with mask. Mobile fallback to simple opacity:
```js
createElements() {
  if (window.innerWidth <= 991) {
    // Mobile: skip SplitText, use simple fade
    return;
  }
  this.split = new SplitText(this.element, {
    type: 'lines',
    mask: 'lines',
  });
}

animate() {
  if (this.isMobile) {
    this.timeline.from(this.element, { autoAlpha: 0 });
    return;
  }
  this.timeline.from(this.split.lines, {
    yPercent: 100,
    stagger: { each: 0.045 },
  });
}
```

Has a resize handler that re-splits text on width change (not height — prevents mobile scroll-triggered re-splits).

## Creating a New Animation

### 1. Create the animation class

```js
// src/animations/global/yourEffect/YourEffect.js
import AnimationCore from '../../_core/AnimationCore';

export default class YourEffect extends AnimationCore {
  constructor(element) {
    super(element, {
      triggerStart: 'top 85%',
      duration: 1.2,
      ease: 'power3.out',
      // scrub: false,  // one-shot by default
      // cleanup: true, // self-destruct by default
    });
    this.init();
  }

  createElements() {
    // Find child elements, setup SplitText, etc.
    this.inner = this.element.querySelector('.inner');
  }

  animate() {
    this.timeline.from(this.inner, {
      yPercent: 30,
      autoAlpha: 0,
      duration: this.options.duration,
      ease: this.options.ease,
    });
  }
}
```

### 2. Register in animations/index.js

```js
// src/animations/index.js
import YourEffect from './global/yourEffect/YourEffect';

export default class Animation {
  constructor() {
    this.initAnimations();
  }

  initAnimations() {
    // Existing animations...
    document.querySelectorAll('[data-anim-youreffect="true"]').forEach(el => {
      new YourEffect(el);
    });
  }
}
```

### 3. Add data attribute in Webflow

```html
<div data-anim-youreffect="true">
  <div class="inner">Content to animate</div>
</div>
```

## Custom Easings

`src/utils/easings.js`

Available easings (registered with GSAP CustomEase):
- `lineEase` — smooth line reveal curve
- `paragraphEase` — text reveal curve
- `transitionEase` — page transition curve

- `revealEase` — smooth reveal wipe curve (used by LineReveal, ImageReveal)

CSS easing custom properties are also available in `src/styles/easings.css` for CSS transitions.

## 60fps Rules

1. **Self-cleaning animations** — Always use `cleanup: true` (default) for one-shot animations. Each ScrollTrigger instance has overhead. Cleaning up after play frees memory.
2. **`once: true`** — One-shot ScrollTriggers use `once: true` which auto-removes the trigger after firing. Don't manually create ScrollTriggers without this for reveals.
3. **Width-only resize guard** — ParaReveal only re-splits on width change, ignoring height changes caused by mobile scroll bar show/hide. Copy this pattern for any SplitText animation.
4. **Mobile fallback** — ParaReveal falls back to simple opacity on mobile (<=991px). SplitText on mobile is expensive and unreliable with touch scroll. Always provide a mobile fallback.
5. **Stagger budget** — Keep stagger count reasonable. 50+ staggered elements will cause frame drops on entry. For large lists, batch or use `stagger: { from: 'start', amount: 0.3 }` instead of `each`.
6. **`autoAlpha` over `opacity`** — `autoAlpha` sets `visibility: hidden` when at 0, which removes the element from compositing. Better than `opacity: 0` alone.
7. **GSAP lagSmoothing(0)** — Already set globally in smoothscroll.js. Prevents GSAP from dropping frames. Don't change this.
8. **ScrollTrigger + Lenis sync** — Lenis fires `scroll` events that update ScrollTrigger: `lenis.on('scroll', () => ScrollTrigger.update())`. This is already wired up. If you add custom scroll listeners, use Lenis events, not native scroll events.
9. **Avoid layout triggers in animate()** — Don't read `getBoundingClientRect`, `offsetHeight`, etc. inside `animate()`. These trigger forced reflow. Read dimensions in `createElements()` and store them.
10. **Prefer `transforms`** — Animate `x`, `y`, `scale`, `rotation` (GPU-composited). Avoid `width`, `height`, `top`, `left` (triggers layout).

## Cross-Browser

- **Safari**: ScrollTrigger pin + fixed position can cause flicker. Use `pinType: 'transform'` if pinning.
- **Mobile Safari**: SplitText with `mask: 'lines'` can cause anti-aliasing artifacts on retina. Test on device.
- **Firefox**: Different text rendering means SplitText line breaks might differ. Always test cross-browser.
- **Low-end devices**: Skip SplitText entirely. Use simple opacity/transform reveals.

## Key Files

- `src/animations/_core/AnimationCore.js` — Base class
- `src/animations/index.js` — Animation manager
- `src/animations/global/` — All animation implementations
- `src/utils/easings.js` — Custom GSAP easings
- `src/styles/easings.css` — CSS easing custom properties
- `src/utils/smoothscroll.js` — Lenis + ScrollTrigger sync
