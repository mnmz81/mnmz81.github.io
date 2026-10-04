# Task 10: Motion — reveal on scroll, route view transitions, reduced motion

> Read first: `docs/plan/README.md` (Global Constraints), `docs/plan/contracts.md`, `docs/plan/spec.md`.

**Goal:** Implement `RevealDirective` (fade-up when an element scrolls into view, never hiding content that is already visible or rendered on the server) and the global motion stylesheet: reveal classes, route cross-fade view transitions, smooth scrolling, and a global `prefers-reduced-motion` kill switch.

**Wave:** 1 (parallel).

**Files:**
- Modify (replace stub): `src/app/shared/reveal/reveal.directive.ts`
- Test: `src/app/shared/reveal/reveal.directive.spec.ts`
- Modify (replace stub): `src/styles/_motion.scss`

**Interfaces:**
- Consumes: tokens `--duration-*`, `--ease-out` (contracts §7). The router already has `withViewTransitions()` (Task 00). The header element has class `site-header` (Task 03).
- Produces: `RevealDirective` keeps selector `[appReveal]` and `revealDelay = input(0)` (pages already use them). Classes `.reveal`, `.reveal--pending`, `.reveal--visible` (contracts §7).

Rules:
- Server-rendered HTML must be fully visible (no JS = no hidden content). Only the browser hides elements, and only those below the fold at startup.
- Reduced motion → the directive does nothing; CSS also neutralizes all animations and transitions.

---

### Step 1: Write the failing test

- [ ] Create `src/app/shared/reveal/reveal.directive.spec.ts`:

```ts
import { Component, PLATFORM_ID, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RevealDirective } from './reveal.directive';

@Component({
  imports: [RevealDirective],
  template: `<div appReveal [revealDelay]="delay()">content</div>`,
})
class Host {
  readonly delay = signal(0);
}

let ioCallback: IntersectionObserverCallback | undefined;
const observe = vi.fn();
const disconnect = vi.fn();

class FakeIntersectionObserver {
  constructor(cb: IntersectionObserverCallback) {
    ioCallback = cb;
  }
  observe = observe;
  disconnect = disconnect;
  unobserve = vi.fn();
}

function stubEnvironment({ top, reducedMotion = false }: { top: number; reducedMotion?: boolean }) {
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: reducedMotion }));
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ top } as DOMRect);
}

async function render(delay = 0, platform = 'browser') {
  TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: platform }] });
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.delay.set(delay);
  await fixture.whenStable();
  return { fixture, el: fixture.nativeElement.querySelector('div') as HTMLElement };
}

describe('RevealDirective', () => {
  beforeEach(() => {
    ioCallback = undefined;
    observe.mockClear();
    disconnect.mockClear();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('hides below-the-fold elements and reveals them on intersection', async () => {
    stubEnvironment({ top: 5000 });
    const { el } = await render();
    expect(el.classList).toContain('reveal--pending');
    expect(observe).toHaveBeenCalledWith(el);

    ioCallback!([{ isIntersecting: true, target: el } as unknown as IntersectionObserverEntry], {} as IntersectionObserver);
    expect(el.classList).not.toContain('reveal--pending');
    expect(el.classList).toContain('reveal--visible');
    expect(disconnect).toHaveBeenCalled();
  });

  it('applies the delay as a transition delay', async () => {
    stubEnvironment({ top: 5000 });
    const { el } = await render(200);
    expect(el.style.transitionDelay).toBe('200ms');
  });

  it('never hides elements already in the viewport', async () => {
    stubEnvironment({ top: 100 });
    const { el } = await render();
    expect(el.classList).not.toContain('reveal--pending');
    expect(observe).not.toHaveBeenCalled();
  });

  it('does nothing with reduced motion', async () => {
    stubEnvironment({ top: 5000, reducedMotion: true });
    const { el } = await render();
    expect(el.classList).not.toContain('reveal--pending');
  });

  it('does nothing on the server', async () => {
    stubEnvironment({ top: 5000 });
    const { el } = await render(0, 'server');
    expect(el.classList).not.toContain('reveal--pending');
  });

  it('disconnects the observer on destroy', async () => {
    stubEnvironment({ top: 5000 });
    const { fixture } = await render();
    fixture.destroy();
    expect(disconnect).toHaveBeenCalled();
  });
});
```

- [ ] Run `npm test`. Expected: FAIL (`reveal--pending` never added).

### Step 2: Implement the directive

- [ ] Replace `src/app/shared/reveal/reveal.directive.ts`:

```ts
import { isPlatformBrowser } from '@angular/common';
import { DestroyRef, Directive, ElementRef, PLATFORM_ID, afterNextRender, inject, input } from '@angular/core';

/** Fades the host in when it first scrolls into view. Content above the fold, on the server, or with reduced motion is never hidden. */
@Directive({ selector: '[appReveal]' })
export class RevealDirective {
  readonly revealDelay = input(0);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private observer?: IntersectionObserver;

  constructor() {
    afterNextRender(() => this.setup());
    inject(DestroyRef).onDestroy(() => this.observer?.disconnect());
  }

  private setup(): void {
    const el = this.host.nativeElement;
    const win = el.ownerDocument.defaultView;
    if (!this.isBrowser || !win || typeof win.IntersectionObserver === 'undefined') return;
    if (win.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    if (el.getBoundingClientRect().top < win.innerHeight) return;

    el.classList.add('reveal', 'reveal--pending');
    const delay = this.revealDelay();
    if (delay > 0) el.style.transitionDelay = `${delay}ms`;

    this.observer = new win.IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        el.classList.replace('reveal--pending', 'reveal--visible');
        this.observer?.disconnect();
      },
      { rootMargin: '0px 0px -10% 0px' },
    );
    this.observer.observe(el);
  }
}
```

- [ ] Run `npm test`. Expected: PASS.

### Step 3: Global motion styles

- [ ] Replace `src/styles/_motion.scss`:

```scss
// Reveal on scroll (RevealDirective adds these classes in the browser only).
.reveal {
  transition:
    opacity var(--duration-slow) var(--ease-out),
    transform var(--duration-slow) var(--ease-out);
}

.reveal--pending {
  opacity: 0;
  transform: translateY(24px);
}

.reveal--visible {
  opacity: 1;
  transform: none;
}

// Route transitions (router: withViewTransitions()).
// Post titles morph between card and page via view-transition-name: post-title-<slug>.
.site-header {
  view-transition-name: site-header;
}

::view-transition-group(*) {
  animation-duration: var(--duration-base);
  animation-timing-function: var(--ease-out);
}

::view-transition-old(root) {
  animation: vt-fade-out var(--duration-base) var(--ease-out) both;
}

::view-transition-new(root) {
  animation: vt-fade-in var(--duration-base) var(--ease-out) both;
}

@keyframes vt-fade-out {
  to {
    opacity: 0;
    transform: translateY(-6px);
  }
}

@keyframes vt-fade-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
}

@media (prefers-reduced-motion: no-preference) {
  html {
    scroll-behavior: smooth;
  }
}

// Global kill switch: every animation and transition on the site stops.
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation: none !important;
  }

  .reveal--pending {
    opacity: 1;
    transform: none;
  }
}
```

### Step 4: Verify and commit

- [ ] Run `npm test` and `npm run build`. Expected: PASS; build succeeds.
- [ ] Manual check with `npm start` (Chrome):
  - Scroll the About page: sections below the fold fade up once; nothing above the fold flickers on load.
  - Navigate Blog → a post: the page cross-fades and the post title morphs from the card into the heading; the header stays still.
  - Turn on OS "Reduce motion" and reload: no fades, no morph, no smooth scrolling, all content visible.
  - Disable JavaScript and reload a prerendered page: all content visible.
- [ ] Commit:

```bash
git add src/app/shared/reveal src/styles/_motion.scss
git commit -m "feat(motion): reveal on scroll, route view transitions, reduced-motion guard"
```
