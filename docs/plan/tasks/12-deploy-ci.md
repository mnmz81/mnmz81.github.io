# Task 12: Deploy & CI (GitHub Pages)

> Read first: `docs/plan/README.md` (Global Constraints), `docs/plan/contracts.md`, `docs/plan/spec.md` (§7).

**Goal:** Ship the site automatically: a postbuild step that creates `404.html` and verifies the static output, a CI workflow for pull requests, a deploy workflow that publishes `main` to GitHub Pages, and a short deploy guide (repo setup + custom domain).

**Wave:** 1 (parallel).

**Files:**
- Modify (replace placeholder): `scripts/postbuild.ts`
- Create: `scripts/postbuild/verify.ts`
- Test: `scripts/postbuild/verify.test.ts`
- Create: `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`, `docs/deploy.md`

**Interfaces:**
- Consumes: build output `dist/moris-site/browser/` (contracts §1); `npm run build` already runs `postbuild` automatically (npm `post` hook, contracts §2); prerendered `404/index.html` (Task 00 route); `content/index.json` copied from `public/`.
- Produces: `dist/moris-site/browser/404.html`; a failing build when expected pages are missing.

---

### Step 1: Verify step (TDD)

- [ ] Create `scripts/postbuild/verify.test.ts`:

```ts
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { REQUIRED_FILES, finalizeDist } from './verify';

function makeDist(files: string[], posts: string[] = []): string {
  const dist = mkdtempSync(join(tmpdir(), 'dist-'));
  for (const file of files) {
    mkdirSync(dirname(join(dist, file)), { recursive: true });
    writeFileSync(join(dist, file), file === 'content/index.json' ? JSON.stringify({ posts: posts.map((slug) => ({ slug })) }) : 'x');
  }
  return dist;
}

const complete = [...REQUIRED_FILES.filter((f) => f !== '404.html'), '404/index.html'];

describe('finalizeDist', () => {
  it('copies 404/index.html to 404.html and reports nothing missing', () => {
    const dist = makeDist(complete);
    expect(finalizeDist(dist)).toEqual([]);
    expect(readFileSync(join(dist, '404.html'), 'utf8')).toBe('x');
  });

  it('reports missing required files', () => {
    const dist = makeDist(complete.filter((f) => f !== 'rss.xml'));
    expect(finalizeDist(dist)).toEqual(['rss.xml']);
  });

  it('reports posts without a prerendered page', () => {
    const dist = makeDist([...complete, 'blog/ok/index.html'], ['ok', 'missing']);
    expect(finalizeDist(dist)).toEqual(['blog/missing/index.html']);
  });

  it('reports a missing 404 page', () => {
    const dist = makeDist(complete.filter((f) => f !== '404/index.html'));
    expect(finalizeDist(dist)).toContain('404.html');
    expect(existsSync(join(dist, '404.html'))).toBe(false);
  });
});
```

- [ ] Run `npm run test:scripts -- scripts/postbuild`. Expected: FAIL (cannot find `./verify`).

- [ ] Create `scripts/postbuild/verify.ts`:

```ts
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
```

- [ ] Run `npm run test:scripts -- scripts/postbuild`. Expected: PASS.

- [ ] Replace `scripts/postbuild.ts`:

```ts
// Runs automatically after `npm run build`: creates 404.html and verifies the static output.
import { finalizeDist } from './postbuild/verify';

const DIST = 'dist/moris-site/browser';
const missing = finalizeDist(DIST);
if (missing.length) {
  console.error(`[postbuild] missing from ${DIST}:\n${missing.map((f) => `  ${f}`).join('\n')}`);
  process.exit(1);
}
console.log('[postbuild] 404.html created, output verified');
```

- [ ] Run `npm run build`. Expected: ends with `[postbuild] 404.html created, output verified` and `dist/moris-site/browser/404.html` exists.

### Step 2: CI workflow

- [ ] Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
  push:
    branches-ignore: [main]

jobs:
  test-and-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm

      - run: npm ci
      - run: npm test
      - run: npm run test:scripts
      - run: npm run build
```

### Step 3: Deploy workflow

- [ ] Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm

      - run: npm ci
      - run: npm test
      - run: npm run test:scripts
      - run: npm run build

      - uses: actions/configure-pages@v5

      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist/moris-site/browser

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] Check both workflows parse as YAML:

```bash
node -e "const y=require('js-yaml'),fs=require('fs');for(const f of ['ci','deploy'])y.load(fs.readFileSync('.github/workflows/'+f+'.yml','utf8'));console.log('yaml ok')"
```

Expected: `yaml ok` (`js-yaml` is installed as a dependency of `gray-matter`).

### Step 4: Deploy guide

- [ ] Create `docs/deploy.md`:

```markdown
# Deploying

The site deploys to GitHub Pages on every push to `main` (`.github/workflows/deploy.yml`). Pull requests run tests and a full build (`.github/workflows/ci.yml`).

## First-time setup

1. Create a public GitHub repo named **`mnmz81.github.io`** (this exact name serves the site at the root URL `https://mnmz81.github.io`).
2. Push this project:
   git remote add origin git@github.com:mnmz81/mnmz81.github.io.git
   git push -u origin main
3. Repo → Settings → Pages → Build and deployment → Source: **GitHub Actions**.
4. Repo → Actions → "Deploy" should run and publish. Open https://mnmz81.github.io.

## Custom domain (any time later)

1. Buy a domain (e.g. `moriszakay.dev`).
2. Create `public/CNAME` containing just the domain, e.g. `moriszakay.dev`.
3. In `src/app/core/site.config.ts` set `url: 'https://moriszakay.dev'` (canonical URLs, sitemap, RSS and OG images use it).
4. DNS at your registrar:
   - Apex domain: `A` records → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` (and optionally `AAAA` → `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`).
   - `www` subdomain: `CNAME` → `mnmz81.github.io`.
5. Repo → Settings → Pages → Custom domain → enter the domain → wait for the DNS check → enable **Enforce HTTPS**.
6. Commit and push; the next deploy serves the site on the new domain.

## Notes

- Drafts (`draft: true`) are never deployed. Preview them locally with `npm start`.
- Unknown URLs show the site's 404 page (`404.html`, created by `scripts/postbuild.ts`).
```

### Step 5: Verify and commit

- [ ] Run `npm run test:scripts`, `npm test`, `npm run build`. Expected: all PASS; build output verified.
- [ ] Commit:

```bash
git add scripts/postbuild.ts scripts/postbuild .github/workflows/ci.yml .github/workflows/deploy.yml docs/deploy.md
git commit -m "ci: github pages deploy, pr checks and postbuild verification"
```
