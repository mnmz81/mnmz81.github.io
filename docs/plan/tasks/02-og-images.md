# Task 02: Open Graph images

> Read first: `docs/plan/README.md` (Global Constraints), `docs/plan/contracts.md`, `docs/plan/spec.md`.

**Goal:** Generate a branded 1200×630 PNG share image for every post (`public/og/<slug>.png`) and a default one (`public/og/default.png`), so links shared on LinkedIn/X look professional.

**Wave:** 1 (parallel).

**Files:**
- Modify (replace): `scripts/build-og.ts`
- Create: `scripts/og/render.ts`
- Test: `scripts/og/render.test.ts`

**Interfaces:**
- Consumes: `public/content/index.json` (`ContentIndex`, contracts §3) — exists after `npm run content` (Task 00 placeholder copies fixtures, Task 01 generates real data). `SITE` and `CV` from `src/app/core`.
- Produces: `public/og/<slug>.png` for each post in the index, `public/og/default.png`. SEO (Task 09) and the post page (Task 08) reference these paths.

Notes:
- Satori renders a plain-object element tree (no React needed). Every `div` with more than one child needs `display: 'flex'`.
- Satori needs TTF/OTF/WOFF fonts (not WOFF2): use `@fontsource/inter/files/inter-latin-{400,700}-normal.woff` from `node_modules` (installed by Task 00).
- Scripts run under `tsx` (CommonJS): no top-level `await`.

---

### Step 1: Renderer (TDD)

- [ ] Write the failing test `scripts/og/render.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { renderOgPng } from './render';

function pngSize(buf: Buffer): { width: number; height: number } {
  // PNG IHDR: width at byte 16, height at byte 20 (big-endian).
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

describe('renderOgPng', () => {
  it('renders a 1200x630 PNG', async () => {
    const png = await renderOgPng({ title: 'Angular Signals in practice', eyebrow: 'Blog', tags: ['angular', 'frontend'] });
    expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    expect(pngSize(png)).toEqual({ width: 1200, height: 630 });
  });

  it('handles long titles and no tags', async () => {
    const png = await renderOgPng({ title: 'A very long title '.repeat(10), eyebrow: 'Blog', tags: [] });
    expect(pngSize(png)).toEqual({ width: 1200, height: 630 });
  });
});
```

- [ ] Run `npm run test:scripts -- scripts/og`. Expected: FAIL (cannot find `./render`).

- [ ] Create `scripts/og/render.ts`:

```ts
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import { SITE } from '../../src/app/core/site.config';

export interface OgInput {
  title: string;
  eyebrow: string;   // small label above the title, e.g. 'Blog' or the site headline
  tags: string[];
}

const WIDTH = 1200;
const HEIGHT = 630;
const MAX_TITLE = 90;

const fontFile = (weight: 400 | 700) =>
  readFileSync(join(process.cwd(), 'node_modules', '@fontsource', 'inter', 'files', `inter-latin-${weight}-normal.woff`));

let fonts: { name: string; data: Buffer; weight: 400 | 700; style: 'normal' }[] | undefined;
function loadFonts() {
  fonts ??= [
    { name: 'Inter', data: fontFile(400), weight: 400, style: 'normal' },
    { name: 'Inter', data: fontFile(700), weight: 700, style: 'normal' },
  ];
  return fonts;
}

type Node = { type: string; props: Record<string, unknown> & { children?: unknown } };
const el = (type: string, style: Record<string, unknown>, children?: unknown): Node => ({ type, props: { style, children } });

function template({ title, eyebrow, tags }: OgInput): Node {
  const shortTitle = title.length > MAX_TITLE ? `${title.slice(0, MAX_TITLE - 1).trimEnd()}…` : title;
  return el(
    'div',
    {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '72px',
      background: 'linear-gradient(135deg, #0b0f19 0%, #1e1b4b 55%, #083344 100%)',
      color: '#e5e7eb',
      fontFamily: 'Inter',
    },
    [
      el('div', { display: 'flex', fontSize: 28, color: '#22d3ee', fontWeight: 700, letterSpacing: 2 }, eyebrow.toUpperCase()),
      el('div', { display: 'flex', fontSize: 68, fontWeight: 700, lineHeight: 1.15, color: '#ffffff' }, shortTitle),
      el('div', { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 28 }, [
        el('div', { display: 'flex', gap: '16px', color: '#a5b4fc' }, tags.slice(0, 4).map((t) => el('div', { display: 'flex' }, `#${t}`))),
        el('div', { display: 'flex', fontWeight: 700 }, SITE.author),
      ]),
    ],
  );
}

export async function renderOgPng(input: OgInput): Promise<Buffer> {
  const svg = await satori(template(input) as unknown as Parameters<typeof satori>[0], {
    width: WIDTH,
    height: HEIGHT,
    fonts: loadFonts(),
  });
  return new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } }).render().asPng();
}
```

- [ ] Run `npm run test:scripts -- scripts/og`. Expected: PASS.

### Step 2: CLI entry point

- [ ] Replace `scripts/build-og.ts`:

```ts
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
```

### Step 3: Verify and commit

- [ ] Run:

```bash
npm run test:scripts
npm run content && npm run og
ls public/og
```

Expected: tests PASS; `[og] generated N images`; `default.png` plus one PNG per post in `public/content/index.json`. Open `public/og/default.png` and one post image to check them visually (text readable, nothing clipped).

- [ ] Run `npm run build`. Expected: success.

- [ ] Commit:

```bash
git add scripts/build-og.ts scripts/og
git commit -m "feat(og): generate open graph images per post"
```
