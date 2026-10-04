# Task 13: Integration QA — e2e, accessibility, Lighthouse

> Read first: `docs/plan/README.md` (Global Constraints), `docs/plan/contracts.md`, `docs/plan/spec.md` (§8 quality bars).

**Goal:** Prove the merged site works end to end: Playwright e2e for the main flows (desktop + mobile), an axe scan of every page, Lighthouse scores against the quality bars, and fixes for anything that fails. Add e2e to CI.

**Wave:** 2 (runs alone, after every Wave 1 branch is merged into `main`).

**Files:**
- Create: `e2e/navigation.spec.ts`, `e2e/theme.spec.ts`, `e2e/blog.spec.ts`, `e2e/assets.spec.ts`, `e2e/a11y.spec.ts`
- Create: `docs/qa-report.md`
- Modify: `.github/workflows/ci.yml` (add an e2e job)
- May modify any file to fix defects found (this task runs alone). Keep each fix minimal and add or adjust the unit test that should have caught it.

**Interfaces:**
- Consumes: the whole app. `playwright.config.ts` (Task 00) serves `dist/moris-site/browser` on port 4300 with `http-server`, projects `desktop` and `mobile`.
- Produces: green e2e suite, `docs/qa-report.md`.

Build with drafts so the sample posts exist: `INCLUDE_DRAFTS=1 npm run build`.

---

### Step 1: Prepare

- [ ] Run:

```bash
git checkout main && git pull --ff-only || true
npm ci
npx playwright install --with-deps chromium
INCLUDE_DRAFTS=1 npm run build
```

Expected: build ends with `[postbuild] 404.html created, output verified`.

### Step 2: Navigation and layout e2e

- [ ] Create `e2e/navigation.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('home renders the hero', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Moris Maor Zakay');
  await expect(page).toHaveTitle('Moris Maor Zakay');
});

test('main nav reaches every section', async ({ page, isMobile }) => {
  await page.goto('/');
  for (const [label, path, title] of [
    ['About', '/about', 'About · Moris Maor Zakay'],
    ['Projects', '/projects', 'Projects · Moris Maor Zakay'],
    ['Blog', '/blog', 'Blog · Moris Maor Zakay'],
  ] as const) {
    if (isMobile) await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: label }).click();
    await expect(page).toHaveURL(path);
    await expect(page).toHaveTitle(title);
    await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: label })).toHaveAttribute('aria-current', 'page');
  }
});

test('unknown URLs show the 404 page', async ({ page }) => {
  const res = await page.goto('/does-not-exist');
  expect(res?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
});

test('skip link moves focus to main content', async ({ page, isMobile }) => {
  test.skip(isMobile, 'keyboard flow is desktop-only');
  await page.goto('/about');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main#main')).toBeFocused();
  await expect(page).toHaveURL('/about');
});

test('no horizontal scroll at 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  for (const path of ['/', '/about', '/projects', '/blog', '/blog/angular-signals-in-practice']) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});
```

### Step 3: Theme e2e

- [ ] Create `e2e/theme.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('theme toggle switches and persists across reloads', async ({ page, isMobile }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  if (isMobile) await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bg).toBe('rgb(11, 15, 25)');
});

test('follows the OS preference when nothing is stored', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bg).toBe('rgb(11, 15, 25)');
});
```

### Step 4: Blog e2e

- [ ] Create `e2e/blog.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('blog lists posts and filters by tag', async ({ page }) => {
  await page.goto('/blog');
  await expect(page.locator('app-post-card')).toHaveCount(3);
  await page.getByRole('navigation', { name: 'Filter by tag' }).getByRole('link', { name: /#angular/ }).click();
  await expect(page).toHaveURL('/blog/tags/angular');
  await expect(page.locator('app-post-card')).toHaveCount(1);
  await expect(page).toHaveTitle('#angular · Moris Maor Zakay');
});

test('post page renders content, code and a working toc', async ({ page, isMobile }) => {
  await page.goto('/blog');
  await page.getByRole('link', { name: 'Angular Signals in practice' }).click();
  await expect(page).toHaveURL('/blog/angular-signals-in-practice');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Angular Signals in practice');
  await expect(page.locator('.prose pre.shiki')).toBeVisible();

  if (isMobile) await page.getByText('On this page').click();
  await page.locator(isMobile ? '.toc--mobile' : '.toc--desktop').getByRole('link', { name: 'Takeaways' }).click();
  await expect(page).toHaveURL(/#takeaways$/);
  await expect(page.locator('#takeaways')).toBeInViewport();
});

test('post pages are prerendered (content present without JS)', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/blog/angular-signals-in-practice');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Angular Signals in practice');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/og\/angular-signals-in-practice\.png$/);
  await context.close();
});

test('missing post shows the 404 page', async ({ page }) => {
  await page.goto('/blog/nope');
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
});
```

### Step 5: Static assets e2e

- [ ] Create `e2e/assets.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('CV PDF is downloadable', async ({ request }) => {
  const res = await request.get('/cv.pdf');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('application/pdf');
});

test('RSS feed lists posts', async ({ request }) => {
  const res = await request.get('/rss.xml');
  expect(res.status()).toBe(200);
  const xml = await res.text();
  expect(xml).toContain('<rss version="2.0"');
  expect(xml).toContain('/blog/angular-signals-in-practice</link>');
});

test('sitemap lists pages', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text();
  for (const path of ['/about', '/projects', '/blog', '/blog/angular-signals-in-practice']) expect(xml).toContain(path);
});

test('OG images exist', async ({ request }) => {
  for (const path of ['/og/default.png', '/og/angular-signals-in-practice.png']) {
    const res = await request.get(path);
    expect(res.status(), path).toBe(200);
    expect(res.headers()['content-type']).toContain('image/png');
  }
});
```

### Step 6: Accessibility scan

- [ ] Create `e2e/a11y.spec.ts`:

```ts
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const PAGES = ['/', '/about', '/projects', '/blog', '/blog/tags/angular', '/blog/angular-signals-in-practice', '/404'];

for (const theme of ['light', 'dark'] as const) {
  for (const path of PAGES) {
    test(`${path} has no serious a11y violations (${theme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      await page.goto(path);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
    });
  }
}
```

### Step 7: Run, fix, re-run

- [ ] Run:

```bash
npm run e2e
```

- [ ] For each failure: find the root cause, fix it in the owning file, add/adjust the unit test that should have caught it, rebuild (`INCLUDE_DRAFTS=1 npm run build`), re-run. Repeat until green on both `desktop` and `mobile` projects. Do not weaken assertions to make tests pass; if an assertion is wrong (e.g. a selector), fix the test and say why in the report.

### Step 8: Lighthouse

- [ ] Serve the build and audit home and a post (desktop preset):

```bash
npx http-server dist/moris-site/browser -p 4300 -s &
SERVER=$!
export CHROME_PATH="$(node -e "console.log(require('@playwright/test').chromium.executablePath())")"
for path in / /blog/angular-signals-in-practice; do
  npx --yes lighthouse "http://localhost:4300$path" --preset=desktop --quiet --chrome-flags="--headless=new" \
    --only-categories=performance,accessibility,best-practices,seo --output=json --output-path="./lh-$(echo $path | tr '/' '_').json"
done
kill $SERVER
node -e "for (const f of require('fs').readdirSync('.').filter(f=>f.startsWith('lh-'))) { const r=require('./'+f); console.log(f, Object.fromEntries(Object.entries(r.categories).map(([k,v])=>[k,Math.round(v.score*100)]))) }"
```

Expected: performance ≥ 95, accessibility ≥ 95, best-practices ≥ 95, seo = 100 for both. Fix regressions the same way as Step 7. Delete the `lh-*.json` files afterwards (do not commit them).

### Step 9: Add e2e to CI

- [ ] In `.github/workflows/ci.yml`, add a second job:

```yaml
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm

      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run build
        env:
          INCLUDE_DRAFTS: '1'
      - run: npm run e2e
        env:
          CI: 'true'
```

### Step 10: Report and commit

- [ ] Create `docs/qa-report.md` with: date, commit SHA, e2e result summary (passed/total per project), axe result, Lighthouse scores table (page × category), list of defects found and the fix for each (file + one line), and any known issues left open.
- [ ] Final check: `npm test`, `npm run test:scripts`, `npm run build`, `INCLUDE_DRAFTS=1 npm run build && npm run e2e` all green.
- [ ] Commit:

```bash
git add e2e docs/qa-report.md .github/workflows/ci.yml
git add -u
git commit -m "test(e2e): end-to-end, accessibility and lighthouse QA"
```
