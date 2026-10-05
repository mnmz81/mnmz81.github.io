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
  expect(xml).toContain('/blog/angular-signals-in-practice/</link>');
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
