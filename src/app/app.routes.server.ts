import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RenderMode, ServerRoute } from '@angular/ssr';
import type { ContentIndex } from './core/content.models';

function readIndex(): ContentIndex {
  return JSON.parse(readFileSync(join(process.cwd(), 'public', 'content', 'index.json'), 'utf8'));
}

export const serverRoutes: ServerRoute[] = [
  {
    path: 'blog/tags/:tag',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return readIndex().tags.map(({ tag }) => ({ tag }));
    },
  },
  {
    path: 'blog/:slug',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return readIndex().posts.map(({ slug }) => ({ slug }));
    },
  },
  { path: '**', renderMode: RenderMode.Prerender },
];
