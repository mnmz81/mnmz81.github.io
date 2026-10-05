import { describe, expect, it } from 'vitest';
import type { ContentIndex } from '../../src/app/core/content.models';
import { buildRss, buildSitemap, sitePaths } from './feeds';

const site = { url: 'https://example.dev', title: 'Me & Co', description: 'Desc' };
const index: ContentIndex = {
  generatedAt: '2026-10-04T00:00:00.000Z',
  posts: [{ slug: 'a-post', title: 'A <b> & c', summary: 'Sum', date: '2026-09-20', tags: ['ai'], readingMinutes: 2 }],
  tags: [{ tag: 'ai', count: 1 }],
};

describe('buildRss', () => {
  it('produces an RSS 2.0 feed with escaped items', () => {
    const xml = buildRss(index.posts, site);
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<title>Me &amp; Co</title>');
    expect(xml).toContain('<title>A &lt;b&gt; &amp; c</title>');
    expect(xml).toContain('<link>https://example.dev/blog/a-post/</link>');
    expect(xml).toContain('<guid isPermaLink="true">https://example.dev/blog/a-post/</guid>');
    expect(xml).toContain('<pubDate>Sun, 20 Sep 2026 00:00:00 GMT</pubDate>');
    expect(xml).toContain('<category>ai</category>');
  });
});

describe('sitePaths', () => {
  it('lists static pages, posts and tags', () => {
    expect(sitePaths(index)).toEqual(['/', '/about', '/projects', '/blog', '/blog/a-post', '/blog/tags/ai']);
  });
});

describe('buildSitemap', () => {
  it('produces absolute URLs', () => {
    const xml = buildSitemap(['/', '/blog/a-post'], site.url);
    expect(xml).toContain('<loc>https://example.dev/</loc>');
    expect(xml).toContain('<loc>https://example.dev/blog/a-post/</loc>');
    expect(xml).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
  });
});
