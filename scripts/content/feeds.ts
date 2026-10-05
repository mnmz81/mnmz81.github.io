import { pageUrl } from '../../src/app/core/site.config';
import type { ContentIndex, PostMeta } from '../../src/app/core/content.models';

export interface FeedSite {
  url: string;
  title: string;
  description: string;
}

const escapeXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

const rfc822 = (date: string) => new Date(`${date}T00:00:00Z`).toUTCString();

export function buildRss(posts: PostMeta[], site: FeedSite): string {
  const items = posts
    .map((post) => {
      const link = pageUrl(`/blog/${post.slug}`, site.url);
      const categories = post.tags.map((t) => `      <category>${escapeXml(t)}</category>`).join('\n');
      return [
        '    <item>',
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${link}</link>`,
        `      <guid isPermaLink="true">${link}</guid>`,
        `      <pubDate>${rfc822(post.date)}</pubDate>`,
        `      <description>${escapeXml(post.summary)}</description>`,
        categories,
        '    </item>',
      ].join('\n');
    })
    .join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${escapeXml(site.title)}</title>`,
    `    <link>${site.url}</link>`,
    `    <description>${escapeXml(site.description)}</description>`,
    '    <language>en</language>',
    `    <atom:link href="${site.url}/rss.xml" rel="self" type="application/rss+xml"/>`,
    items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');
}

export function sitePaths(index: ContentIndex): string[] {
  return [
    '/',
    '/about',
    '/projects',
    '/blog',
    ...index.posts.map((p) => `/blog/${p.slug}`),
    ...index.tags.map((t) => `/blog/tags/${t.tag}`),
  ];
}

export function buildSitemap(paths: string[], siteUrl: string): string {
  const urls = paths.map((p) => `  <url><loc>${escapeXml(pageUrl(p, siteUrl))}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
