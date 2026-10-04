# Task 09: SEO meta, JSON-LD, analytics

> Read first: `docs/plan/README.md` (Global Constraints), `docs/plan/contracts.md`, `docs/plan/spec.md`.

**Goal:** Turn the `SeoService` stub into full SEO (description, canonical, Open Graph, Twitter card, article meta, JSON-LD) and implement `AnalyticsService` (GoatCounter, cookie-free, loaded only in the browser and only when a code is configured, counting SPA navigations).

**Wave:** 1 (parallel).

**Files:**
- Modify: `src/app/core/seo.service.ts`, `src/app/core/seo.service.spec.ts`
- Modify: `src/app/core/analytics.service.ts`; create `src/app/core/analytics.service.spec.ts`

**Interfaces:**
- Consumes: `SITE` (`url`, `title`, `defaultOgImage`, `analytics.goatcounterCode`).
- Produces: unchanged public API from contracts §4: `PageSeo`, `formatTitle()`, `SeoService.set(page)`, `AnalyticsService.init()`. New: `GOATCOUNTER_CODE` injection token (defaults to `SITE.analytics.goatcounterCode`) so tests can override it. Pages (Tasks 04–08) already call `set()` with the values in contracts §5.

Keep `formatTitle` and the existing title behaviour exactly; other tasks' tests assert page titles.

---

### Step 1: SEO tests (extend the existing spec)

- [ ] Replace `src/app/core/seo.service.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';
import { SeoService, formatTitle } from './seo.service';

const meta = (attr: 'name' | 'property', key: string) =>
  document.head.querySelector(`meta[${attr}="${key}"]`)?.getAttribute('content');

describe('formatTitle', () => {
  it('keeps the site title unchanged', () => {
    expect(formatTitle('Moris Maor Zakay')).toBe('Moris Maor Zakay');
  });

  it('suffixes page titles with the site title', () => {
    expect(formatTitle('Blog')).toBe('Blog · Moris Maor Zakay');
  });
});

describe('SeoService', () => {
  let seo: SeoService;
  beforeEach(() => {
    document.head.querySelectorAll('meta, link[rel="canonical"], script[type="application/ld+json"]').forEach((n) => n.remove());
    seo = TestBed.inject(SeoService);
  });

  it('sets title, description and canonical', () => {
    seo.set({ title: 'About', description: 'About me', path: '/about' });
    expect(TestBed.inject(Title).getTitle()).toBe('About · Moris Maor Zakay');
    expect(meta('name', 'description')).toBe('About me');
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://mnmz81.github.io/about');
  });

  it('sets Open Graph and Twitter tags with absolute default image', () => {
    seo.set({ title: 'About', description: 'About me', path: '/about' });
    expect(meta('property', 'og:title')).toBe('About · Moris Maor Zakay');
    expect(meta('property', 'og:description')).toBe('About me');
    expect(meta('property', 'og:url')).toBe('https://mnmz81.github.io/about');
    expect(meta('property', 'og:type')).toBe('website');
    expect(meta('property', 'og:image')).toBe('https://mnmz81.github.io/og/default.png');
    expect(meta('property', 'og:site_name')).toBe('Moris Maor Zakay');
    expect(meta('name', 'twitter:card')).toBe('summary_large_image');
    expect(meta('name', 'twitter:image')).toBe('https://mnmz81.github.io/og/default.png');
  });

  it('sets article meta and replaces tags between pages', () => {
    seo.set({
      title: 'Post',
      description: 'd',
      path: '/blog/post',
      type: 'article',
      image: '/og/post.png',
      publishedTime: '2026-08-30',
      tags: ['a', 'b'],
    });
    expect(meta('property', 'og:type')).toBe('article');
    expect(meta('property', 'og:image')).toBe('https://mnmz81.github.io/og/post.png');
    expect(meta('property', 'article:published_time')).toBe('2026-08-30');
    expect(document.head.querySelectorAll('meta[property="article:tag"]')).toHaveLength(2);

    seo.set({ title: 'About', description: 'd', path: '/about' });
    expect(document.head.querySelectorAll('meta[property="article:tag"]')).toHaveLength(0);
    expect(meta('property', 'article:published_time')).toBeUndefined();
  });

  it('writes a single JSON-LD script and removes it when absent', () => {
    seo.set({ title: 'Home', description: 'd', path: '/', jsonLd: { '@type': 'Person', name: 'A </script>' } });
    seo.set({ title: 'Home', description: 'd', path: '/', jsonLd: { '@type': 'Person', name: 'B' } });
    const scripts = document.head.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts).toHaveLength(1);
    expect(JSON.parse(scripts[0].textContent ?? '')).toEqual({ '@type': 'Person', name: 'B' });

    seo.set({ title: 'About', description: 'd', path: '/about' });
    expect(document.head.querySelector('script[type="application/ld+json"]')).toBeNull();
  });

  it('escapes "<" inside JSON-LD', () => {
    seo.set({ title: 'Home', description: 'd', path: '/', jsonLd: { name: 'A </script>' } });
    expect(document.head.querySelector('script[type="application/ld+json"]')?.textContent).not.toContain('</script>');
  });
});
```

- [ ] Run `npm test`. Expected: FAIL (meta tags missing).

### Step 2: Implement SeoService

- [ ] Replace `src/app/core/seo.service.ts`:

```ts
import { DOCUMENT, Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { SITE } from './site.config';

export interface PageSeo {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  tags?: string[];
  jsonLd?: Record<string, unknown>;
}

export function formatTitle(title: string): string {
  return title === SITE.title ? title : `${title} · ${SITE.title}`;
}

const JSON_LD_ID = 'seo-jsonld';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly titleService = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  set(page: PageSeo): void {
    const title = formatTitle(page.title);
    const url = SITE.url + page.path;
    const image = SITE.url + (page.image ?? SITE.defaultOgImage);

    this.titleService.setTitle(title);
    this.meta.updateTag({ name: 'description', content: page.description });

    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: page.description });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ property: 'og:type', content: page.type ?? 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: SITE.title });
    this.meta.updateTag({ property: 'og:locale', content: 'en_US' });

    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: page.description });
    this.meta.updateTag({ name: 'twitter:image', content: image });

    this.setOptionalProperty('article:published_time', page.publishedTime);
    this.setOptionalProperty('article:modified_time', page.modifiedTime);
    this.meta.getTags('property="article:tag"').forEach((tag) => this.meta.removeTagElement(tag));
    for (const tag of page.tags ?? []) this.meta.addTag({ property: 'article:tag', content: tag }, true);

    this.setCanonical(url);
    this.setJsonLd(page.jsonLd);
  }

  private setOptionalProperty(property: string, content: string | undefined): void {
    if (content) this.meta.updateTag({ property, content });
    else this.meta.removeTag(`property="${property}"`);
  }

  private setCanonical(url: string): void {
    let link = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.rel = 'canonical';
      this.document.head.appendChild(link);
    }
    link.href = url;
  }

  private setJsonLd(data: Record<string, unknown> | undefined): void {
    this.document.getElementById(JSON_LD_ID)?.remove();
    if (!data) return;
    const script = this.document.createElement('script');
    script.id = JSON_LD_ID;
    script.type = 'application/ld+json';
    // Escape '<' so a string value can never close the script element.
    script.textContent = JSON.stringify(data).replace(/</g, '\\u003c');
    this.document.head.appendChild(script);
  }
}
```

(If `DOCUMENT` is not exported from `@angular/core` in your version, import it from `@angular/common`.) Note: `link.href` may normalize; the test reads the attribute, which equals the assigned absolute URL.

- [ ] Run `npm test`. Expected: PASS.

### Step 3: Analytics (TDD)

- [ ] Create `src/app/core/analytics.service.spec.ts`:

```ts
import { Component, PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AnalyticsService, GOATCOUNTER_CODE } from './analytics.service';

@Component({ template: '' })
class Blank {}

const script = () => document.head.querySelector<HTMLScriptElement>('script[data-goatcounter]');

function setup(code: string, platform = 'browser') {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: '**', component: Blank }]),
      { provide: GOATCOUNTER_CODE, useValue: code },
      { provide: PLATFORM_ID, useValue: platform },
    ],
  });
  TestBed.inject(AnalyticsService).init();
  return TestBed.inject(Router);
}

describe('AnalyticsService', () => {
  beforeEach(() => script()?.remove());
  afterEach(() => {
    delete (window as { goatcounter?: unknown }).goatcounter;
  });

  it('does nothing without a code', () => {
    setup('');
    expect(script()).toBeNull();
  });

  it('does nothing on the server', () => {
    setup('moris', 'server');
    expect(script()).toBeNull();
  });

  it('loads the GoatCounter script with SPA settings', () => {
    setup('moris');
    expect(script()?.src).toBe('https://gc.zgo.at/count.js');
    expect(script()?.dataset['goatcounter']).toBe('https://moris.goatcounter.com/count');
    expect(JSON.parse(script()?.dataset['goatcounterSettings'] ?? '{}')).toEqual({ no_onload: true });
  });

  it('queues page views until the script loads, then counts every navigation', async () => {
    const router = setup('moris');
    await router.navigateByUrl('/blog');

    const count = vi.fn();
    (window as { goatcounter?: unknown }).goatcounter = { count };
    script()!.dispatchEvent(new Event('load'));
    expect(count).toHaveBeenCalledWith({ path: '/blog' });

    await router.navigateByUrl('/about');
    expect(count).toHaveBeenLastCalledWith({ path: '/about' });
  });
});
```

- [ ] Run `npm test`. Expected: FAIL (`GOATCOUNTER_CODE` not exported).

- [ ] Replace `src/app/core/analytics.service.ts`:

```ts
import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT, DestroyRef, Injectable, InjectionToken, PLATFORM_ID, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { SITE } from './site.config';

interface GoatCounter {
  count(vars: { path: string }): void;
}

export const GOATCOUNTER_CODE = new InjectionToken<string>('GOATCOUNTER_CODE', {
  factory: () => SITE.analytics.goatcounterCode,
});

/** Cookie-free page view counting with GoatCounter. Inactive until SITE.analytics.goatcounterCode is set. */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly code = inject(GOATCOUNTER_CODE);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private pending: string[] = [];

  init(): void {
    if (!this.isBrowser || !this.code) return;

    const script = this.document.createElement('script');
    script.async = true;
    script.src = 'https://gc.zgo.at/count.js';
    script.dataset['goatcounter'] = `https://${this.code}.goatcounter.com/count`;
    script.dataset['goatcounterSettings'] = JSON.stringify({ no_onload: true });
    script.addEventListener('load', () => this.flush());
    this.document.head.appendChild(script);

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => this.track(event.urlAfterRedirects));
  }

  private track(path: string): void {
    const counter = (this.document.defaultView as (Window & { goatcounter?: GoatCounter }) | null)?.goatcounter;
    if (counter?.count) counter.count({ path });
    else this.pending.push(path);
  }

  private flush(): void {
    const queued = this.pending;
    this.pending = [];
    queued.forEach((path) => this.track(path));
  }
}
```

- [ ] Run `npm test`. Expected: PASS.

### Step 4: Verify and commit

- [ ] Run `npm test` and `npm run build`. Expected: PASS; `grep -o '<meta property="og:title"[^>]*>' dist/moris-site/browser/about/index.html` prints the About OG title (meta tags are prerendered).
- [ ] Commit:

```bash
git add src/app/core/seo.service.ts src/app/core/seo.service.spec.ts src/app/core/analytics.service.ts src/app/core/analytics.service.spec.ts
git commit -m "feat(seo): meta, open graph, canonical, json-ld and goatcounter analytics"
```
