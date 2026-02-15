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
│   └── _core/
│       └── ComponentCore.js # Base class for components
├── animations/              # Scroll-driven DOM animations (GSAP + ScrollTrigger)
│   ├── index.js             # Animation manager — queries data attrs, creates instances
│   ├── _core/
│   │   └── AnimationCore.js # Base class (ScrollTrigger + GSAP timeline)
│   └── global/              # Animation implementations
│       ├── effect/          # FadeIn, ImageReveal, ImageParallax
│       ├── text/            # HeadingReveal, ParaReveal (SplitText)
│       └── line/            # LineReveal
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
4. New page emits `webgl:transition:target-ready` with target DOM rect _(must be emitted by your page code — not included in boilerplate)_
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
   	create(template) {
   		/* setup WebGL */
   	}
   	update(time) {
   		/* per-frame logic */
   	}
   	onResize() {
   		/* handle resize */
   	}
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

## DOM Attributes

| Attribute                      | Purpose                                      |
| ------------------------------ | -------------------------------------------- |
| `data-page="home"`             | Identifies which WebGL page to load          |
| `data-gl="img"`                | Marks an image for WebGL plane mapping       |
| `data-gl-src="..."`            | Override image source for WebGL texture      |
| `data-gl-container`            | Parent container for hover/click detection   |
| `data-loader="wrapper"`        | Preloader container                          |
| `data-loader="loader-num"`     | Progress number display                      |
| `data-loader="progress-bar"`   | Progress bar element                         |
| `data-taxi-view`               | Taxi page view container (what gets swapped) |
| `data-taxi-ignore`             | Exclude link from Taxi SPA routing           |
| `data-lenis-prevent`           | Exclude element from smooth scroll           |
| `data-anim="fade-in"`          | FadeIn scroll animation                      |
| `data-anim-line="true"`        | LineReveal (scaleX wipe)                     |
| `data-anim-imgreveal="true"`   | ImageReveal (clip wipe from right)           |
| `data-anim-imgparallax="true"` | ImageParallax (scrub parallax)               |
| `data-anim-heading="true"`     | HeadingReveal (SplitText chars slide up)     |
| `data-anim-para="true"`        | ParaReveal (SplitText lines slide up)        |

## Webflow Integration

- HTML is built in Webflow, exported/hosted by Webflow
- This JS bundle is loaded via `<script>` tag
- Entry point waits for `window.Webflow` ready callback
- DOM elements use `data-*` attributes for JS hooks (see table above)
- Taxi intercepts `<a>` links for SPA-style navigation

## Build & Development

- `bun install` (or `npm install`)
- `bun run dev` — dev server on localhost:3000 with HMR
- `bun run build` — outputs `dist/main.js` (single IIFE)
- `bun run preview` — local preview of production build

### Dev / Prod Switching

A `<script>` snippet in Webflow's site-level custom code auto-switches between local dev and production:

- **Activate dev mode:** visit any page with `?dev=true` in the URL
- This sets `sessionStorage.localDev = 'true'`, which persists across Taxi SPA navigations within the tab
- In dev mode, the snippet loads `http://localhost:3000/src/main.js` as an ES module and injects `@vite/client` for HMR
- `cors: true` in `vite.config.js` is required for cross-origin loading from the Webflow domain
- **Fallback:** if the dev server isn't running, `onerror` fires → clears sessionStorage → reloads from production
- **Exit dev mode:** close the tab, clear sessionStorage manually, or navigate without `?dev=true`
- **Production:** deploy `dist/main.js` to Vercel, set the Vercel URL as `[your-production-url]` in the snippet

## Conventions

- Tabs for indentation, single quotes, trailing commas (see .prettierrc)
- GLSL shaders imported via `vite-plugin-glsl` with `#include` support
- Path aliases: `@` (src root), `@canvas`, `@utils`, `@transitions`, `@components`, `@component-core`, `@ui`, `@styles`, `@animations`, `@core` (animations/\_core)
- Mobile: WebGL effects disabled under 768px width
- Console logs stripped in production build via terser

## Claude Code Skills

10 custom skills in `.claude/skills/` for Claude Code users:

| Command        | Purpose                                                |
| -------------- | ------------------------------------------------------ |
| `/webgl-page`  | Build new Page subclasses (lifecycle, scene, viewport) |
| `/dom-plane`   | DOM-to-WebGL plane mapping (DOMPlane, hover, textures) |
| `/shader`      | GLSL shaders (write, debug, uniforms, includes)        |
| `/transition`  | Page routing (Taxi + TransitionController + Lenis)     |
| `/scroll-anim` | Scroll animations (GSAP + ScrollTrigger + SplitText)   |
| `/component`   | DOM components with Taxi lifecycle                     |
| `/perf-audit`  | 60fps audit checklist across all browsers              |
| `/webflow`     | Webflow integration (data attributes, script loading)  |
| `/debug`       | Symptom-to-diagnosis troubleshooting guide             |
| `/new-project` | Bootstrap new project from this starter                |

## Known Gotchas

- `webgl:transition:target-ready` is consumed by TransitionController but **not emitted** by the boilerplate — your target page code must emit it with `{ rect, viewport, screen }`
- Canvas resize handler is **not debounced** — direct `window.addEventListener('resize', ...)` in `src/canvas/index.js`
