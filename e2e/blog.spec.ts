import { expect, test } from '@playwright/test';
import { SITE } from '../src/app/core/site.config';

test.skip(!SITE.features.blog, 'blog is hidden (SITE.features.blog = false)');

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

  // The desktop TOC (hidden on mobile) also has an "On this page" title, so scope to the mobile disclosure.
  if (isMobile) await page.locator('.toc--mobile').getByText('On this page').click();
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
