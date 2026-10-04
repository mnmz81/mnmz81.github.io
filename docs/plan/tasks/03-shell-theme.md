# Task 03: Shell — header, footer, theme toggle

> Read first: `docs/plan/README.md` (Global Constraints), `docs/plan/contracts.md`, `docs/plan/spec.md`.

**Goal:** Finish the site chrome: a sticky, blurred header with brand, nav (active state), mobile menu, and light/dark toggle; a footer with social links; a `ThemeService` that persists the choice; and an inline script that applies the stored theme before first paint (no flash).

**Wave:** 1 (parallel).

**Files:**
- Create: `src/app/core/theme.service.ts`, `src/app/core/theme.service.spec.ts`
- Create: `src/app/shared/layout/theme-toggle/theme-toggle.ts`, `theme-toggle.scss`, `theme-toggle.spec.ts`
- Modify (replace stubs): `src/app/shared/layout/site-header/site-header.{ts,html,scss}`; create `site-header.spec.ts`
- Modify (replace stubs): `src/app/shared/layout/site-footer/site-footer.{ts,html,scss}`; create `site-footer.spec.ts`
- Modify: `src/index.html`

**Interfaces:**
- Consumes: `SITE` (`src/app/core/site.config.ts`), tokens and utility classes (contracts §7).
- Produces: `ThemeService { theme: Signal<'light'|'dark'>; toggle(): void; set(theme): void }`. Theme attribute `data-theme` on `<html>`, `localStorage` key `theme` (contracts §7). Selectors `app-site-header`, `app-site-footer` (already used by `App`).

---

### Step 1: ThemeService (TDD)

- [ ] Write the failing test `src/app/core/theme.service.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeService } from './theme.service';

function stubSystemDark(matches: boolean) {
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches }));
}

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });
  afterEach(() => vi.unstubAllGlobals());

  it('uses the stored theme first', () => {
    localStorage.setItem('theme', 'dark');
    stubSystemDark(false);
    expect(TestBed.inject(ThemeService).theme()).toBe('dark');
  });

  it('falls back to the system preference', () => {
    stubSystemDark(true);
    expect(TestBed.inject(ThemeService).theme()).toBe('dark');
  });

  it('defaults to light', () => {
    stubSystemDark(false);
    expect(TestBed.inject(ThemeService).theme()).toBe('light');
  });

  it('toggle switches theme, sets data-theme and persists', () => {
    stubSystemDark(false);
    const service = TestBed.inject(ThemeService);
    service.toggle();
    expect(service.theme()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
    service.toggle();
    expect(service.theme()).toBe('light');
    expect(localStorage.getItem('theme')).toBe('light');
  });
});
```

- [ ] Run `npm test`. Expected: FAIL (cannot resolve `./theme.service`).

- [ ] Create `src/app/core/theme.service.ts`:

```ts
import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT, Injectable, PLATFORM_ID, inject, signal } from '@angular/core';

export type Theme = 'light' | 'dark';
const STORAGE_KEY = 'theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly theme = signal<Theme>(this.initialTheme());

  toggle(): void {
    this.set(this.theme() === 'dark' ? 'light' : 'dark');
  }

  set(theme: Theme): void {
    this.theme.set(theme);
    this.document.documentElement.setAttribute('data-theme', theme);
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Storage blocked (private mode): the choice lasts for this page view only.
    }
  }

  private initialTheme(): Theme {
    if (!this.isBrowser) return 'light';
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') return stored;
    } catch {
      // Ignore blocked storage.
    }
    return this.document.defaultView?.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
```

(If `DOCUMENT` is not exported from `@angular/core` in your version, import it from `@angular/common`.)

- [ ] Run `npm test`. Expected: PASS.

### Step 2: ThemeToggle (TDD)

- [ ] Write the failing test `src/app/shared/layout/theme-toggle/theme-toggle.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeToggle } from './theme-toggle';

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
  });

  it('labels the action and toggles the theme on click', async () => {
    const fixture = TestBed.createComponent(ThemeToggle);
    await fixture.whenStable();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(button.getAttribute('aria-label')).toBe('Switch to dark theme');

    button.click();
    await fixture.whenStable();
    expect(button.getAttribute('aria-label')).toBe('Switch to light theme');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
```

- [ ] Run `npm test`. Expected: FAIL.

- [ ] Create `src/app/shared/layout/theme-toggle/theme-toggle.ts`:

```ts
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ThemeService } from '../../../core/theme.service';

@Component({
  selector: 'app-theme-toggle',
  styleUrl: './theme-toggle.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" class="theme-toggle" (click)="theme.toggle()" [attr.aria-label]="label()" [attr.title]="label()">
      @if (theme.theme() === 'dark') {
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      } @else {
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      }
    </button>
  `,
})
export class ThemeToggle {
  protected readonly theme = inject(ThemeService);
  protected readonly label = computed(() => (this.theme.theme() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'));
}
```

- [ ] Create `theme-toggle.scss`:

```scss
.theme-toggle {
  display: inline-grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
  transition:
    transform var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out);

  &:hover {
    border-color: var(--color-accent);
    transform: rotate(-12deg);
  }
}
```

- [ ] Run `npm test`. Expected: PASS.

### Step 3: SiteHeader (TDD)

- [ ] Write the failing test `src/app/shared/layout/site-header/site-header.spec.ts`:

```ts
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SiteHeader } from './site-header';

@Component({ template: '' })
class Blank {}

describe('SiteHeader', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: '**', component: Blank }])],
    });
  });

  it('renders brand and nav links', async () => {
    const fixture = TestBed.createComponent(SiteHeader);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    const hrefs = [...el.querySelectorAll('nav a')].map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/about', '/projects', '/blog']);
    expect(el.querySelector('.site-header__brand')?.getAttribute('href')).toBe('/');
    expect(el.querySelector('app-theme-toggle')).not.toBeNull();
  });

  it('toggles the mobile menu and closes it on Escape', async () => {
    const fixture = TestBed.createComponent(SiteHeader);
    await fixture.whenStable();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.site-header__menu-btn');
    expect(button.getAttribute('aria-expanded')).toBe('false');

    button.click();
    await fixture.whenStable();
    expect(button.getAttribute('aria-expanded')).toBe('true');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('marks the active section with aria-current', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/blog/some-post');
    const fixture = TestBed.createComponent(SiteHeader);
    await fixture.whenStable();
    const blog = [...fixture.nativeElement.querySelectorAll('nav a')].find((a: Element) => a.textContent?.trim() === 'Blog');
    expect(blog?.getAttribute('aria-current')).toBe('page');
  });
});
```

- [ ] Run `npm test`. Expected: FAIL.

- [ ] Replace `src/app/shared/layout/site-header/site-header.ts`:

```ts
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeToggle } from '../theme-toggle/theme-toggle';

interface NavLink {
  label: string;
  path: string;
}

@Component({
  selector: 'app-site-header',
  imports: [RouterLink, RouterLinkActive, ThemeToggle],
  templateUrl: './site-header.html',
  styleUrl: './site-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'closeMenu()' },
})
export class SiteHeader {
  protected readonly links: NavLink[] = [
    { label: 'About', path: '/about' },
    { label: 'Projects', path: '/projects' },
    { label: 'Blog', path: '/blog' },
  ];
  protected readonly menuOpen = signal(false);

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }
}
```

- [ ] Replace `site-header.html`:

```html
<header class="site-header" [class.site-header--open]="menuOpen()">
  <div class="container site-header__inner">
    <a class="site-header__brand" routerLink="/" (click)="closeMenu()">
      <span class="site-header__logo" aria-hidden="true">MZ</span>
      <span class="site-header__name">Moris Maor Zakay</span>
    </a>

    <button
      type="button"
      class="site-header__menu-btn"
      aria-controls="site-nav"
      [attr.aria-expanded]="menuOpen()"
      (click)="toggleMenu()"
    >
      <span class="visually-hidden">Menu</span>
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        @if (menuOpen()) {
          <path d="M6 6l12 12M18 6L6 18" />
        } @else {
          <path d="M4 7h16M4 12h16M4 17h16" />
        }
      </svg>
    </button>

    <nav id="site-nav" class="site-header__nav" aria-label="Main">
      <ul class="site-header__links">
        @for (link of links; track link.path) {
          <li>
            <a [routerLink]="link.path" routerLinkActive="is-active" ariaCurrentWhenActive="page" (click)="closeMenu()">
              {{ link.label }}
            </a>
          </li>
        }
      </ul>
      <app-theme-toggle />
    </nav>
  </div>
</header>
```

- [ ] Replace `site-header.scss`:

```scss
.site-header {
  position: sticky;
  top: 0;
  z-index: 50;
  border-bottom: 1px solid var(--color-border);
  background: color-mix(in srgb, var(--color-bg) 80%, transparent);
  backdrop-filter: saturate(180%) blur(12px);
}

.site-header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: var(--header-height);
  gap: var(--space-4);
}

.site-header__brand {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  min-height: 44px;
  color: var(--color-text);
  font-weight: 700;
  text-decoration: none;
}

.site-header__logo {
  display: inline-grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: var(--gradient-accent);
  color: #fff;
  font-size: 0.875rem;
  letter-spacing: 0.02em;
}

.site-header__nav {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.site-header__links {
  display: flex;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;

  a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding-inline: var(--space-3);
    border-radius: var(--radius-full);
    color: var(--color-muted);
    font-weight: 500;
    text-decoration: none;
    transition: color var(--duration-fast) var(--ease-out), background-color var(--duration-fast) var(--ease-out);

    &:hover {
      color: var(--color-text);
    }

    &.is-active {
      color: var(--color-text);
      background: var(--color-surface-2);
    }
  }
}

.site-header__menu-btn {
  display: none;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
}

@media (max-width: 767px) {
  .site-header__menu-btn {
    display: inline-grid;
  }

  .site-header__nav {
    position: absolute;
    inset: var(--header-height) 0 auto 0;
    display: none;
    flex-direction: column;
    align-items: stretch;
    padding: var(--space-4);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-bg);
    box-shadow: var(--shadow-md);
  }

  .site-header--open .site-header__nav {
    display: flex;
  }

  .site-header__links {
    flex-direction: column;
  }
}
```

- [ ] Run `npm test`. Expected: PASS.

### Step 4: SiteFooter (TDD)

- [ ] Write the failing test `src/app/shared/layout/site-footer/site-footer.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { SITE } from '../../../core/site.config';
import { SiteFooter } from './site-footer';

describe('SiteFooter', () => {
  it('renders social links with accessible labels', async () => {
    const fixture = TestBed.createComponent(SiteFooter);
    await fixture.whenStable();
    const links: HTMLAnchorElement[] = [...fixture.nativeElement.querySelectorAll('.site-footer__social a')];
    expect(links.map((a) => [a.getAttribute('aria-label'), a.getAttribute('href')])).toEqual([
      ['GitHub', SITE.social.github],
      ['LinkedIn', SITE.social.linkedin],
      ['Email', SITE.social.email],
      ['RSS feed', '/rss.xml'],
    ]);
    expect(links[0].getAttribute('rel')).toBe('noopener noreferrer');
    expect(links[2].getAttribute('target')).toBeNull();
  });

  it('shows the current year', async () => {
    const fixture = TestBed.createComponent(SiteFooter);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain(String(new Date().getFullYear()));
  });
});
```

- [ ] Run `npm test`. Expected: FAIL.

- [ ] Replace `src/app/shared/layout/site-footer/site-footer.ts`:

```ts
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SITE } from '../../../core/site.config';

interface SocialLink {
  label: string;
  href: string;
  icon: 'github' | 'linkedin' | 'email' | 'rss';
  external: boolean;
}

@Component({
  selector: 'app-site-footer',
  templateUrl: './site-footer.html',
  styleUrl: './site-footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteFooter {
  protected readonly year = new Date().getFullYear();
  protected readonly author = SITE.author;
  protected readonly social: SocialLink[] = [
    { label: 'GitHub', href: SITE.social.github, icon: 'github', external: true },
    { label: 'LinkedIn', href: SITE.social.linkedin, icon: 'linkedin', external: true },
    { label: 'Email', href: SITE.social.email, icon: 'email', external: false },
    { label: 'RSS feed', href: '/rss.xml', icon: 'rss', external: false },
  ];
}
```

- [ ] Replace `site-footer.html`:

```html
<footer class="site-footer">
  <div class="container site-footer__inner">
    <p class="site-footer__copy">© {{ year }} {{ author }}</p>
    <ul class="site-footer__social">
      @for (link of social; track link.label) {
        <li>
          <a
            [href]="link.href"
            [attr.aria-label]="link.label"
            [attr.target]="link.external ? '_blank' : null"
            [attr.rel]="link.external ? 'noopener noreferrer' : null"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor">
              @switch (link.icon) {
                @case ('github') {
                  <path d="M12 .5a11.5 11.5 0 0 0-3.6 22.4c.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0c2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.9 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A11.5 11.5 0 0 0 12 .5z" />
                }
                @case ('linkedin') {
                  <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.5h4V21H3zM9.5 9.5h3.8v1.6h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5.2c0-1.2 0-2.8-1.7-2.8s-2 1.3-2 2.7V21h-4z" />
                }
                @case ('email') {
                  <path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm9 7.2L4 7.3V17h16V7.3l-8 4.9zM5.2 7l6.8 4.2L18.8 7H5.2z" />
                }
                @case ('rss') {
                  <path d="M5 3a16 16 0 0 1 16 16h-3A13 13 0 0 0 5 6zm0 6a10 10 0 0 1 10 10h-3a7 7 0 0 0-7-7zm1.5 7a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z" />
                }
              }
            </svg>
          </a>
        </li>
      }
    </ul>
  </div>
</footer>
```

- [ ] Replace `site-footer.scss`:

```scss
.site-footer {
  margin-top: var(--space-8);
  border-top: 1px solid var(--color-border);
}

.site-footer__inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding-block: var(--space-6);
}

.site-footer__copy {
  margin: 0;
  color: var(--color-muted);
  font-size: 0.875rem;
}

.site-footer__social {
  display: flex;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;

  a {
    display: inline-grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border-radius: var(--radius-full);
    color: var(--color-muted);
    transition: color var(--duration-fast) var(--ease-out), transform var(--duration-fast) var(--ease-out);

    &:hover {
      color: var(--color-accent);
      transform: translateY(-2px);
    }
  }
}
```

- [ ] Run `npm test`. Expected: PASS.

### Step 5: No-flash theme script

- [ ] In `src/index.html`, add inside `<head>` right after the `color-scheme` meta:

```html
    <script>
      (function () {
        try {
          var t = localStorage.getItem('theme');
          if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
        } catch (e) {}
      })();
    </script>
```

### Step 6: Verify and commit

- [ ] Run `npm test` and `npm run build`. Expected: PASS, build succeeds.
- [ ] Manual check with `npm start`: toggle theme, reload → theme persists with no flash; at 375px width the menu button opens/closes the nav; Tab reaches every link with a visible focus ring.
- [ ] Commit:

```bash
git add src/app/core/theme.service.ts src/app/core/theme.service.spec.ts src/app/shared/layout src/index.html
git commit -m "feat(shell): header with mobile menu, footer, persistent theme toggle"
```
