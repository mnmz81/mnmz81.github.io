# Task 11: Notion sync (script + manual workflow)

> Read first: `docs/plan/README.md` (Global Constraints), `docs/plan/contracts.md` (§3 frontmatter is your output contract), `docs/plan/spec.md` (§6).

**Goal:** Let Moris write in Notion and publish to the repo: `npm run sync:notion` pulls `Published` pages from a Notion data source, converts them to Markdown with valid frontmatter, downloads images locally, and writes `content/blog|projects/<slug>.md`. A manual GitHub Actions workflow runs the same sync and opens a PR.

**Wave:** 1 (parallel).

**Files:**
- Modify (replace placeholder): `scripts/sync-notion.ts`
- Create: `scripts/notion/mapping.ts`, `scripts/notion/sync.ts`, `scripts/notion/client.ts`
- Test: `scripts/notion/mapping.test.ts`, `scripts/notion/sync.test.ts`
- Create: `.github/workflows/notion-sync.yml`, `.env.example`, `docs/notion-setup.md`

**Interfaces:**
- Consumes: frontmatter contract (contracts §3). Installed packages `@notionhq/client`, `notion-to-md`, `gray-matter` (Task 00).
- Produces: Markdown files that pass Task 01's validation; images under `public/images/<slug>/<n>.<ext>` referenced as `/images/<slug>/<n>.<ext>`. CLI `npm run sync:notion`; env `NOTION_TOKEN`, `NOTION_DATA_SOURCE_ID`.

Rules:
- Create/update only. Never delete Markdown files (removing a post = delete its file manually).
- Do not add frontmatter keys outside the contract (Task 01 uses `.strict()`).
- Notion image URLs expire after about an hour, so images must be downloaded.
- Before writing `client.ts`, check the installed SDK API: run `npm ls @notionhq/client` and read its docs (context7 or the package README). SDK v5+ (Notion API `2025-09-03`) queries with `notion.dataSources.query({ data_source_id })`. If the installed major version is older, use `notion.databases.query({ database_id })` and name the env var accordingly in docs. Keep the `NotionSource` interface unchanged either way.

---

### Step 1: Mapping (TDD)

- [ ] Create `scripts/notion/mapping.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import matter from 'gray-matter';
import { readEntry, rewriteImages, slugify, toMarkdownFile, type NotionPageLike } from './mapping';

const rich = (s: string) => [{ plain_text: s }];

function page(overrides: Record<string, unknown> = {}): NotionPageLike {
  return {
    id: 'page-1',
    properties: {
      Title: { type: 'title', title: rich('Angular Signals in Practice!') },
      Slug: { type: 'rich_text', rich_text: [] },
      Type: { type: 'select', select: { name: 'Blog' } },
      Status: { type: 'status', status: { name: 'Published' } },
      Tags: { type: 'multi_select', multi_select: [{ name: 'Angular' }, { name: 'Web Dev' }] },
      Date: { type: 'date', date: { start: '2026-08-30T10:00:00.000+03:00' } },
      Summary: { type: 'rich_text', rich_text: rich('How signals changed my state code.') },
      Tech: { type: 'multi_select', multi_select: [] },
      Repo: { type: 'url', url: null },
      URL: { type: 'url', url: null },
      Featured: { type: 'checkbox', checkbox: false },
      Order: { type: 'number', number: null },
      ...overrides,
    },
  };
}

describe('slugify', () => {
  it('makes kebab-case slugs', () => {
    expect(slugify('Angular Signals in Practice!')).toBe('angular-signals-in-practice');
    expect(slugify('  Web   Dev_2 ')).toBe('web-dev-2');
  });
});

describe('readEntry', () => {
  it('reads a blog page, deriving the slug from the title', () => {
    expect(readEntry(page())).toMatchObject({
      id: 'page-1',
      type: 'Blog',
      slug: 'angular-signals-in-practice',
      title: 'Angular Signals in Practice!',
      summary: 'How signals changed my state code.',
      date: '2026-08-30',
      tags: ['angular', 'web-dev'],
    });
  });

  it('prefers an explicit slug', () => {
    expect(readEntry(page({ Slug: { type: 'rich_text', rich_text: rich('signals') } })).slug).toBe('signals');
  });

  it('accepts Type as a status-less select and reads project fields', () => {
    const entry = readEntry(
      page({
        Type: { type: 'select', select: { name: 'Project' } },
        Tech: { type: 'multi_select', multi_select: [{ name: 'Angular' }] },
        Repo: { type: 'url', url: 'https://github.com/mnmz81/x' },
        Featured: { type: 'checkbox', checkbox: true },
        Order: { type: 'number', number: 3 },
      }),
    );
    expect(entry).toMatchObject({ type: 'Project', tech: ['Angular'], repo: 'https://github.com/mnmz81/x', featured: true, order: 3 });
  });

  it('rejects pages without a valid Type', () => {
    expect(() => readEntry(page({ Type: { type: 'select', select: null } }))).toThrow(/Type must be Blog or Project/);
  });

  it('rejects pages without a date', () => {
    expect(() => readEntry(page({ Date: { type: 'date', date: null } }))).toThrow(/Date is required/);
  });
});

describe('toMarkdownFile', () => {
  it('writes contract frontmatter for a blog post', () => {
    const file = toMarkdownFile(readEntry(page()), 'Hello\n');
    const { data, content } = matter(file);
    expect(data).toEqual({
      title: 'Angular Signals in Practice!',
      summary: 'How signals changed my state code.',
      date: '2026-08-30',
      tags: ['angular', 'web-dev'],
    });
    expect(content.trim()).toBe('Hello');
  });

  it('writes contract frontmatter for a project without empty optional keys', () => {
    const entry = readEntry(
      page({
        Type: { type: 'select', select: { name: 'Project' } },
        Tech: { type: 'multi_select', multi_select: [{ name: 'Python' }] },
        Order: { type: 'number', number: 2 },
      }),
    );
    const { data } = matter(toMarkdownFile(entry, ''));
    expect(data).toEqual({
      title: 'Angular Signals in Practice!',
      summary: 'How signals changed my state code.',
      tech: ['Python'],
      featured: false,
      order: 2,
      date: '2026-08-30',
    });
  });
});

describe('rewriteImages', () => {
  it('rewrites remote images to local paths and lists downloads', () => {
    const md = '![a](https://s3.aws.com/x/photo.JPG?sig=1)\ntext\n![](https://img.dev/no-ext)';
    const { markdown, downloads } = rewriteImages(md, 'my-post');
    expect(markdown).toBe('![a](/images/my-post/1.jpg)\ntext\n![](/images/my-post/2.png)');
    expect(downloads).toEqual([
      { url: 'https://s3.aws.com/x/photo.JPG?sig=1', file: 'images/my-post/1.jpg' },
      { url: 'https://img.dev/no-ext', file: 'images/my-post/2.png' },
    ]);
  });

  it('leaves local images alone', () => {
    expect(rewriteImages('![a](/images/x/1.png)', 'x').downloads).toEqual([]);
  });
});
```

- [ ] Run `npm run test:scripts -- scripts/notion`. Expected: FAIL (cannot find `./mapping`).

- [ ] Create `scripts/notion/mapping.ts`:

```ts
import { extname } from 'node:path';
import matter from 'gray-matter';

export type ContentType = 'Blog' | 'Project';

/** The subset of a Notion page object this sync reads. */
export interface NotionPageLike {
  id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  properties: Record<string, any>;
}

export interface NotionEntry {
  id: string;
  type: ContentType;
  slug: string;
  title: string;
  summary: string;
  date: string;
  tags: string[];
  tech: string[];
  repo?: string;
  url?: string;
  featured: boolean;
  order?: number;
}

export interface ImageDownload {
  url: string;
  file: string; // relative to public/, e.g. 'images/my-post/1.png'
}

const IMAGE_EXT = /^\.(png|jpe?g|gif|webp|svg|avif)$/;
const DEFAULT_PROJECT_ORDER = 99;

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const plain = (parts: any[] | undefined) => (parts ?? []).map((p) => p.plain_text).join('');
const text = (p: any) => (p?.type === 'title' ? plain(p.title) : p?.type === 'rich_text' ? plain(p.rich_text) : '');
const option = (p: any): string => (p?.type === 'select' ? p.select?.name : p?.type === 'status' ? p.status?.name : '') ?? '';
const options = (p: any): string[] => (p?.type === 'multi_select' ? p.multi_select.map((o: any) => o.name) : []);
const link = (p: any): string | undefined => (p?.type === 'url' && p.url ? p.url : undefined);
const day = (p: any): string => (p?.type === 'date' && p.date?.start ? String(p.date.start).slice(0, 10) : '');
const flag = (p: any): boolean => p?.type === 'checkbox' && p.checkbox === true;
const num = (p: any): number | undefined => (p?.type === 'number' && typeof p.number === 'number' ? p.number : undefined);
/* eslint-enable @typescript-eslint/no-explicit-any */

export function readEntry(page: NotionPageLike): NotionEntry {
  const p = page.properties;
  const type = option(p['Type']);
  if (type !== 'Blog' && type !== 'Project') throw new Error(`Notion page ${page.id}: Type must be Blog or Project`);
  const title = text(p['Title']).trim();
  const date = day(p['Date']);
  if (!date) throw new Error(`Notion page ${page.id} (${title}): Date is required`);
  return {
    id: page.id,
    type,
    slug: slugify(text(p['Slug']) || title),
    title,
    summary: text(p['Summary']).trim(),
    date,
    tags: options(p['Tags']).map(slugify),
    tech: options(p['Tech']),
    repo: link(p['Repo']),
    url: link(p['URL']),
    featured: flag(p['Featured']),
    order: num(p['Order']),
  };
}

export function toMarkdownFile(entry: NotionEntry, body: string): string {
  const data =
    entry.type === 'Blog'
      ? { title: entry.title, summary: entry.summary, date: entry.date, tags: entry.tags }
      : {
          title: entry.title,
          summary: entry.summary,
          tech: entry.tech,
          ...(entry.repo ? { repo: entry.repo } : {}),
          ...(entry.url ? { url: entry.url } : {}),
          featured: entry.featured,
          order: entry.order ?? DEFAULT_PROJECT_ORDER,
          date: entry.date,
        };
  return matter.stringify(body.trim() ? `\n${body.trim()}\n` : '', data);
}

export function rewriteImages(markdown: string, slug: string): { markdown: string; downloads: ImageDownload[] } {
  const downloads: ImageDownload[] = [];
  const rewritten = markdown.replace(/!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g, (_match, alt: string, url: string) => {
    const ext = extname(new URL(url).pathname).toLowerCase();
    const file = `images/${slug}/${downloads.length + 1}${IMAGE_EXT.test(ext) ? ext.replace('.jpeg', '.jpg') : '.png'}`;
    downloads.push({ url, file });
    return `![${alt}](/${file})`;
  });
  return { markdown: rewritten, downloads };
}
```

- [ ] Run `npm run test:scripts -- scripts/notion`. Expected: PASS. (If gray-matter quotes or reorders keys, the `toEqual` on parsed `data` still passes; dates must parse back as the string `'2026-08-30'`. If js-yaml emits them unquoted and they parse back as `Date`, quote them by passing `date: String(entry.date)` — Task 01's schema accepts both, but this test expects strings.)

### Step 2: Sync orchestration (TDD)

- [ ] Create `scripts/notion/sync.test.ts`:

```ts
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import type { NotionPageLike } from './mapping';
import { runSync, type NotionSource } from './sync';

const rich = (s: string) => [{ plain_text: s }];
const blogPage = (id: string, title: string): NotionPageLike => ({
  id,
  properties: {
    Title: { type: 'title', title: rich(title) },
    Type: { type: 'select', select: { name: 'Blog' } },
    Tags: { type: 'multi_select', multi_select: [{ name: 'ai' }] },
    Date: { type: 'date', date: { start: '2026-09-01' } },
    Summary: { type: 'rich_text', rich_text: rich('Sum') },
  },
});

function dirs() {
  const root = mkdtempSync(join(tmpdir(), 'notion-'));
  return { contentDir: join(root, 'content'), publicDir: join(root, 'public') };
}

describe('runSync', () => {
  it('writes markdown and downloads images', async () => {
    const source: NotionSource = {
      listPublished: async () => [blogPage('p1', 'First Post')],
      pageMarkdown: async () => 'Intro\n\n![shot](https://files.notion.so/a/shot.png?x=1)\n',
    };
    const download = vi.fn(async () => undefined);
    const { contentDir, publicDir } = dirs();

    const result = await runSync({ source, download, contentDir, publicDir });

    const file = join(contentDir, 'blog', 'first-post.md');
    expect(result.written).toEqual([file]);
    const md = readFileSync(file, 'utf8');
    expect(md).toContain('title: First Post');
    expect(md).toContain('![shot](/images/first-post/1.png)');
    expect(download).toHaveBeenCalledWith('https://files.notion.so/a/shot.png?x=1', join(publicDir, 'images', 'first-post', '1.png'));
  });

  it('continues past a bad page and reports it', async () => {
    const bad: NotionPageLike = { id: 'bad', properties: {} };
    const source: NotionSource = {
      listPublished: async () => [bad, blogPage('p2', 'Good One')],
      pageMarkdown: async () => 'Body',
    };
    const { contentDir, publicDir } = dirs();

    await expect(runSync({ source, download: async () => undefined, contentDir, publicDir })).rejects.toThrow(/bad/);
    expect(existsSync(join(contentDir, 'blog', 'good-one.md'))).toBe(true);
  });
});
```

- [ ] Run `npm run test:scripts -- scripts/notion`. Expected: FAIL (cannot find `./sync`).

- [ ] Create `scripts/notion/sync.ts`:

```ts
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { type NotionPageLike, readEntry, rewriteImages, toMarkdownFile } from './mapping';

export interface NotionSource {
  listPublished(): Promise<NotionPageLike[]>;
  pageMarkdown(pageId: string): Promise<string>;
}

export type Downloader = (url: string, destination: string) => Promise<void>;

export interface SyncOptions {
  source: NotionSource;
  download: Downloader;
  contentDir: string;
  publicDir: string;
}

export async function runSync({ source, download, contentDir, publicDir }: SyncOptions): Promise<{ written: string[] }> {
  const written: string[] = [];
  const errors: string[] = [];

  for (const page of await source.listPublished()) {
    try {
      const entry = readEntry(page);
      const isBlog = entry.type === 'Blog';
      let body = '';
      if (isBlog) {
        const { markdown, downloads } = rewriteImages(await source.pageMarkdown(page.id), entry.slug);
        rmSync(join(publicDir, 'images', entry.slug), { recursive: true, force: true });
        for (const { url, file } of downloads) {
          const destination = join(publicDir, file);
          mkdirSync(dirname(destination), { recursive: true });
          await download(url, destination);
        }
        body = markdown;
      }
      const file = join(contentDir, isBlog ? 'blog' : 'projects', `${entry.slug}.md`);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, toMarkdownFile(entry, body));
      written.push(file);
    } catch (error) {
      errors.push(`${page.id}: ${(error as Error).message}`);
    }
  }

  if (errors.length) throw new Error(`Notion sync finished with errors (${written.length} written):\n${errors.join('\n')}`);
  return { written };
}
```

- [ ] Run `npm run test:scripts -- scripts/notion`. Expected: PASS.

### Step 3: Notion client and CLI

- [ ] Create `scripts/notion/client.ts` (thin adapter; verified manually, not unit-tested):

```ts
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';
import type { NotionPageLike } from './mapping';
import type { Downloader, NotionSource } from './sync';

export function createNotionSource(token: string, dataSourceId: string): NotionSource {
  const notion = new Client({ auth: token });
  const n2m = new NotionToMarkdown({ notionClient: notion });

  return {
    async listPublished() {
      const pages: NotionPageLike[] = [];
      let cursor: string | undefined;
      do {
        const res = await notion.dataSources.query({
          data_source_id: dataSourceId,
          filter: { property: 'Status', status: { equals: 'Published' } },
          start_cursor: cursor,
        });
        pages.push(...(res.results.filter((r) => 'properties' in r) as unknown as NotionPageLike[]));
        cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
      } while (cursor);
      return pages;
    },
    async pageMarkdown(pageId) {
      const blocks = await n2m.pageToMarkdown(pageId);
      return n2m.toMarkdownString(blocks).parent ?? '';
    },
  };
}

export const fetchDownloader: Downloader = async (url, destination) => {
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`GET ${url} failed with ${res.status}`);
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, Buffer.from(await res.arrayBuffer()));
};
```

- [ ] Replace `scripts/sync-notion.ts`:

```ts
// Pulls Published pages from Notion into content/ (see docs/notion-setup.md).
// Usage: npm run sync:notion      (reads NOTION_TOKEN and NOTION_DATA_SOURCE_ID from env or .env)
import { createNotionSource, fetchDownloader } from './notion/client';
import { runSync } from './notion/sync';

async function main(): Promise<void> {
  try {
    process.loadEnvFile('.env');
  } catch {
    // No .env file: rely on the environment (CI).
  }
  const token = process.env['NOTION_TOKEN'];
  const dataSourceId = process.env['NOTION_DATA_SOURCE_ID'];
  if (!token || !dataSourceId) {
    throw new Error('Missing NOTION_TOKEN or NOTION_DATA_SOURCE_ID. See docs/notion-setup.md.');
  }
  const { written } = await runSync({
    source: createNotionSource(token, dataSourceId),
    download: fetchDownloader,
    contentDir: 'content',
    publicDir: 'public',
  });
  console.log(`[notion] wrote ${written.length} files:\n${written.map((f) => `  ${f}`).join('\n')}`);
  console.log('[notion] next: run `npm run content` to validate, then review and commit.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
```

- [ ] Create `.env.example`:

```
# Copy to .env (never commit .env). See docs/notion-setup.md.
NOTION_TOKEN=
NOTION_DATA_SOURCE_ID=
```

### Step 4: Workflow and setup docs

- [ ] Create `.github/workflows/notion-sync.yml`:

```yaml
name: Notion sync

on:
  workflow_dispatch:

permissions:
  contents: write
  pull-requests: write

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm

      - run: npm ci

      - name: Pull published pages from Notion
        run: npm run sync:notion
        env:
          NOTION_TOKEN: ${{ secrets.NOTION_TOKEN }}
          NOTION_DATA_SOURCE_ID: ${{ secrets.NOTION_DATA_SOURCE_ID }}

      - name: Validate content
        run: npm run content

      - name: Open pull request
        uses: peter-evans/create-pull-request@v7
        with:
          branch: notion-sync
          delete-branch: true
          commit-message: 'content: sync from Notion'
          title: 'content: sync from Notion'
          body: Automated sync of Published pages from Notion. Review the Markdown and images, then merge to deploy.
          add-paths: |
            content/**
            public/images/**
```

- [ ] Create `docs/notion-setup.md`:

```markdown
# Writing posts in Notion

Markdown in `content/` is the source of truth. Notion is optional: write there, sync, review the PR, merge.

## One-time setup

1. **Create an integration:** https://www.notion.so/profile/integrations → New integration (internal) → copy the secret (`ntn_...`).
2. **Create a database** (full page) named "Site content" with these properties (names are case-sensitive):

   | Property | Type | Notes |
   |---|---|---|
   | Title | Title | Post or project title |
   | Slug | Text | Optional; defaults to the title in kebab-case |
   | Type | Select | Options: `Blog`, `Project` |
   | Status | Status | Options include `Draft` and `Published`; only `Published` syncs |
   | Tags | Multi-select | Blog tags (converted to kebab-case) |
   | Date | Date | Publish date (required) |
   | Summary | Text | ≤ 200 chars for posts, ≤ 240 for projects |
   | Tech | Multi-select | Projects only |
   | Repo | URL | Projects only |
   | URL | URL | Projects only (live link) |
   | Featured | Checkbox | Projects only |
   | Order | Number | Projects only (sort order) |

3. **Connect the integration:** open the database → `•••` → Connections → add your integration.
4. **Copy the data source ID:** database `•••` → Manage data sources → copy the data source ID.
5. **Local:** `cp .env.example .env` and fill both values.
6. **GitHub:** repo → Settings → Secrets and variables → Actions → add `NOTION_TOKEN` and `NOTION_DATA_SOURCE_ID`. Then Settings → Actions → General → enable "Allow GitHub Actions to create and approve pull requests".

## Publishing a post

- Locally: set Status = Published → `npm run sync:notion` → `npm start` to preview → commit and push.
- From GitHub: Actions → "Notion sync" → Run workflow → review and merge the PR.

The page body becomes the post body; images are downloaded into `public/images/<slug>/`. The sync never deletes files: to unpublish, delete `content/blog/<slug>.md` (and its images) in the repo.
```

### Step 5: Verify and commit

- [ ] Run `npm run test:scripts` and `npm test`. Expected: PASS.
- [ ] Type-check the client against the installed SDK:

```bash
npx tsc --noEmit --strict --esModuleInterop --skipLibCheck --module nodenext --moduleResolution nodenext scripts/notion/client.ts
```

Expected: no errors. (A type error on `dataSources` means the installed SDK is older than v5; see the rule at the top.)
- [ ] Run `npm run sync:notion` without credentials. Expected: exits 1 with the "Missing NOTION_TOKEN" message.
- [ ] If Moris has provided credentials, run a real sync and `npm run content` to confirm the output validates.
- [ ] Commit:

```bash
git add scripts/sync-notion.ts scripts/notion .github/workflows/notion-sync.yml .env.example docs/notion-setup.md
git commit -m "feat(notion): sync published notion pages into markdown content"
```
