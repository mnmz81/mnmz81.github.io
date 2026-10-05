import { copyFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const REQUIRED_FILES = [
  'index.html',
  'about/index.html',
  'projects/index.html',
  'blog/index.html',
  '404.html',
  'rss.xml',
  'sitemap.xml',
  'cv.pdf',
  'content/index.json',
  'content/projects.json',
];

/** Creates 404.html for GitHub Pages and returns the list of expected files that are missing. */
export function finalizeDist(distDir: string): string[] {
  const notFound = join(distDir, '404', 'index.html');
  if (existsSync(notFound)) copyFileSync(notFound, join(distDir, '404.html'));

  const missing = REQUIRED_FILES.filter((file) => !existsSync(join(distDir, file)));

  const indexFile = join(distDir, 'content', 'index.json');
  if (existsSync(indexFile)) {
    const { posts } = JSON.parse(readFileSync(indexFile, 'utf8')) as { posts: { slug: string }[] };
    for (const { slug } of posts) {
      const page = `blog/${slug}/index.html`;
      if (!existsSync(join(distDir, page))) missing.push(page);
    }
  }
  return missing;
}
