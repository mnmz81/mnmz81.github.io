# Task 01: Content pipeline (Markdown → JSON, RSS, sitemap)

> Read first: `docs/plan/README.md` (Global Constraints), `docs/plan/contracts.md` (§3 is your output contract), `docs/plan/spec.md`.

**Goal:** Replace the placeholder `scripts/build-content.ts` with a real pipeline that validates frontmatter, renders Markdown (heading ids, TOC, Shiki dual-theme code), and writes `public/content/**`, `public/rss.xml`, `public/sitemap.xml`.

**Wave:** 1 (parallel).

**Files:**
- Modify (replace): `scripts/build-content.ts`
- Create: `scripts/content/schema.ts`, `scripts/content/markdown.ts`, `scripts/content/collect.ts`, `scripts/content/feeds.ts`
- Test: `scripts/content/schema.test.ts`, `scripts/content/markdown.test.ts`, `scripts/content/collect.test.ts`, `scripts/content/feeds.test.ts`

**Interfaces:**
- Consumes: types from `src/app/core/content.models.ts`; `SITE` from `src/app/core/site.config.ts`; sample Markdown in `content/`.
- Produces: files in contracts §3 (exact JSON shapes and HTML shape). CLI: `npm run content` (env `INCLUDE_DRAFTS=1` includes drafts).

Notes:
- Scripts run under `tsx` in CommonJS mode: no top-level `await`.
- gray-matter parses unquoted YAML dates (`date: 2026-08-30`) into `Date` objects. The schema must accept both `Date` and `'YYYY-MM-DD'` strings and output strings.

---

### Step 1: Frontmatter schema (TDD)

- [ ] Write the failing test `scripts/content/schema.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { postFrontmatter, projectFrontmatter, slugFromFile } from './schema';

describe('postFrontmatter', () => {
  const valid = { title: 'T', summary: 'S', date: '2026-08-30', tags: ['angular'] };

  it('accepts valid frontmatter and defaults draft to false', () => {
    expect(postFrontmatter.parse(valid)).toEqual({ ...valid, draft: false });
  });

  it('converts YAML Date objects to YYYY-MM-DD', () => {
    expect(postFrontmatter.parse({ ...valid, date: new Date('2026-08-30T00:00:00Z') }).date).toBe('2026-08-30');
  });

  it('rejects a missing title', () => {
    const { title: _omit, ...rest } = valid;
    expect(() => postFrontmatter.parse(rest)).toThrow();
  });

  it('rejects a bad date format', () => {
    expect(() => postFrontmatter.parse({ ...valid, date: '30/08/2026' })).toThrow();
  });

  it('rejects non-kebab tags', () => {
    expect(() => postFrontmatter.parse({ ...valid, tags: ['Angular Signals'] })).toThrow();
  });

  it('rejects empty tags', () => {
    expect(() => postFrontmatter.parse({ ...valid, tags: [] })).toThrow();
  });

  it('rejects summaries over 200 chars', () => {
    expect(() => postFrontmatter.parse({ ...valid, summary: 'x'.repeat(201) })).toThrow();
  });

  it('rejects unknown keys', () => {
    expect(() => postFrontmatter.parse({ ...valid, author: 'me' })).toThrow();
  });
});

describe('projectFrontmatter', () => {
  const valid = { title: 'P', summary: 'S', tech: ['Angular'], order: 1, date: '2026-10-04' };

  it('accepts valid frontmatter and defaults featured to false', () => {
    expect(projectFrontmatter.parse(valid)).toEqual({ ...valid, featured: false });
  });

  it('rejects a non-URL repo', () => {
    expect(() => projectFrontmatter.parse({ ...valid, repo: 'github.com/x' })).toThrow();
  });
});

describe('slugFromFile', () => {
  it('returns the filename without extension', () => {
    expect(slugFromFile('/a/b/my-post.md')).toBe('my-post');
  });

  it('rejects non-kebab filenames', () => {
    expect(() => slugFromFile('/a/My Post.md')).toThrow(/kebab-case/);
  });
});
```

- [ ] Run `npm run test:scripts`. Expected: FAIL (cannot find `./schema`).

- [ ] Create `scripts/content/schema.ts`:

```ts
import { basename } from 'node:path';
import { z } from 'zod';

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const dateField = z.preprocess(
  (value) => (value instanceof Date ? value.toISOString().slice(0, 10) : value),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD'),
);

const imagePath = z.string().startsWith('/images/');

export const postFrontmatter = z
  .object({
    title: z.string().min(1),
    summary: z.string().min(1).max(200),
    date: dateField,
    updated: dateField.optional(),
    tags: z.array(z.string().regex(KEBAB, 'tags must be lowercase kebab-case')).min(1),
    draft: z.boolean().default(false),
    cover: imagePath.optional(),
  })
  .strict();

export const projectFrontmatter = z
  .object({
    title: z.string().min(1),
    summary: z.string().min(1).max(240),
    tech: z.array(z.string().min(1)).min(1),
    repo: z.string().url().optional(),
    url: z.string().url().optional(),
    image: imagePath.optional(),
    featured: z.boolean().default(false),
    order: z.number().int(),
    date: dateField,
  })
  .strict();

export type PostFrontmatter = z.infer<typeof postFrontmatter>;
export type ProjectFrontmatter = z.infer<typeof projectFrontmatter>;

export function slugFromFile(file: string): string {
  const slug = basename(file, '.md');
  if (!KEBAB.test(slug)) throw new Error(`${file}: filename must be kebab-case (e.g. my-first-post.md)`);
  return slug;
}
```

- [ ] Run `npm run test:scripts`. Expected: PASS.

### Step 2: Markdown renderer (TDD)

- [ ] Write the failing test `scripts/content/markdown.test.ts`:

```ts
import { beforeAll, describe, expect, it } from 'vitest';
import { createRenderer, type Renderer } from './markdown';

let render: Renderer;
beforeAll(async () => {
  render = await createRenderer();
});

describe('markdown renderer', () => {
  it('adds ids to h2/h3 and builds a toc', () => {
    const { html, toc } = render('## Why signals\n\ntext\n\n### Computed values\n\n#### Deep\n');
    expect(html).toContain('<h2 id="why-signals">');
    expect(html).toContain('<h3 id="computed-values">');
    expect(toc).toEqual([
      { id: 'why-signals', text: 'Why signals', depth: 2 },
      { id: 'computed-values', text: 'Computed values', depth: 3 },
    ]);
  });

  it('de-duplicates heading ids within a document', () => {
    const { toc } = render('## Setup\n\n## Setup\n');
    expect(toc.map((t) => t.id)).toEqual(['setup', 'setup-1']);
  });

  it('resets heading ids between documents', () => {
    render('## Setup\n');
    expect(render('## Setup\n').toc[0].id).toBe('setup');
  });

  it('highlights code with shiki dual themes', () => {
    const { html } = render('```ts\nconst a = 1;\n```\n');
    expect(html).toContain('class="shiki shiki-themes github-light github-dark');
    expect(html).toContain('--shiki-dark:');
  });

  it('falls back to plain text for unknown languages', () => {
    const { html } = render('```nope\nhello\n```\n');
    expect(html).toContain('<pre class="shiki');
    expect(html).toContain('hello');
  });

  it('escapes raw HTML', () => {
    const { html } = render('<script>alert(1)</script>\n');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('lazy-loads images', () => {
    expect(render('![alt](/images/x/1.png)\n').html).toContain('loading="lazy"');
  });

  it('computes reading time with a minimum of 1 minute', () => {
    expect(render('short').readingMinutes).toBe(1);
    expect(render('word '.repeat(1000)).readingMinutes).toBe(5);
  });
});
```

- [ ] Run `npm run test:scripts`. Expected: FAIL (cannot find `./markdown`).

- [ ] Create `scripts/content/markdown.ts`:

```ts
import GithubSlugger from 'github-slugger';
import MarkdownIt from 'markdown-it';
import anchor from 'markdown-it-anchor';
import { createHighlighter } from 'shiki';
import type { TocItem } from '../../src/app/core/content.models';

export interface RenderedMarkdown {
  html: string;
  toc: TocItem[];
  readingMinutes: number;
}

export type Renderer = (markdown: string) => RenderedMarkdown;

const LANGS = ['ts', 'js', 'json', 'html', 'css', 'scss', 'bash', 'shell', 'python', 'yaml', 'markdown', 'diff', 'sql', 'java'];
const THEMES = { light: 'github-light', dark: 'github-dark' } as const;
const WORDS_PER_MINUTE = 200;

export async function createRenderer(): Promise<Renderer> {
  const highlighter = await createHighlighter({ themes: Object.values(THEMES), langs: LANGS });
  const loaded = new Set(highlighter.getLoadedLanguages());
  let slugger = new GithubSlugger();

  const md: MarkdownIt = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: true,
    highlight: (code, lang) =>
      highlighter.codeToHtml(code, {
        lang: loaded.has(lang) ? lang : 'text',
        themes: THEMES,
        defaultColor: false,
      }),
  });

  md.use(anchor, { level: [2, 3], slugify: (s: string) => slugger.slug(s), tabIndex: false });

  const defaultImage = md.renderer.rules.image!;
  md.renderer.rules.image = (tokens, idx, options, env, self) => {
    tokens[idx].attrSet('loading', 'lazy');
    return defaultImage(tokens, idx, options, env, self);
  };

  return (markdown) => {
    slugger = new GithubSlugger();
    const env = {};
    const tokens = md.parse(markdown, env);
    const toc: TocItem[] = [];
    tokens.forEach((token, i) => {
      if (token.type !== 'heading_open' || (token.tag !== 'h2' && token.tag !== 'h3')) return;
      toc.push({
        id: token.attrGet('id') ?? '',
        text: tokens[i + 1]?.content ?? '',
        depth: token.tag === 'h2' ? 2 : 3,
      });
    });
    const words = markdown.split(/\s+/).filter(Boolean).length;
    return {
      html: md.renderer.render(tokens, md.options, env),
      toc,
      readingMinutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
    };
  };
}
```

- [ ] Run `npm run test:scripts`. Expected: PASS. (If `<h2 id="why-signals">` fails because the anchor plugin adds extra attributes, set the plugin's `permalink: false` explicitly; the assertion must match exactly.)

### Step 3: Collect and write content (TDD)

- [ ] Write the failing test `scripts/content/collect.test.ts`:

```ts
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildContent } from './collect';

function makeContent(files: Record<string, string>): { contentDir: string; outDir: string } {
  const root = mkdtempSync(join(tmpdir(), 'content-'));
  const contentDir = join(root, 'content');
  for (const [rel, body] of Object.entries(files)) {
    const file = join(contentDir, rel);
    mkdirSync(join(file, '..'), { recursive: true });
    writeFileSync(file, body);
  }
  mkdirSync(join(contentDir, 'blog'), { recursive: true });
  mkdirSync(join(contentDir, 'projects'), { recursive: true });
  return { contentDir, outDir: join(root, 'out') };
}

const post = (title: string, date: string, tags: string, extra = '') =>
  `---\ntitle: ${title}\nsummary: S\ndate: ${date}\ntags: [${tags}]\n${extra}---\n\n## Heading\n\nBody\n`;

const project = (title: string, order: number) =>
  `---\ntitle: ${title}\nsummary: S\ntech: [Angular]\norder: ${order}\ndate: 2026-01-01\n---\n`;

const readJson = (file: string) => JSON.parse(readFileSync(file, 'utf8'));

describe('buildContent', () => {
  it('writes index, posts and projects sorted per contract', async () => {
    const dirs = makeContent({
      'blog/older.md': post('Older', '2026-01-01', 'ai'),
      'blog/newer.md': post('Newer', '2026-02-01', 'ai, angular'),
      'projects/b.md': project('B', 2),
      'projects/a.md': project('A', 1),
    });
    await buildContent({ ...dirs, includeDrafts: false });

    const index = readJson(join(dirs.outDir, 'index.json'));
    expect(index.posts.map((p: { slug: string }) => p.slug)).toEqual(['newer', 'older']);
    expect(index.tags).toEqual([
      { tag: 'ai', count: 2 },
      { tag: 'angular', count: 1 },
    ]);
    expect(index.posts[0]).not.toHaveProperty('html');

    const newer = readJson(join(dirs.outDir, 'posts', 'newer.json'));
    expect(newer).toMatchObject({ slug: 'newer', title: 'Newer', date: '2026-02-01', readingMinutes: 1 });
    expect(newer.toc).toEqual([{ id: 'heading', text: 'Heading', depth: 2 }]);
    expect(newer).not.toHaveProperty('draft');

    expect(readJson(join(dirs.outDir, 'projects.json')).map((p: { slug: string }) => p.slug)).toEqual(['a', 'b']);
  });

  it('excludes drafts unless includeDrafts is true', async () => {
    const dirs = makeContent({ 'blog/wip.md': post('WIP', '2026-01-01', 'ai', 'draft: true\n') });
    await buildContent({ ...dirs, includeDrafts: false });
    expect(readJson(join(dirs.outDir, 'index.json')).posts).toEqual([]);
    expect(existsSync(join(dirs.outDir, 'posts', 'wip.json'))).toBe(false);

    await buildContent({ ...dirs, includeDrafts: true });
    expect(readJson(join(dirs.outDir, 'index.json')).posts).toHaveLength(1);
  });

  it('removes JSON for posts that no longer exist', async () => {
    const dirs = makeContent({ 'blog/keep.md': post('Keep', '2026-01-01', 'ai') });
    mkdirSync(join(dirs.outDir, 'posts'), { recursive: true });
    writeFileSync(join(dirs.outDir, 'posts', 'stale.json'), '{}');
    await buildContent({ ...dirs, includeDrafts: false });
    expect(existsSync(join(dirs.outDir, 'posts', 'stale.json'))).toBe(false);
  });

  it('reports every invalid file by path', async () => {
    const dirs = makeContent({
      'blog/bad-one.md': '---\ntitle: X\n---\n',
      'projects/bad-two.md': '---\ntitle: Y\n---\n',
    });
    await expect(buildContent({ ...dirs, includeDrafts: false })).rejects.toThrow(/bad-one\.md[\s\S]*bad-two\.md/);
  });
});
```

- [ ] Run `npm run test:scripts`. Expected: FAIL (cannot find `./collect`).

- [ ] Create `scripts/content/collect.ts`:

```ts
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import type { ContentIndex, Post, PostMeta, Project, TagCount } from '../../src/app/core/content.models';
import { createRenderer } from './markdown';
import { postFrontmatter, projectFrontmatter, slugFromFile } from './schema';

export interface BuildOptions {
  contentDir: string;
  outDir: string;
  includeDrafts: boolean;
}

export interface BuildResult {
  index: ContentIndex;
  projects: Project[];
}

function markdownFiles(dir: string): string[] {
  try {
    return readdirSync(dir)
      .filter((f) => f.endsWith('.md'))
      .sort()
      .map((f) => join(dir, f));
  } catch {
    return [];
  }
}

function countTags(posts: PostMeta[]): TagCount[] {
  const counts = new Map<string, number>();
  for (const post of posts) for (const tag of post.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  return [...counts]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export async function buildContent({ contentDir, outDir, includeDrafts }: BuildOptions): Promise<BuildResult> {
  const render = await createRenderer();
  const errors: string[] = [];
  const posts: Post[] = [];
  const projects: Project[] = [];

  for (const file of markdownFiles(join(contentDir, 'blog'))) {
    try {
      const { data, content } = matter(readFileSync(file, 'utf8'));
      const { draft, ...fm } = postFrontmatter.parse(data);
      if (draft && !includeDrafts) continue;
      posts.push({ slug: slugFromFile(file), ...fm, ...render(content) });
    } catch (error) {
      errors.push(`${file}: ${(error as Error).message}`);
    }
  }

  for (const file of markdownFiles(join(contentDir, 'projects'))) {
    try {
      const { data } = matter(readFileSync(file, 'utf8'));
      projects.push({ slug: slugFromFile(file), ...projectFrontmatter.parse(data) });
    } catch (error) {
      errors.push(`${file}: ${(error as Error).message}`);
    }
  }

  if (errors.length) throw new Error(`Invalid content:\n${errors.join('\n')}`);

  posts.sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
  projects.sort((a, b) => a.order - b.order);

  const metas: PostMeta[] = posts.map(({ html: _html, toc: _toc, ...meta }) => meta);
  const index: ContentIndex = { generatedAt: new Date().toISOString(), posts: metas, tags: countTags(metas) };

  rmSync(join(outDir, 'posts'), { recursive: true, force: true });
  mkdirSync(join(outDir, 'posts'), { recursive: true });
  writeFileSync(join(outDir, 'index.json'), JSON.stringify(index, null, 2));
  writeFileSync(join(outDir, 'projects.json'), JSON.stringify(projects, null, 2));
  for (const post of posts) writeFileSync(join(outDir, 'posts', `${post.slug}.json`), JSON.stringify(post));

  return { index, projects };
}
```

- [ ] Run `npm run test:scripts`. Expected: PASS.

### Step 4: RSS and sitemap (TDD)

- [ ] Write the failing test `scripts/content/feeds.test.ts`:

```ts
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
    expect(xml).toContain('<link>https://example.dev/blog/a-post</link>');
    expect(xml).toContain('<guid isPermaLink="true">https://example.dev/blog/a-post</guid>');
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
    expect(xml).toContain('<loc>https://example.dev/blog/a-post</loc>');
    expect(xml).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
  });
});
```

- [ ] Run `npm run test:scripts`. Expected: FAIL.

- [ ] Create `scripts/content/feeds.ts`:

```ts
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
      const link = `${site.url}/blog/${post.slug}`;
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
  const urls = paths.map((p) => `  <url><loc>${escapeXml(siteUrl + p)}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
```

- [ ] Run `npm run test:scripts`. Expected: PASS.

### Step 5: CLI entry point

- [ ] Replace `scripts/build-content.ts`:

```ts
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
```

### Step 6: Verify and commit

- [ ] Run:

```bash
npm run test:scripts
INCLUDE_DRAFTS=1 npm run content
cat public/content/index.json | head -30
grep -c 'shiki-themes' public/content/posts/angular-signals-in-practice.json
npm run content
```

Expected: tests PASS; with drafts → `[content] 3 posts, 6 tags, 2 projects (drafts included)`; grep ≥ 1; without drafts → `[content] 0 posts, 0 tags, 2 projects`.

- [ ] Run `npm test` and `INCLUDE_DRAFTS=1 npm run build`. Expected: PASS and build succeeds (prerendered post pages exist under `dist/moris-site/browser/blog/`).

- [ ] Commit:

```bash
git add scripts/build-content.ts scripts/content
git commit -m "feat(content): markdown pipeline with validation, shiki, toc, rss and sitemap"
```
