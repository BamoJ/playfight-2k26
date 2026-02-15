---
name: new-project
description: Bootstrap a new project from this starter. Use when cloning the starter for a new client site, scaffolding pages, registering routes, and setting up Webflow data attributes.
user-invocable: true
---

# New Project — Bootstrap from Starter

## Step-by-Step Checklist

### 1. Clone and Configure

```bash
# Clone the starter
git clone <starter-repo-url> <project-name>
cd <project-name>

# Update package.json
# Change "name" to your project name

# Install dependencies
bun install
```

### 2. Identify Pages from Webflow

List all pages in your Webflow site. Each page that needs WebGL effects gets a Page subclass.

Common pages:
- `home` — homepage (usually has image grid with hover effects)
- `work` — project listing
- `project` — individual project detail (transition target)
- `about` — about page
- `contact` — contact page

Pages without WebGL effects don't need a Page subclass — they still get Taxi routing and scroll animations automatically.

### 3. Create Page Subclasses

For each page that needs WebGL:

```js
// src/canvas/Work/index.js
import { Page } from '../Page';

export class Work extends Page {
  calculateViewport() {
    this.screen = {
      width: window.innerWidth,
      height: window.innerHeight,
    };
    const fov = this.camera.fov * (Math.PI / 180);
    const viewportHeight =
      2 * Math.tan(fov / 2) * this.camera.position.z;
    const viewportWidth = viewportHeight * this.camera.aspect;
    this.viewport = {
      width: viewportWidth,
      height: viewportHeight,
    };
  }

  create(template) {
    super.create(template);
    this.calculateViewport();
    // Initialize your WebGL content
    // If using DOMPlane, create a view subclass
  }

  onEnter(data) {
    super.onEnter(data);
    // Optional: emit ready signal for preloader
    // emitter.emit('work:enter-ready');
  }

  transitionIn(onComplete) {
    // Animate WebGL content in
    onComplete?.();
  }

  transitionOut(onComplete) {
    // Animate WebGL content out
    // Then cleanup
    setTimeout(() => {
      onComplete?.();
    }, 800); // match your animation duration
  }

  update(time) {
    if (!this.isActive) return;
    // Per-frame updates
  }

  onResize() {
    this.calculateViewport();
    // Update view dimensions
  }
}
```

### 4. Register Pages in main.js

```js
// src/main.js
import { Home } from '@canvas/Home';
import { Work } from '@canvas/Work';
import { Project } from '@canvas/Project';

const pages = {
  home: Home,
  work: Work,
  project: Project,
  // key must match data-page value in Webflow
};
```

### 5. Set Up Webflow Data Attributes

In Webflow, add these attributes to your elements:

**On every page's `<body>` or main wrapper:**
```html
<body data-page="home">
```

**On the content wrapper (for Taxi):**
```html
<div data-taxi-view>
  <!-- page content -->
</div>
```

**On images that need WebGL:**
```html
<div data-gl-container>
  <a href="/work/project-slug">
    <img data-gl="img" src="image.jpg" />
  </a>
</div>
```

**On the preloader:**
```html
<div data-loader="wrapper">
  <span data-loader="loader-num">0</span>
  <div data-loader="progress-bar"></div>
</div>
```

**On animated elements:**
```html
<h1 data-anim-heading="true">Title</h1>
<p data-anim-para="true">Body text</p>
<img data-anim-imgparallax="true" src="bg.jpg" />
```

**Canvas container (fixed, full-screen):**
```html
<div class="canvas"></div>
```

### 6. Configure Preloader

In `src/main.js`, set the `readySignal` to match your homepage's ready event:

```js
const preloader = new Preloader({
  readySignal: 'home:enter-ready',
  onAppStart: () => { ... },
});
```

Your homepage must emit this signal:
```js
// In your Home page's create() or onEnter()
setTimeout(() => {
  emitter.emit('home:enter-ready');
}, 0);
```

### 7. Add Page-Specific Transitions (Optional)

If a page needs a custom transition instead of the default fade:

```js
// src/transitions/pages/ProjectTransition.js
import { Transition } from '@unseenco/taxi';

export default class ProjectTransition extends Transition {
  onLeave({ from, trigger, done }) {
    gsap.to(from, {
      opacity: 0,
      y: -50,
      duration: 0.6,
      ease: 'power2.in',
      onComplete: done,
    });
  }

  onEnter({ to, from, done }) {
    gsap.fromTo(to,
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out',
        onComplete: done,
      }
    );
  }
}
```

Register in main.js:
```js
import ProjectTransition from '@transitions/pages/ProjectTransition';

const pageTransitions = {
  project: ProjectTransition,
};
```

### 8. Set Up Components

Add project-specific components in `src/components/`:

```js
// src/components/index.js
import Menu from './Menu';
import Cursor from './Cursor';

export default class Components {
  constructor() {
    this.instances = {};
    this.initComponents();
  }

  initComponents() {
    this.instances.menu = new Menu();
    // Only on desktop
    if (window.innerWidth > 768) {
      this.instances.cursor = new Cursor();
    }
  }

  destroy() {
    Object.values(this.instances).forEach(c => c.destroy?.());
    this.instances = {};
  }
}
```

### 9. Add Custom Animations (Optional)

For project-specific scroll animations:

```js
// src/animations/global/yourEffect/YourEffect.js
import AnimationCore from '../../_core/AnimationCore';

export default class YourEffect extends AnimationCore {
  constructor(element) {
    super(element, { duration: 1.2, ease: 'power3.out' });
    this.init();
  }

  animate() {
    this.timeline.from(this.element, {
      autoAlpha: 0,
      y: 30,
      duration: this.options.duration,
      ease: this.options.ease,
    });
  }
}
```

Register in `src/animations/index.js`.

### 10. Build and Test

```bash
# Dev server with HMR
bun run dev

# In Webflow custom code, add:
# <script src="http://localhost:3000/src/main.js" type="module"></script>

# Production build
bun run build
# Upload dist/main.js to your CDN
# Update Webflow script tag to production URL
```

## WebGL Transition Setup (Between Pages)

If you want images to fly between pages (e.g., homepage → project detail):

### Source page (e.g., Home):
```js
// In HomeView's createPlanes()
setupTransitionHandler(mesh, img) {
  const link = img.closest('[data-gl-container]')?.querySelector('a');
  link?.addEventListener('click', () => {
    if (window.matchMedia('(max-width: 768px)').matches) return;
    emitter.emit('webgl:transition:prepare', {
      mesh,
      targetUrl: link.href,
      sourcePage: 'home',
    });
  }, { signal: this.abortController.signal });
}
```

### Target page (e.g., Project):
```js
// In Project page's create() or onEnter()
const heroImg = document.querySelector('[data-gl="hero"]');
if (heroImg) {
  const rect = heroImg.getBoundingClientRect();
  emitter.emit('webgl:transition:target-ready', {
    rect,
    viewport: this.viewport,
    screen: this.screen,
  });
}
```

### Listening for handoff:
```js
emitter.on('webgl:transition:handoff', () => {
  // Fade in the HTML hero image
  gsap.to(heroImg, { opacity: 1, duration: 0.5 });
});
```

## Pre-Launch Performance Checklist

Before deploying, verify:

- [ ] Pixel ratio capped at 2 (`src/canvas/index.js`)
- [ ] Delta capped at 60ms (`src/canvas/utils/Time.js`)
- [ ] Mobile guard at 768px for WebGL effects
- [ ] `gsap.ticker.lagSmoothing(0)` set (`src/utils/smoothscroll.js`)
- [ ] All geometries/materials disposed on page leave
- [ ] AbortController.abort() called in DOMPlane destroy
- [ ] `cleanup: true` for one-shot scroll animations
- [ ] Textures through TextureCache (not direct TextureLoader)
- [ ] Image sizes appropriate (2048 max desktop, 1024 mobile)
- [ ] Production build has console.log stripped (terser config)
- [ ] Test on Safari, Firefox, Chrome, mobile Safari, Chrome Android

## Key Files to Modify

- `src/main.js` — Page registry, transition registry, preloader config
- `src/canvas/YourPage/index.js` — New page classes
- `src/components/index.js` — Component registration
- `src/animations/index.js` — Animation registration
- `src/transitions/pages/` — Custom page transitions
- `package.json` — Project name
- `vite.config.js` — Usually no changes needed
