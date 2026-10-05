import { expect, test } from '@playwright/test';
import { SITE } from '../src/app/core/site.config';

const BLOG = SITE.features.blog;

test('RSS feed lists posts', async ({ request }) => {
  test.skip(!BLOG, 'blog is hidden');
  const res = await request.get('/rss.xml');
  expect(res.status()).toBe(200);
  const xml = await res.text();
  expect(xml).toContain('<rss version="2.0"');
  expect(xml).toContain('/blog/angular-signals-in-practice/</link>');
});

test('sitemap lists pages', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text();
  for (const path of ['/about', '/projects']) expect(xml).toContain(path);
  if (BLOG) for (const path of ['/blog', '/blog/angular-signals-in-practice']) expect(xml).toContain(path);
  else expect(xml).not.toContain('/blog');
});

test('OG images exist', async ({ request }) => {
  for (const path of ['/og/default.png', ...(BLOG ? ['/og/angular-signals-in-practice.png'] : [])]) {
    const res = await request.get(path);
    expect(res.status(), path).toBe(200);
    expect(res.headers()['content-type']).toContain('image/png');
  }
});
