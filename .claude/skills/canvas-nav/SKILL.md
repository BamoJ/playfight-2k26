---
name: canvas-nav
description: Taxi + Canvas navigation patterns, lifecycle gotchas, and page detection. Use when a WebGL page isn't loading on navigation, pages are detecting incorrectly, transitions leave broken state, or you're building a new page that needs to survive cross-page navigation.
user-invokable: true
---

# Canvas Navigation — Taxi + Canvas Lifecycle Patterns

## How Pages Are Detected

`detectPageName()` in `src/canvas/index.js` identifies which page to load. It queries in this order:

1. `data-page` attribute on the **latest `[data-taxi-view]`** in the DOM
2. Falls back to `document.body.dataset.page` if no `[data-taxi-view]` has `data-page`
3. Falls back to URL path matching against registry keys

**Critical:** Webflow puts `data-page` on `<body>`. Taxi only swaps `[data-taxi-view]` content — the body persists across navigations. If `detectPageName()` read directly from `document.body`, it would return the same stale page name on every navigation. The fix: always query from the latest `[data-taxi-view]` first.

```js
// canvas/index.js — DO NOT REVERT
const view = Array.from(document.querySelectorAll('[data-taxi-view]')).pop() || document;
const pageAttr = view.dataset?.page || view.querySelector('[data-page]')?.dataset.page;
```

**Symptom if broken:** Navigating from About → Originals still shows About's WebGL. The same page re-enters every time regardless of URL.

---

## How `onChange` Flows

```
transition:complete fires
  → canvas.onChange(detectPageName())
    → prev.onLeave()           // hides current page, starts cleanup timer
    → await next.load()        // yields microtask — Taxi's done() runs here
    → next.create(template)    // builds WebGL scene for new page
    → next.onEnter(template)   // makes scene visible, fires transitions
```

`onChange` is `async`. The `await next.load()` creates a microtask yield — Taxi's `done()` callback runs during this gap. By the time `create()` executes, the DOM transition is fully complete and the old `[data-taxi-view]` has been removed. DOM queries inside `create()` are safe.

---

## Page Caching

Canvas caches page instances in `this.pages[pageName]`. Once created, a page instance is **reused** across navigations — it's never destroyed (unless you call `canvas.destroy()`). This means:

- First visit → `new YourPage()` created, `create()` called
- Return visit → same instance reused, `onEnter()` called again (not `create()`)
- `onLeave()` / `transitionOut()` handles teardown between visits

If your page needs to re-query DOM elements on re-visit (because Taxi swapped new content), you must destroy and recreate the view inside `onEnter()`.

---

## Initial Load Double-Entry

On initial page load, both `initCurrentPage()` and Taxi's initial `transition:complete` fire `onChange` for the same page:

1. `Canvas.initCurrentPage()` → `onChange('about')` → creates page
2. Taxi fires initial `transition:complete` → `onChange('about')` again → `prev.onLeave()` then `onEnter()` again

This is expected. Handle it with the `_leaveTimer` pattern (see below).

---

## Delayed `transitionOut` — `_leaveTimer` Pattern

If a page's `transitionOut` does delayed cleanup (setTimeout, GSAP tween), you must store the timer and handle quick returns in `onEnter`. Without this, navigating back before the timer fires leaves the page in a broken half-destroyed state.

```js
transitionOut(onComplete) {
    // Start fade/animation first
    this.view?.hide();

    this._leaveTimer = setTimeout(() => {
        this._leaveTimer = null;
        // Destroy resources, reset state
        this.view?.destroy();
        this.view = null;
        this.created = false;
        onComplete?.();
    }, 1400); // match your animation duration
}

onEnter(data) {
    if (this._leaveTimer) {
        // Returned before cleanup fired — do it now
        clearTimeout(this._leaveTimer);
        this._leaveTimer = null;
        this.view?.destroy();
        this.view = null;
        this.created = false;
        this.create(data); // create fresh from new DOM
    }
    super.onEnter(data);
}
```

**What this handles:**
| Scenario | Result |
|---|---|
| First visit | `onChange` creates. No `_leaveTimer`. `onEnter` just calls `super`. Single creation. |
| Return visit (timer already fired) | `onChange` creates fresh (`created = false`). No `_leaveTimer`. Single creation. |
| Return visit (timer still pending) | `onEnter` cancels timer, destroys stale resources, recreates. Single creation. |
| Initial double-entry | Same as "return visit (timer still pending)" — handled cleanly. |

---

## Page-Specific DOM Selectors

During Taxi transitions, **both old and new `[data-taxi-view]` coexist in the DOM**. Taxi appends the new view before removing the old one. The old view is only removed inside the `transition:complete` callback.

Generic selectors like `document.querySelector('[data-canvas]')` or `document.querySelector('[data-gl-scene]')` will find elements from whichever page appears first in the DOM — potentially the wrong one.

**Rule:** Always qualify selectors with a page-specific value:

```js
// ❌ Dangerous — matches first found in DOM
document.querySelector('[data-gl-scene]')

// ✅ Safe — matches only this page's element
document.querySelector('[data-gl-scene="originals"]')
document.querySelector('[data-gl-scene="about"]')
```

Scope queries to the template passed into `create()` when possible:

```js
create(template = document) {
    const container = template.querySelector('[data-gl-scene="originals"]');
    if (!container) return;
    // ...
}
```

---

## `transition:complete` Timing

The `transition:complete` event fires inside the TransitionManager's wrapped `onEnter` callback — **after** the old `[data-taxi-view]` has been removed from the DOM. The sequence:

```
GSAP animation completes
  → old view removed (fromElement.remove())
  → scroll reset, components/animations re-created
  → emitter.emit('transition:complete')   ← canvas.onChange() fires here
  → done()
```

DOM queries at `transition:complete` time see only the new page's content.

---

## Canvas `update()` Ticks All Cached Pages

```js
// canvas/index.js
update() {
    Object.values(this.pages).forEach((page) => {
        if (page.update) page.update(this.time);
    });
    this.renderer.render(this.scene, this.camera);
}
```

Every cached page's `update()` is called every frame. **Always guard:**

```js
update(time) {
    if (!this.isActive) return; // ← mandatory
    // ...
}
```

Without this guard, an inactive page (one you've navigated away from) continues running its per-frame logic, wasting GPU cycles.

---

## Registering a Page

```js
// src/main.js
import { YourPage } from '@canvas/YourPage';

const pages = { yourpage: YourPage };

const canvas = new Canvas(pages);

emitter.on('transition:complete', () => {
    canvas.onChange(canvas.detectPageName());
});
```

The `transition:complete` listener handles all navigations after initial load. `canvas.initCurrentPage()` (in Canvas constructor) handles the initial load.

---

## Key Files

- `src/canvas/index.js` — Canvas manager, `detectPageName()`, `onChange()`
- `src/canvas/Page.js` — Base page class, lifecycle
- `src/main.js` — Page registry, transition:complete listener
- `src/transitions/index.js` — TransitionManager, when `transition:complete` fires
