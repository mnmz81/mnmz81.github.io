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
    // On mobile the menu closes after navigating (and its links leave the a11y tree), so reopen it to check the active link.
    if (isMobile) {
      await expect(page.getByRole('button', { name: 'Menu' })).toHaveAttribute('aria-expanded', 'false');
      await page.getByRole('button', { name: 'Menu' }).click();
    }
    await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: label })).toHaveAttribute('aria-current', 'page');
    if (isMobile) await page.getByRole('button', { name: 'Menu' }).click();
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
