import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { SITE } from '../src/app/core/site.config';

const BLOG_PAGES = ['/blog', '/blog/tags/angular', '/blog/angular-signals-in-practice'];
const PAGES = ['/', '/about', '/projects', ...(SITE.features.blog ? BLOG_PAGES : []), '/404'];

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
