# QA report — integration (Task 13)

- **Date:** 2026-10-05
- **Commit tested:** `d249e0f` on `feat/site` (all 12 feature tasks plus the QA fixes below; this report lands in the commit after it)
- **Toolchain:** Node 24.16, Angular 22.2.1, Playwright 1.63 (Chromium), @axe-core/playwright 4.13, Lighthouse 13.5.0
- **Build under test:** `INCLUDE_DRAFTS=1 npm run build`, served by `http-server -s -c-1` on port 4300 (`playwright.config.ts`)

## End-to-end (Playwright)

| Project | Passed | Skipped | Failed | Total |
| --- | --- | --- | --- | --- |
| desktop (Desktop Chrome) | 29 | 0 | 0 | 29 |
| mobile (Pixel 7) | 28 | 1 | 0 | 29 |

The one skip is intended: `skip link moves focus to main content` is desktop-only (keyboard flow).
Stability: `CI=true npx playwright test --repeat-each=3 --retries=0` gave 171 passed, 3 skipped, 0 failed.

Specs: `e2e/navigation.spec.ts`, `e2e/theme.spec.ts`, `e2e/blog.spec.ts`, `e2e/assets.spec.ts`, `e2e/a11y.spec.ts`.

## Accessibility (axe)

Pages `/`, `/about`, `/projects`, `/blog`, `/blog/tags/angular`, `/blog/angular-signals-in-practice` and `/404`, in light and dark themes, on desktop and mobile, with tags `wcag2a`, `wcag2aa` and `wcag21aa` (28 scans in all).

- **Final:** 0 violations of any impact. The test fails only on serious or critical ones; a separate check found no minor or moderate ones either.
- **First run:** serious `color-contrast` failures on `/` and `/blog` in both themes. Both are fixed (see Defects).

## Lighthouse (desktop preset, local http-server)

| Page | Performance | Accessibility | Best practices | SEO |
| --- | --- | --- | --- | --- |
| `/` | 98 | 100 | 100 | 100 |
| `/blog/angular-signals-in-practice` | 99 | 100 | 100 | 100 |

Targets: performance at least 95, accessibility at least 95, best practices at least 95, SEO exactly 100. All four are met on both pages.
Metrics for `/`: FCP 0.7 s, LCP 0.7 s, TBT 0 ms, CLS 0. For the post: FCP 0.8 s, LCP 0.8 s, TBT 0 ms, CLS 0.029.

## Defects found and fixed

| # | Defect | Fix |
| --- | --- | --- |
| 1 | Dark mode flashed light, then faded to dark. Beasties critical-CSS inlining evaluates selectors against the prerendered HTML, which has no `data-theme`. It dropped the dark token rules from the inlined CSS and deferred the full stylesheet, so `body` animated from light to dark. Caught by `e2e/theme.spec.ts` (both tests, both projects). | `angular.json`: production `optimization.styles.inlineCritical: false`, so the 11 kB stylesheet is render-blocking. Guarded by `scripts/angular-config.test.ts`. |
| 2 | Hero eyebrow and social links fell below AA contrast over the blurred blobs: 4.18:1 light, 4.2:1 and 3.33:1 dark. | `src/app/pages/home/home-page.scss`: `.hero` sets a stronger local `--color-muted` (85% text mixed with background). |
| 3 | Tag filter counts fell below AA contrast because of `opacity: .7`: 3.59:1 light, 4.05:1 dark. | `src/app/pages/blog-list/blog-list-page.scss`: removed the opacity, so counts use the chip's muted colour. |

Defects 2 and 3 are CSS contrast issues. jsdom does not compute layout or colour, so no unit test can catch them; `e2e/a11y.spec.ts` is their regression test.

### Test corrections (brief code that did not match the real markup)

- `e2e/navigation.spec.ts` (main nav, mobile): following a link closes the mobile menu by design, which removes the nav links from the accessibility tree. The test now checks that the menu closed (`aria-expanded="false"`), reopens it to assert `aria-current="page"`, then closes it again. The assertion is the same; this also adds a check.
- `e2e/blog.spec.ts` (TOC, mobile): `getByText('On this page')` also matched the desktop TOC title, which is in the DOM but hidden on mobile, so Playwright raised a strict-mode violation. The click is now scoped to `.toc--mobile`.
- `/does-not-exist` returning 404: `http-server -s` really does return status 404 with `404.html`, so the brief's `status()` assertion stands unchanged.

## CI

`.github/workflows/ci.yml` has a new `e2e` job: `npm ci`, install Playwright Chromium with system deps, `INCLUDE_DRAFTS=1 npm run build`, then `npm run e2e` with `CI=true`.

## Known issues left open (none fail a check)

- The theme toggle's icon and label are prerendered for the light theme, so dark-mode visitors briefly see the wrong icon until hydration. The page colours are correct (fixed above).
- Lighthouse reports a 160 ms redirect for `/blog/<slug>` → `/blog/<slug>/` (directory index; GitHub Pages does the same). This affects direct loads only; in-app navigation is client-side.
- Lighthouse "render-blocking" estimates 40 ms on `/` and 160 ms on the post. This is the deliberate trade-off from fix 1.
- Lighthouse flags 104–111 KiB of unused JavaScript and bf-cache ineligibility. These are informational and do not affect the scores.
- Deferred minor items from earlier tasks still stand: the mobile TOC summary has no disclosure marker, Escape does not return focus to the menu button, and `/404` has no `noindex`.
