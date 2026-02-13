# WebGL + Webflow Boilerplate

A reusable starter for Webflow sites with custom WebGL experiences. Built with Three.js, GSAP, Taxi (page routing), and Lenis (smooth scroll). HTML lives in Webflow — this repo is the JS/WebGL layer injected via `<script>`.

## Core Features

### 1. WebGL Engine (`canvas/`)
- **Page System** — universal base class for every WebGL page
  - Full lifecycle: `create() → onEnter() → update() → onLeave() → destroy()`
  - Scene management via `this.elements` (THREE.Group)
  - Extends Emitter for internal events
  - Works for any experience: DOM-mapped planes, particles, 3D scenes

- **DOMPlane** — optional helper to map DOM elements → WebGL planes
  - Creates PlaneGeometry sized to match DOM element's bounding rect
  - Converts DOM pixels → WebGL world coordinates (FOV-based)
  - Syncs position every frame (scroll, layout changes)
  - Hover system: mouseenter/leave/move with velocity tracking → shader uniforms
  - Works with images, videos, or any element with a bounding rect
  - AbortController for clean event listener teardown

- **TransitionController** — seamless cross-page WebGL transitions
  - Clones source mesh, hides original
  - Animates cloned mesh to target DOM position (1.5s expo.inOut)
  - UV correction for object-fit:cover during size transitions
  - Handoff: WebGL plane fades out, HTML image fades in
  - State machine: Idle → Preparing → Waiting → Animating → Complete

- **Default Shaders**
  - Vertex: deformation curve, paper ripple transition, perlin noise, reveal effect
  - Fragment: depth parallax, RGB shift along mouse direction
  - Shared GLSL includes (perlin noise)

### 2. Unified Event System (`utils/Emitter.js`)
Single event system replacing the old dual EventBus + EventEmitter:
- **As a class**: `class Time extends Emitter` — for Page, Time lifecycle events
- **As a singleton**: `import emitter from '@utils/Emitter'` — for global signals
- API: `on()`, `once()`, `off()`, `emit()`, `clear()`
- Namespace support for grouped cleanup: `emitter.off('tick', null, 'myView')`
- ~80 lines, flat map lookup (optimized for RAF tick every frame)

### 3. Page Routing (`transitions/`)
- **TransitionManager** — wraps Taxi with shared orchestration logic
  - Stop/start smooth scroll on navigate
  - Emit `transition:start` / `transition:complete` events
  - Trigger Canvas page swap (WebGL)
  - Reinitialize DOM components after navigation
  - Config-based: accepts `pages` and `pageTransitions` registries

- **Preloader** — loading screen skeleton
  - Tracks real loading progress (texture preloading)
  - RAF-based smooth progress ticker
  - Configurable `readySignal` (e.g. `'home:enter-ready'`)
  - Customizable exit animation

- **GlobalEnter** — default page enter transition (fade out/in)

### 4. Component Architecture (`components/`)
- **ComponentCore** — base class with lifecycle management
  - `createElements()`, `createEvents()`, `addEventListeners()`
  - `init()` / `destroy()` lifecycle
- **Components manager** — initializes all DOM UI components

### 5. Utilities
- **SmoothScroll** — Lenis wrapper (singleton) with ScrollTrigger integration
- **TextureCache** — singleton texture loader with cache + dedup
- **Time** — RAF timer (extends Emitter, emits `tick`)
- **Easings** — GSAP CustomEase presets

## Project Structure
```
src/
├── canvas/                        # All WebGL logic
│   ├── index.js                   # Canvas manager (renderer, camera, page lifecycle)
│   ├── Page.js                    # Base class for all WebGL pages
│   ├── DOMPlane.js                # Helper: DOM elements → WebGL planes
│   ├── TransitionController.js    # Cross-page mesh transitions
│   ├── shaders/                   # Default/shared shaders
│   │   ├── defaultVert.glsl
│   │   └── defaultFrag.glsl
│   ├── utils/
│   │   ├── Time.js                # RAF timer
│   │   ├── TextureCache.js        # Texture loader with cache
│   │   └── includes/              # Shared GLSL (perlin noise, etc.)
│   └── Home/                      # Example page — replace per project
│       └── index.js
│
├── transitions/                   # Page routing + transitions
│   ├── index.js                   # TransitionManager (Taxi wrapper)
│   ├── Preloader.js               # Loading screen skeleton
│   └── global/
│       └── GlobalEnter.js         # Default enter transition
│
├── components/                    # DOM UI components
│   ├── index.js                   # Component manager
│   └── core/
│       └── ComponentCore.js       # Base component class
│
├── utils/                         # Global utilities
│   ├── Emitter.js                 # Unified event system
│   ├── smoothscroll.js            # Lenis wrapper
│   └── easings.js                 # GSAP custom easings
│
├── styles/                        # Extra CSS outside Webflow
│   ├── index.css                  # Style entry point
│   ├── base.css                   # .is-transition class for Taxi
│   ├── lenis.css                  # Smooth scroll overrides
│   └── easings.css                # CSS easing custom properties
│
└── main.js                        # Entry point (page + transition registries)
```

## Usage

### 1. Installation
```bash
bun install
```

### 2. Development
```bash
bun run dev
```

### 3. Production Build
```bash
bun run build
```
Outputs `dist/main.js` — single IIFE bundle with CSS inlined.

### 4. Webflow Integration

Add to your Webflow project settings (Site Level), custom code before `</head>`:

**Auto-switch between dev and production:**
```html
<script>
  (function () {
    const urlParams = new URLSearchParams(window.location.search);
    const isDev = urlParams.get('dev') === 'true';

    function loadScript(isDevMode) {
      if (isDevMode) {
        const viteClient = document.createElement('script');
        viteClient.type = 'module';
        viteClient.src = 'http://localhost:3000/@vite/client';
        document.head.insertBefore(viteClient, document.head.firstChild);
      }

      const script = document.createElement('script');
      script.type = isDevMode ? 'module' : 'text/javascript';
      script.src = isDevMode
        ? 'http://localhost:3000/src/main.js'
        : '[your-production-url]/main.js';

      script.onerror = () => {
        sessionStorage.removeItem('localDev');
        loadScript(false);
      };

      document.head.insertBefore(script, document.head.firstChild);
    }

    if (isDev) {
      sessionStorage.setItem('localDev', 'true');
    }

    loadScript(sessionStorage.getItem('localDev') === 'true');
  })();
</script>
```

### 5. Adding a New WebGL Page

Create your page class:
```js
// src/canvas/YourPage/index.js
import { Page } from '../Page';

export class YourPage extends Page {
  create(template) { /* setup WebGL */ }
  update(time) { /* per-frame logic */ }
  onResize() { /* handle resize */ }
}
```

Register in `src/main.js`:
```js
import { YourPage } from '@canvas/YourPage';
const pages = { home: Home, yourpage: YourPage };
```

Add page identifier in Webflow:
```html
<body data-page="yourpage">
```

### 6. Using DOMPlane for Image/Video WebGL

```js
import { DOMPlane } from '../DOMPlane';

class MyView extends DOMPlane {
  constructor(options) {
    super({ ...options, shaders: { vertex: vert, fragment: frag } });
    this.loadImages();
  }

  onHoverEnter(mesh) {
    // Animate shader uniforms on hover
    gsap.to(mesh.material.uniforms.uReveal, { value: 1 });
  }

  onHoverLeave(mesh) {
    gsap.to(mesh.material.uniforms.uReveal, { value: 0 });
  }
}
```

Mark DOM elements for WebGL mapping:
```html
<div data-gl-container>
  <img data-gl="img" src="..." />
</div>
```

### 7. Page-Specific Transitions (Optional)

```js
// src/transitions/pages/YourPageTrans.js
import { Transition } from '@unseenco/taxi';

export default class YourPageTransition extends Transition {
  onLeave({ from, trigger, done }) { done(); }
  onEnter({ to, trigger }, animationComplete) {
    // Your GSAP animation
    animationComplete();
  }
}
```

Register: `const pageTransitions = { yourpage: YourPageTransition };`

## Global Events

Via the singleton emitter (`import emitter from '@utils/Emitter'`):

| Event | When |
|---|---|
| `transition:start` | Page navigation begins |
| `transition:complete` | New page loaded, components initialized |
| `home:enter-ready` | Homepage WebGL ready (configurable per page) |
| `webgl:transition:prepare` | User clicked a link, clone mesh |
| `webgl:transition:target-ready` | Target page loaded, animate to position |
| `webgl:transition:handoff` | Switch from WebGL plane to HTML image |
| `webgl:transition:complete` | Transition cleanup done |

## DOM Attributes

| Attribute | Purpose |
|---|---|
| `data-page="home"` | Identifies which WebGL page to load |
| `data-gl="img"` | Marks an image for WebGL plane mapping |
| `data-gl-src="..."` | Override image source for WebGL texture |
| `data-gl-container` | Parent container for hover detection |
| `data-loader="wrapper"` | Preloader container |
| `data-loader="loader-num"` | Progress number display |
| `data-loader="progress-bar"` | Progress bar element |
| `data-taxi-ignore` | Exclude link from Taxi routing |
| `data-lenis-prevent` | Exclude element from smooth scroll |

## CSS Features

### Easing Variables
Complete set of cubic-bezier easings available as CSS custom properties:
```css
var(--ease-out-expo)
var(--ease-in-out-quart)
var(--gleasing)
/* ... and more */
```

### Smooth Scroll
Lenis integration with automatic ScrollTrigger sync.

## Conventions
- Tabs for indentation, single quotes, trailing commas (see `.prettierrc`)
- GLSL shaders imported via `vite-plugin-glsl` with `#include` support
- Path aliases: `@canvas`, `@utils`, `@transitions`, `@components`, `@styles`
- Mobile: WebGL effects disabled under 768px width
- Console logs stripped in production build via terser

## Browser Support
Modern browsers (Chrome, Firefox, Safari, Edge).

## License
MIT
