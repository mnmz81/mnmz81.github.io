// Generates public/og/<slug>.png for every post plus public/og/default.png.
// Usage: npm run og   (run after `npm run content`)
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ContentIndex } from '../src/app/core/content.models';
import { CV } from '../src/app/core/cv.data';
import { SITE } from '../src/app/core/site.config';
import { renderOgPng } from './og/render';

const OUT = join('public', 'og');

async function main(): Promise<void> {
  const index: ContentIndex = JSON.parse(readFileSync(join('public', 'content', 'index.json'), 'utf8'));
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });

  writeFileSync(join(OUT, 'default.png'), await renderOgPng({ title: SITE.title, eyebrow: CV.headline, tags: [] }));
  for (const post of index.posts) {
    writeFileSync(join(OUT, `${post.slug}.png`), await renderOgPng({ title: post.title, eyebrow: 'Blog', tags: post.tags }));
  }
  console.log(`[og] generated ${index.posts.length + 1} images`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
