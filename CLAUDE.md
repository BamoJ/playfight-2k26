# WebGL + Webflow Boilerplate

## What This Is
A reusable starter for Webflow sites with custom WebGL experiences. Built with Three.js, GSAP, Taxi (page routing), and Lenis (smooth scroll). HTML lives in Webflow — this repo is the JS/WebGL layer injected via `<script>`.

Output: single IIFE bundle (`dist/main.js`) with CSS inlined via `vite-plugin-css-injected-by-js`.

## Architecture Overview

```
src/
├── canvas/                  # All WebGL logic
│   ├── index.js             # Canvas manager — renderer, camera, scene, page lifecycle
│   ├── Page.js              # Base class for all WebGL pages (extends Emitter)
│   ├── DOMPlane.js          # Helper: maps DOM elements → WebGL planes
│   ├── TransitionController.js  # Cross-page mesh clone + fly animation
│   ├── shaders/             # Default/shared shaders
│   │   ├── defaultVert.glsl
│   │   └── defaultFrag.glsl
│   ├── utils/
│   │   ├── Time.js          # RAF timer (extends Emitter, emits 'tick')
│   │   ├── TextureCache.js  # Singleton texture loader with cache + dedup
│   │   └── includes/        # Shared GLSL includes (perlin noise, etc.)
│   └── Home/                # Example page — replace per project
│       └── index.js
├── transitions/             # Page routing + transition animations
│   ├── index.js             # TransitionManager — wraps Taxi with shared logic
│   ├── Preloader.js         # Loading screen skeleton
│   └── global/
│       └── GlobalEnter.js   # Default page enter transition
├── components/              # DOM UI components (menu, theme, nav, etc.)
│   ├── index.js             # Component manager
│   └── core/
│       └── ComponentCore.js # Base class for components
├── utils/                   # Global utilities
│   ├── Emitter.js           # Unified event system (class + singleton)
│   ├── smoothscroll.js      # Lenis wrapper (singleton)
│   └── easings.js           # GSAP custom easings
├── styles/                  # Extra CSS outside Webflow
│   ├── index.css
│   ├── base.css             # .is-transition class for Taxi
│   ├── lenis.css            # Lenis scroll overrides
│   └── easings.css          # CSS easing custom properties
└── main.js                  # Entry point — page + transition registries
```

## Key Concepts

### Page (canvas/Page.js)
Universal base class for every WebGL page. Provides:
- Lifecycle: `create() → onEnter() → update() → onLeave() → destroy()`
- Scene management via `this.elements` (THREE.Group)
- Extends `Emitter` for internal events

Every page extends this. Some pages use DOMPlane for image mapping. Others (particles, 3D scenes) work with `this.scene` directly.

### DOMPlane (canvas/DOMPlane.js)
Optional helper for the most common pattern: "overlay WebGL planes on DOM elements."
- Creates PlaneGeometry sized to match DOM element's bounding rect
- Converts DOM pixels → WebGL world coordinates (FOV-based)
- Syncs position every frame (scroll, layout changes)
- Hover system: mouseenter/leave/move with velocity tracking → shader uniforms
- Works with images, videos, or any element with a bounding rect
- AbortController for clean event listener teardown

### TransitionController (canvas/TransitionController.js)
Handles seamless cross-page WebGL transitions:
1. User clicks a link → `webgl:transition:prepare` emitted
2. Controller clones the source mesh, hides original
3. Page navigates via Taxi, new page loads
4. New page emits `webgl:transition:target-ready` with target DOM rect
5. Controller animates cloned mesh to target position (1.5s expo.inOut)
6. Emits `webgl:transition:handoff` → HTML image fades in
7. WebGL plane fades out → cleanup

Supports UV correction for object-fit:cover during size transitions.

### Emitter (utils/Emitter.js)
Single unified event system replacing the old dual EventBus + EventEmitter:
- **As a class**: `class Time extends Emitter` — for Page, Time lifecycle events
- **As a singleton**: `import emitter from '@utils/Emitter'` — for global signals
- API: `on(event, callback, namespace?)`, `once()`, `off()`, `emit()`, `clear()`
- Namespace support for grouped cleanup: `emitter.off('tick', null, 'myView')`

### Global Events (via singleton emitter)
- `transition:start` — page navigation begins
- `transition:complete` — page transition finished, new components initialized
- `home:enter-ready` — homepage WebGL ready (or any page-specific ready signal)
- `webgl:transition:prepare` — user clicked a project link, clone mesh
- `webgl:transition:target-ready` — target page loaded, animate to position
- `webgl:transition:handoff` — switch from WebGL plane to HTML image
- `webgl:transition:complete` — transition cleanup done

## How To Add a New Page

1. Create `src/canvas/YourPage/index.js`:
   ```js
   import { Page } from '../Page';
   export class YourPage extends Page {
     create(template) { /* setup WebGL */ }
     update(time) { /* per-frame logic */ }
     onResize() { /* handle resize */ }
   }
   ```

2. Register in `src/main.js`:
   ```js
   import { YourPage } from '@canvas/YourPage';
   const pages = { home: Home, yourpage: YourPage };
   ```

3. (Optional) Add a page-specific transition in `src/transitions/pages/`:
   ```js
   import { Transition } from '@unseenco/taxi';
   export default class YourPageTransition extends Transition { ... }
   ```
   Then register: `const pageTransitions = { yourpage: YourPageTransition };`

Page detection works via `data-page` attribute on the DOM or URL path matching against registry keys.

## How DOMPlane Maps Images to WebGL

The viewport formula (FOV-based):
```
fov = camera.fov * (π / 180)
viewportHeight = 2 * tan(fov / 2) * camera.z
viewportWidth = viewportHeight * camera.aspect

worldX = ((domLeft + domWidth/2) / screenWidth) * viewportWidth - viewportWidth/2
worldY = viewportHeight/2 - ((domTop + domHeight/2) / screenHeight) * viewportHeight
planeWidth = (domWidth / screenWidth) * viewportWidth
planeHeight = (domHeight / screenHeight) * viewportHeight
```

## Webflow Integration
- HTML is built in Webflow, exported/hosted by Webflow
- This JS bundle is loaded via `<script>` tag
- Entry point waits for `window.Webflow` ready callback
- DOM elements use `data-*` attributes for JS hooks (e.g., `data-gl="img"`, `data-page="home"`, `data-loader="wrapper"`)
- Taxi intercepts `<a>` links for SPA-style navigation

## Build
- `bun install` (or `npm install`)
- `bun run dev` — dev server on localhost:3000
- `bun run build` — outputs `dist/main.js` (single IIFE)

## Conventions
- Tabs for indentation, single quotes, trailing commas (see .prettierrc)
- GLSL shaders imported via `vite-plugin-glsl` with `#include` support
- Path aliases: `@canvas`, `@utils`, `@transitions`, `@components`, `@styles`
- Mobile: WebGL effects disabled under 768px width
- Console logs stripped in production build via terser
