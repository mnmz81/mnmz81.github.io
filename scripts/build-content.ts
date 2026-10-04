// Builds public/content/**, public/rss.xml and public/sitemap.xml from content/**/*.md.
// Usage: npm run content            (published only)
//        INCLUDE_DRAFTS=1 npm run content
import { writeFileSync } from 'node:fs';
import { SITE } from '../src/app/core/site.config';
import { buildContent } from './content/collect';
import { buildRss, buildSitemap, sitePaths } from './content/feeds';

async function main(): Promise<void> {
  const includeDrafts = process.env['INCLUDE_DRAFTS'] === '1';
  const { index, projects } = await buildContent({ contentDir: 'content', outDir: 'public/content', includeDrafts });
  writeFileSync('public/rss.xml', buildRss(index.posts, SITE));
  writeFileSync('public/sitemap.xml', buildSitemap(sitePaths(index), SITE.url));
  console.log(
    `[content] ${index.posts.length} posts, ${index.tags.length} tags, ${projects.length} projects${includeDrafts ? ' (drafts included)' : ''}`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
