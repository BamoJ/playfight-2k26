---
name: webgl-dom-page
description: Full pattern for a WebGL page that maps DOM elements to WebGL planes. Use when building a page that combines a DOMPlane view, texture loading, cover UV scaling, and optional interaction layer (drag, hover, click). Covers the Page + View orchestrator pattern, texture gotchas, and portal pattern for fixed elements inside transformed containers.
user-invokable: true
---

# WebGL DOM Page — Page + View Orchestrator Pattern

This covers the full pattern for a WebGL page that overlays Three.js planes on DOM elements. It composes:

- **Page** (`src/canvas/Page.js`) — lifecycle orchestrator
- **View** (`DOMPlane` subclass) — texture loading, plane creation, per-frame updates
- **Interaction layer** (optional) — drag, hover, click handling on the container

---

## File Structure

```
src/canvas/YourPage/
├── index.js          # Page orchestrator (extends Page)
├── YourView.js       # DOMPlane subclass — textures, planes, uniforms
├── YourInteraction.js  # Optional — drag/click/hover on the container
└── shaders/
    ├── vertex.glsl
    └── fragment.glsl
```

---

## Page Orchestrator (`index.js`)

```js
import { Page } from '../Page';
import { YourView } from './YourView';
import emitter from '@utils/Emitter';

export class YourPage extends Page {
    constructor(options) {
        super(options);
        this.view = null;
        this._leaveTimer = null;
        this.calculateViewport();
    }

    calculateViewport() {
        this.screen = { width: window.innerWidth, height: window.innerHeight };
        const fov = this.camera.fov * (Math.PI / 180);
        const height = 2 * Math.tan(fov / 2) * this.camera.position.z;
        this.viewport = { width: height * this.camera.aspect, height };
    }

    create(template = document) {
        if (this.created) return;
        this.calculateViewport();

        // Scope to a page-specific container — never query bare document
        const container = template.querySelector('[data-gl-scene="yourpage"]');
        if (!container) return;

        this.view = new YourView({
            parent: this.elements,
            camera: this.camera,
            viewport: this.viewport,
            screen: this.screen,
            template: container,    // scoped — prevents cross-page collision
        });

        this.scene.add(this.elements);
        this.created = true;

        // Defer so transition:complete listeners have attached first
        setTimeout(() => emitter.emit('yourpage:enter-ready'), 0);
    }

    onEnter(data) {
        if (this._leaveTimer) {
            clearTimeout(this._leaveTimer);
            this._leaveTimer = null;
            this.view?.destroy();
            this.view = null;
            this.created = false;
            this.create(data);
        }
        super.onEnter(data);
    }

    transitionIn(onComplete) {
        emitter.emit('yourpage:enter-ready');
        onComplete?.();
    }

    transitionOut(onComplete) {
        this.view?.hide();
        this._leaveTimer = setTimeout(() => {
            this._leaveTimer = null;
            this.view?.destroy();
            this.view = null;
            this.created = false;
            onComplete?.();
        }, 1400);
    }

    onResize() {
        this.calculateViewport();
        this.view?.onResize(this.viewport, this.screen);
    }

    update(time) {
        if (!this.isActive || !this.view) return;
        this.view.update(time);
    }

    destroy() {
        this.view?.destroy();
        super.destroy();
    }
}
```

---

## View (`YourView.js`)

```js
import { DOMPlane } from '../DOMPlane';
import TextureCache from '../utils/TextureCache';
import vertexShader from './shaders/vertex.glsl';
import fragmentShader from './shaders/fragment.glsl';

export class YourView extends DOMPlane {
    constructor(options) {
        super({ ...options, shaders: { vertex: vertexShader, fragment: fragmentShader } });
        this.template = options.template || document;
        this.loadImages();
    }

    loadImages() {
        const images = Array.from(this.template.querySelectorAll('[data-gl-img="true"]'));
        if (!images.length) return;

        // Wait for DOM images to load — ensures getBoundingClientRect returns
        // correct height when images use height:auto (no width/height HTML attrs)
        const imgLoadPromises = images
            .filter((img) => !img.complete)
            .map((img) => new Promise((resolve) => {
                img.addEventListener('load', resolve, { once: true });
                img.addEventListener('error', resolve, { once: true });
            }));

        // Deduplicate by src
        const uniqueSrcs = new Map();
        images.forEach((img) => {
            const src = img.getAttribute('data-gl-src') || img.src;
            if (src && !uniqueSrcs.has(src)) uniqueSrcs.set(src, img);
        });

        // Gate createPlanes on BOTH textures AND DOM images being ready
        let texturesReady = false;
        let domImagesReady = imgLoadPromises.length === 0;

        const tryCreatePlanes = () => {
            if (texturesReady && domImagesReady) this.createPlanes(images);
        };

        Promise.all(imgLoadPromises).then(() => {
            domImagesReady = true;
            tryCreatePlanes();
        });

        // settled counts both success AND failure — one bad image won't block the rest
        let settled = 0;
        const done = () => {
            settled++;
            if (settled === uniqueSrcs.size) {
                texturesReady = true;
                tryCreatePlanes();
            }
        };

        uniqueSrcs.forEach((img, src) => {
            TextureCache.load(src)
                .then((texture) => { this.textures.push({ texture, src }); done(); })
                .catch(() => done()); // fail silently, count toward total
        });
    }

    createPlanes(images) {
        images.forEach((img, index) => {
            const src = img.getAttribute('data-gl-src') || img.src;
            const texEntry = this.textures.find((t) => t.src === src);
            if (!texEntry) return;

            const mesh = this.createPlane(texEntry.texture, img, index);

            // Cover UV — replicates object-fit: cover in the shader
            const bounds = img.getBoundingClientRect();
            const imgAspect = texEntry.texture.image.width / texEntry.texture.image.height;
            const planeAspect = bounds.width / bounds.height;
            const coverScale = imgAspect > planeAspect
                ? [planeAspect / imgAspect, 1.0]
                : [1.0, imgAspect / planeAspect];

            mesh.material.uniforms.uCoverScale = { value: coverScale };

            this.imagePlanes.push(mesh);
            this.imageGroup.add(mesh);
        });

        // Hide DOM images — use opacity:0 NOT display:none (display:none breaks getBoundingClientRect)
        this.template.querySelectorAll('[data-gl-img="true"]').forEach((img) => {
            img.style.opacity = '0';
        });

        this.updatePlanesPositions();
    }

    update(time) {
        this.updatePlanesPositions();
        // Add per-frame uniform updates here (uTime, etc.)
    }

    onResize(viewport, screen) {
        super.onResize(viewport, screen);
    }
}
```

---

## Cover UV Scaling

WebGL planes use full 0–1 UVs, but CSS images crop via `object-fit: cover`. Without UV correction, textures appear stretched.

**JS — compute in `createPlanes`:**
```js
const imgAspect = texture.image.width / texture.image.height;
const planeAspect = bounds.width / bounds.height;
const coverScale = imgAspect > planeAspect
    ? [planeAspect / imgAspect, 1.0]   // image wider than plane — crop sides
    : [1.0, imgAspect / planeAspect];  // image taller than plane — crop top/bottom
mesh.material.uniforms.uCoverScale = { value: coverScale };
```

**GLSL — apply in fragment shader:**
```glsl
uniform vec2 uCoverScale;

void main() {
    vec2 coverUv = (vUv - 0.5) * uCoverScale + 0.5;
    vec4 color = texture2D(uTexture, coverUv);
    gl_FragColor = vec4(color.rgb, uOpacity);
}
```

---

## Texture Loading Gotchas

### CORS — Webflow CDN
```js
// src/canvas/utils/TextureCache.js — must have this
this.loader.setCrossOrigin('anonymous');
```
Without it, Webflow CDN images fail silently on some browsers. No error in the console, just black planes.

### `settled` counter — don't use `Promise.all`
```js
// ❌ One failed texture blocks everything
await Promise.all(srcs.map(src => TextureCache.load(src)));

// ✅ Count success + failure — one bad src doesn't block the rest
let settled = 0;
const done = () => { settled++; if (settled === total) createPlanes(); };
TextureCache.load(src).then(() => done()).catch(() => done());
```

### DOM images must be loaded before `createPlanes`
`TextureCache` loads textures via internal `Image` objects — separate from the DOM `<img>` elements. If images use `height: auto` (natural aspect ratio), `getBoundingClientRect()` returns `height: 0` until the DOM image loads. Always gate `createPlanes()` on both TextureCache AND DOM image `load` events. See the `loadImages()` template above.

### `loading="lazy"` on Webflow images
Webflow may set `loading="lazy"` on images. This doesn't affect `TextureCache` (it loads via URL directly, not from the DOM image element), but `img.src` is always populated regardless of lazy loading status.

---

## Portal Pattern for `position: fixed` Inside Transformed Parents

Any element with `transform: translateX/Y/scale()` creates a containing block — breaking `position: fixed` on all descendants. This affects lightboxes, modals, fullscreen overlays inside sliders, carousels, or any animated container.

**Fix:** hoist the fixed element to a portal div that lives inside `[data-taxi-view]` but outside the transformed container.

**Webflow HTML:**
```html
<div data-taxi-view>
    <div class="slider-wrapper" data-my-slider>
        <!-- slider items, transformed by JS -->
        <div data-lightbox-trigger>Open</div>
    </div>

    <!-- Portal: outside the slider, inside taxi-view (auto-cleaned on navigation) -->
    <div class="lightbox-portal"></div>
</div>
```

**JS — hoist on init:**
```js
const portal = document.querySelector('.lightbox-portal');
if (portal) {
    container.querySelectorAll('[data-lightbox]').forEach(el => portal.appendChild(el));
}
```

Taxi removes `[data-taxi-view]` on navigation, which auto-cleans the portal. No manual cleanup needed.

---

## Template Scoping

Always pass a scoped `template` to the View. Never let the View query bare `document`.

```js
// ❌ Queries entire document — matches elements from other pages during transitions
this.view = new YourView({ template: document, ... });

// ✅ Scoped to this page's container
const container = template.querySelector('[data-gl-scene="yourpage"]');
this.view = new YourView({ template: container, ... });
```

During Taxi transitions, both old and new `[data-taxi-view]` are in the DOM. An unscoped query will match whichever page's elements appear first.

---

## DOM Image Visibility

```js
// ✅ Correct — hides image but preserves layout/getBoundingClientRect
img.style.opacity = '0';

// ❌ Wrong — removes from layout, getBoundingClientRect returns {0,0,0,0}
img.style.display = 'none';
img.setAttribute('hidden', '');
```

DOMPlane reads `getBoundingClientRect()` every frame to sync plane positions. If the image is layout-hidden, planes have no position to sync to.

---

## Optional Interaction Layer

For pages that need drag, scroll input, or click handling on the container, create a separate class rather than bloating the View or Page:

```js
// YourInteraction.js
export class YourInteraction {
    constructor(container) {
        this.container = container;
        this._onMouseDown = this._onMouseDown.bind(this);
        this.container.addEventListener('mousedown', this._onMouseDown);
    }

    destroy() {
        this.container.removeEventListener('mousedown', this._onMouseDown);
    }
}
```

Compose in the Page:
```js
create(template = document) {
    const container = template.querySelector('[data-gl-scene="yourpage"]');
    this.interaction = new YourInteraction(container);
    this.view = new YourView({ template: container, ... });
    // ...
}

transitionOut(onComplete) {
    this._leaveTimer = setTimeout(() => {
        this.interaction?.destroy();
        this.interaction = null;
        this.view?.destroy();
        this.view = null;
        this.created = false;
        onComplete?.();
    }, 1400);
}
```

---

## Webflow DOM Attributes

| Attribute | Purpose |
|---|---|
| `data-gl-scene="yourpage"` | Page-specific container for scoped queries |
| `data-gl-img="true"` | Marks images for WebGL plane creation |
| `data-gl-src="https://..."` | Override image src for texture loading (use when `src` is a placeholder) |

---

## Key Files

- `src/canvas/Page.js` — Base page class
- `src/canvas/DOMPlane.js` — Base view class
- `src/canvas/utils/TextureCache.js` — Texture loader (`setCrossOrigin` lives here)
- `src/canvas/About/` — Reference implementation (About page)
- `src/canvas/Originals/` — Reference implementation (Originals page)
