---
name: component
description: Build DOM components with proper Taxi.js lifecycle management. Use when creating UI elements like menus, cursor followers, theme toggles, modals, or any interactive DOM component.
user-invocable: true
---

# Component — DOM Components with Taxi Lifecycle

## Architecture

Components extend `ComponentCore` (`src/components/_core/ComponentCore.js`). The Components manager (`src/components/index.js`) instantiates them. The manager is re-created on every `transition:complete` event by TransitionManager, which handles cleanup and re-init across page navigations.

## ComponentCore Base Class

`src/components/_core/ComponentCore.js`

### Lifecycle

```
init() → createElements() → createEvents() → addEventListeners()
```

```
destroy() → removeEventListeners()
```

### Guards

- `isInitialized` flag prevents double-init
- `destroy()` sets `isInitialized = false`

### Hooks to Override

```js
class YourComponent extends ComponentCore {
  createElements() {
    // Query DOM, store refs
  }

  createEvents() {
    // Bind methods for listener add/remove
  }

  addEventListeners() {
    // Attach listeners
  }

  removeEventListeners() {
    // Detach listeners
  }
}
```

## Creating a Component

### 1. Create the component class

```js
// src/components/Menu/index.js
import ComponentCore from '../_core/ComponentCore';
import gsap from 'gsap';

export default class Menu extends ComponentCore {
  constructor() {
    super();
    this.isOpen = false;
    this.init();
  }

  createElements() {
    this.trigger = document.querySelector('[data-menu="trigger"]');
    this.panel = document.querySelector('[data-menu="panel"]');
    this.links = document.querySelectorAll('[data-menu="link"]');

    if (!this.trigger || !this.panel) return;
  }

  createEvents() {
    this._onToggle = this.toggle.bind(this);
    this._onKeydown = this.onKeydown.bind(this);
  }

  addEventListeners() {
    this.trigger?.addEventListener('click', this._onToggle);
    window.addEventListener('keydown', this._onKeydown);
  }

  removeEventListeners() {
    this.trigger?.removeEventListener('click', this._onToggle);
    window.removeEventListener('keydown', this._onKeydown);
  }

  toggle() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) this.open();
    else this.close();
  }

  open() {
    gsap.to(this.panel, {
      autoAlpha: 1,
      duration: 0.4,
      ease: 'power2.out',
    });
  }

  close() {
    gsap.to(this.panel, {
      autoAlpha: 0,
      duration: 0.3,
      ease: 'power2.in',
    });
  }

  onKeydown(e) {
    if (e.key === 'Escape' && this.isOpen) this.close();
  }

  destroy() {
    if (this.isOpen) {
      gsap.set(this.panel, { autoAlpha: 0 });
      this.isOpen = false;
    }
    super.destroy();
  }
}
```

### 2. Register in Components manager

```js
// src/components/index.js
import Menu from './Menu';

export default class Components {
  constructor() {
    this.instances = {};
    this.initComponents();
  }

  initComponents() {
    this.instances.menu = new Menu();
    // Add more components here
  }

  destroy() {
    Object.values(this.instances).forEach(c => c.destroy?.());
    this.instances = {};
  }
}
```

### 3. Set data attributes in Webflow

```html
<button data-menu="trigger">Menu</button>
<nav data-menu="panel" style="visibility: hidden; opacity: 0;">
  <a data-menu="link" href="/about">About</a>
  <a data-menu="link" href="/work">Work</a>
</nav>
```

## Taxi Lifecycle Integration

TransitionManager re-creates `Components` on every `transition:complete`:

```js
// In TransitionManager (src/transitions/index.js)
emitter.on('transition:complete', () => {
  this.components?.destroy();
  this.components = new Components();
});
```

This means:
- **Every page navigation destroys all components and creates new ones**
- Components must query DOM in `createElements()` (DOM may have changed)
- Components must clean up all listeners in `removeEventListeners()`
- Don't store persistent state in components — it won't survive navigation

### Persistent Components

If you need a component that survives navigation (e.g., a site-wide cursor follower):

```js
// src/components/index.js
export default class Components {
  static persistentInstances = {};

  initComponents() {
    // One-time persistent components
    if (!Components.persistentInstances.cursor) {
      Components.persistentInstances.cursor = new Cursor();
    }

    // Per-page components
    this.instances.menu = new Menu();
  }

  destroy() {
    // Only destroy per-page instances, not persistent ones
    Object.values(this.instances).forEach(c => c.destroy?.());
    this.instances = {};
  }
}
```

## Using Emitter for Cross-Component Communication

```js
import emitter from '@utils/Emitter';

class Menu extends ComponentCore {
  addEventListeners() {
    // Listen for global events
    emitter.on('transition:start', this.close, 'menu');
  }

  removeEventListeners() {
    // Clean up by namespace
    emitter.off('transition:start', null, 'menu');
  }
}
```

Namespace (`'menu'`) allows grouped cleanup — `emitter.off(event, null, 'menu')` removes all listeners with that namespace.

## Common Component Patterns

### Cursor Follower

```js
class Cursor extends ComponentCore {
  createElements() {
    this.el = document.querySelector('[data-cursor]');
    this.pos = { x: 0, y: 0 };
    this.target = { x: 0, y: 0 };
  }

  addEventListeners() {
    this._onMove = (e) => {
      this.target.x = e.clientX;
      this.target.y = e.clientY;
    };
    window.addEventListener('mousemove', this._onMove);
    gsap.ticker.add(this._onTick = () => this.update());
  }

  update() {
    this.pos.x += (this.target.x - this.pos.x) * 0.1;
    this.pos.y += (this.target.y - this.pos.y) * 0.1;
    gsap.set(this.el, { x: this.pos.x, y: this.pos.y });
  }

  removeEventListeners() {
    window.removeEventListener('mousemove', this._onMove);
    gsap.ticker.remove(this._onTick);
  }
}
```

### Theme Toggle

```js
class ThemeToggle extends ComponentCore {
  createElements() {
    this.toggle = document.querySelector('[data-theme-toggle]');
    this.isDark = document.documentElement.dataset.theme === 'dark';
  }

  addEventListeners() {
    this._onToggle = () => {
      this.isDark = !this.isDark;
      document.documentElement.dataset.theme = this.isDark ? 'dark' : 'light';
    };
    this.toggle?.addEventListener('click', this._onToggle);
  }

  removeEventListeners() {
    this.toggle?.removeEventListener('click', this._onToggle);
  }
}
```

## 60fps Rules

1. **Event listener cleanup** — Always remove listeners in `removeEventListeners()`. Leaked listeners accumulate across navigations (Components are re-created every transition).
2. **Avoid layout thrashing** — Don't read layout properties (offsetWidth, getBoundingClientRect) and write styles in the same frame. Batch reads, then batch writes. Or use `gsap.set()` which batches internally.
3. **Use `gsap.ticker` for RAF loops** — Don't create your own `requestAnimationFrame` loops. Use `gsap.ticker.add(fn)` and `gsap.ticker.remove(fn)`. This syncs with GSAP's rendering pipeline.
4. **`gsap.set()` over direct style manipulation** — `gsap.set(el, { x, y })` uses transforms (GPU-composited). `el.style.left = x + 'px'` triggers layout.
5. **Lerp for smooth motion** — For cursor followers and similar, use lerp (0.08–0.12 ease factor) instead of direct position assignment. Creates 60fps-smooth motion.
6. **Passive listeners** — Use `{ passive: true }` for scroll/touch listeners that don't call `preventDefault()`:
```js
window.addEventListener('touchmove', this._onTouch, { passive: true });
```
7. **Guard null elements** — Always check `if (!this.trigger) return` in createElements. DOM elements might not exist on every page.

## Cross-Browser

- **Safari**: `pointer-events` on transformed elements can behave differently. Test hover states.
- **Mobile**: Skip cursor-following components. Use `matchMedia` to detect touch devices.
- **Firefox**: `transform: translate3d()` forces GPU layer. Use `will-change: transform` sparingly — too many layers hurt performance.

## Key Files

- `src/components/_core/ComponentCore.js` — Base class
- `src/components/index.js` — Component manager
- `src/transitions/index.js` — TransitionManager (re-creates components)
- `src/utils/Emitter.js` — Event system for cross-component communication
