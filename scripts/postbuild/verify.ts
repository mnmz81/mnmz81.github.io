import { copyFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SITE } from '../../src/app/core/site.config';

const CORE_FILES = [
  'index.html',
  'about/index.html',
  'projects/index.html',
  '404.html',
  'sitemap.xml',
  'content/index.json',
  'content/projects.json',
];

export function requiredFiles(blog: boolean): string[] {
  return blog ? [...CORE_FILES, 'blog/index.html', 'rss.xml'] : CORE_FILES;
}

/** Creates 404.html for GitHub Pages and returns the list of expected files that are missing. */
export function finalizeDist(distDir: string, blog: boolean = SITE.features.blog): string[] {
  const notFound = join(distDir, '404', 'index.html');
  if (existsSync(notFound)) copyFileSync(notFound, join(distDir, '404.html'));

  const missing = requiredFiles(blog).filter((file) => !existsSync(join(distDir, file)));

  const indexFile = join(distDir, 'content', 'index.json');
  if (blog && existsSync(indexFile)) {
    const { posts } = JSON.parse(readFileSync(indexFile, 'utf8')) as { posts: { slug: string }[] };
    for (const { slug } of posts) {
      const page = `blog/${slug}/index.html`;
      if (!existsSync(join(distDir, page))) missing.push(page);
    }
  }
  return missing;
}
