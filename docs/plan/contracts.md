# Contracts — shared names, types, files, and ownership

Every task implementer MUST read this file. It is the only way tasks learn what their neighbours produce. Task 00 creates everything listed under "Created by Task 00"; Wave 1 tasks build on those exact names.

## 1. Project facts

- Angular project name: `moris-site` → build output `dist/moris-site/browser/`
- Node: 24 LTS (`.nvmrc` = `24`)
- Package manager: npm (commit `package-lock.json`)
- App code: `src/app/`. Node scripts: `scripts/` (run with `tsx`, CommonJS context, so no top-level `await`; wrap in `main().catch(...)`)
- App unit tests: `*.spec.ts` next to the file, run by `npm test` (Angular CLI unit-test builder, Vitest)
- Script unit tests: `scripts/**/*.test.ts`, run by `npm run test:scripts` (`vitest.scripts.config.ts`, node env)
- E2E: `e2e/*.spec.ts`, run by `npm run e2e` (Playwright, serves `dist/moris-site/browser` on port 4300)

## 2. npm scripts (defined by Task 00, frozen afterwards)

```json
{
  "start": "INCLUDE_DRAFTS=1 npm run content && ng serve",
  "content": "tsx scripts/build-content.ts",
  "og": "tsx scripts/build-og.ts",
  "build": "npm run content && npm run og && ng build",
  "postbuild": "tsx scripts/postbuild.ts",
  "test": "ng test --watch=false",
  "test:scripts": "vitest run --config vitest.scripts.config.ts",
  "e2e": "playwright test",
  "sync:notion": "tsx scripts/sync-notion.ts"
}
```

**All npm dependencies are installed by Task 00.** Wave 1 tasks MUST NOT edit `package.json` or `package-lock.json`. If you need a package that is missing, stop and report it.

## 3. Content types — `src/app/core/content.models.ts`

```ts
export interface PostMeta {
  slug: string;            // kebab-case, = markdown filename without .md
  title: string;
  summary: string;         // ≤ 200 chars
  date: string;            // 'YYYY-MM-DD'
  updated?: string;        // 'YYYY-MM-DD'
  tags: string[];          // lowercase kebab-case, ≥ 1
  readingMinutes: number;  // ≥ 1
  cover?: string;          // '/images/...'
}

export interface TocItem {
  id: string;              // heading id attribute in Post.html
  text: string;
  depth: 2 | 3;
}

export interface Post extends PostMeta {
  html: string;            // rendered article body (no <h1>)
  toc: TocItem[];
}

export interface TagCount {
  tag: string;
  count: number;
}

export interface ContentIndex {
  generatedAt: string;     // ISO timestamp
  posts: PostMeta[];       // sorted by date desc, then slug asc; drafts excluded unless INCLUDE_DRAFTS=1
  tags: TagCount[];        // sorted by count desc, then tag asc
}

export interface Project {
  slug: string;
  title: string;
  summary: string;
  tech: string[];
  repo?: string;           // absolute URL
  url?: string;            // absolute URL
  image?: string;          // '/images/...'
  featured: boolean;
  order: number;           // ascending sort key
  date: string;            // 'YYYY-MM-DD'
}
```

### Generated JSON files (written to `public/content/`, served at `/content/...`)

| File | Type |
|---|---|
| `public/content/index.json` | `ContentIndex` |
| `public/content/posts/<slug>.json` | `Post` |
| `public/content/projects.json` | `Project[]` sorted by `order` asc |

### Post HTML shape (produced by Task 01, styled by Task 08)

- Raw HTML in Markdown is escaped (markdown-it `html: false`).
- `<h2>` and `<h3>` have `id` attributes matching `TocItem.id` (github-slugger, de-duplicated per post).
- Images get `loading="lazy"`.
- Code blocks are Shiki dual-theme output:
  `<pre class="shiki shiki-themes github-light github-dark" style="--shiki-light-bg:#fff;--shiki-dark-bg:#24292e;..." tabindex="0"><code><span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583">const</span>...</span></code></pre>`

### Frontmatter (validated by Task 01 with zod `.strict()` — unknown keys fail)

Blog (`content/blog/<slug>.md`):
```yaml
title: string            # required
summary: string          # required, ≤ 200 chars
date: YYYY-MM-DD         # required
updated: YYYY-MM-DD      # optional
tags: [kebab-case, ...]  # required, ≥ 1
draft: boolean           # optional, default false
cover: /images/...       # optional
```

Project (`content/projects/<slug>.md`):
```yaml
title: string            # required
summary: string          # required, ≤ 240 chars
tech: [string, ...]      # required, ≥ 1
repo: https://...        # optional
url: https://...         # optional
image: /images/...       # optional
featured: boolean        # optional, default false
order: integer           # required
date: YYYY-MM-DD         # required
```

## 4. Core Angular API (created by Task 00)

```ts
// src/app/core/content-loader.ts
export type ContentLoader = (path: string) => Promise<unknown>;     // path like 'index.json', 'posts/x.json'
export const CONTENT_LOADER: InjectionToken<ContentLoader>;
export function browserContentLoader(): ContentLoader;              // HttpClient GET /content/<path>

// src/app/core/content-loader.server.ts
export const serverContentLoader: ContentLoader;                    // reads <cwd>/public/content/<path>

// src/app/core/content.service.ts
@Injectable({ providedIn: 'root' })
export class ContentService {
  getIndex(): Promise<ContentIndex>;
  getPost(slug: string): Promise<Post>;      // rejects if missing
  getProjects(): Promise<Project[]>;
}

// src/app/core/content.resolvers.ts
export const indexResolver: ResolveFn<ContentIndex>;
export const projectsResolver: ResolveFn<Project[]>;
export const postResolver: ResolveFn<Post | RedirectCommand>;   // missing slug → RedirectCommand to /404

// src/app/core/seo.service.ts
export interface PageSeo {
  title: string;                         // page title; formatted as "<title> · Moris Maor Zakay" (home passes SITE.title → unchanged)
  description: string;
  path: string;                          // e.g. '/blog/my-post'
  image?: string;                        // site-relative, default SITE.defaultOgImage
  type?: 'website' | 'article';          // default 'website'
  publishedTime?: string;                // 'YYYY-MM-DD'
  modifiedTime?: string;
  tags?: string[];
  jsonLd?: Record<string, unknown>;
}
export function formatTitle(title: string): string;
@Injectable({ providedIn: 'root' })
export class SeoService { set(page: PageSeo): void; }

// src/app/core/analytics.service.ts
@Injectable({ providedIn: 'root' })
export class AnalyticsService { init(): void; }   // called once from App constructor
export const GOATCOUNTER_CODE: InjectionToken<string>; // added by Task 09; defaults to SITE.analytics.goatcounterCode

// src/app/shared/reveal/reveal.directive.ts
@Directive({ selector: '[appReveal]' })
export class RevealDirective { readonly revealDelay: InputSignal<number>; }  // ms, default 0

// src/app/core/site.config.ts  (no Angular imports — Node scripts import it)
export const SITE: { url; title; description; author; locale; cvPdfPath; profileImage; defaultOgImage; social: { github; linkedin; email }; analytics: { goatcounterCode } };

// src/app/core/cv.data.ts  (no Angular imports)
export interface Experience { role: string; company: string; location: string; start: string; end: string; bullets: string[]; }
export interface SkillGroup { name: string; items: string[]; }
export interface Education { degree: string; school: string; start: string; end: string; details: string; }
export interface Highlight { title: string; description: string; }
export interface Cv { name; headline; tagline; location; summary; experience: Experience[]; skills: SkillGroup[]; education: Education[]; languages: string[]; highlights: Highlight[]; }
export const CV: Cv;
```

### Test helpers — `src/testing/fixtures.ts` (Task 00)

```ts
export const FIXTURE_INDEX: ContentIndex;     // 3 posts, 6 tags
export const FIXTURE_POST: Post;              // slug 'angular-signals-in-practice', has toc + shiki code block
export const FIXTURE_PROJECTS: Project[];     // grimoire-cc-mmz (featured, order 1), moris-site (featured, order 2)
```
Fixture JSON lives in `src/testing/fixtures/content/` with the exact layout of `public/content/`.

## 5. Routes (`src/app/app.routes.ts`, Task 00)

| Path | Component (file → class, selector) | Resolve → component inputs |
|---|---|---|
| `''` | `pages/home/home-page.ts` → `HomePage`, `app-home-page` | `index: ContentIndex`, `projects: Project[]` |
| `about` | `pages/about/about-page.ts` → `AboutPage`, `app-about-page` | — |
| `projects` | `pages/projects/projects-page.ts` → `ProjectsPage`, `app-projects-page` | `projects: Project[]` |
| `blog` | `pages/blog-list/blog-list-page.ts` → `BlogListPage`, `app-blog-list-page` | `index: ContentIndex` |
| `blog/tags/:tag` | `pages/tag/tag-page.ts` → `TagPage`, `app-tag-page` | `index: ContentIndex`; route param → `tag: string` |
| `blog/:slug` | `pages/blog-post/blog-post-page.ts` → `BlogPostPage`, `app-blog-post-page` | `post: Post` |
| `404` | `pages/not-found/not-found-page.ts` → `NotFoundPage` | — |
| `**` | `NotFoundPage` | — |

Pages declare resolved data as `input.required<T>()` with the names above. Pages that depend on inputs call `SeoService.set` inside an `effect()`; static pages call it in the constructor.

### Per-page SEO values

| Page | title | description | path | extra |
|---|---|---|---|---|
| Home | `SITE.title` | `SITE.description` | `/` | `jsonLd` Person |
| About | `About` | `CV.summary` | `/about` | — |
| Projects | `Projects` | `Things I've built — side projects and open source.` | `/projects` | — |
| Blog | `Blog` | `Notes on what I'm learning: AI engineering, Angular, algorithms and more.` | `/blog` | — |
| Tag | `#<tag>` | `Posts tagged <tag>.` | `/blog/tags/<tag>` | — |
| Post | post.title | post.summary | `/blog/<slug>` | `type: 'article'`, `image: '/og/<slug>.png'`, `publishedTime`, `modifiedTime`, `tags`, `jsonLd` BlogPosting |
| 404 | `Page not found` | `This page does not exist.` | `/404` | — |

## 6. Shared components (stubs by Task 00, finished by owner task)

| Component | File | Inputs | Owner |
|---|---|---|---|
| `SiteHeader` (`app-site-header`) | `shared/layout/site-header/site-header.ts` | — | Task 03 |
| `SiteFooter` (`app-site-footer`) | `shared/layout/site-footer/site-footer.ts` | — | Task 03 |
| `PostCard` (`app-post-card`) | `shared/post-card/post-card.ts` | `post = input.required<PostMeta>()` | Task 07 |
| `ProjectCard` (`app-project-card`) | `shared/project-card/project-card.ts` | `project = input.required<Project>()` | Task 06 |

**View-transition name contract:** the post title element in `PostCard` and the `<h1>` in `BlogPostPage` both set `view-transition-name: post-title-<slug>`.

**Dates:** always format with `DatePipe`, `'mediumDate'`, timezone `'UTC'`, and append `'T00:00:00Z'` to the bare `YYYY-MM-DD` string (`{{ d + 'T00:00:00Z' | date: 'mediumDate' : 'UTC' }}`). Angular's DatePipe parses a bare `YYYY-MM-DD` as *local* midnight, which shows the previous day east of UTC. Keep `[attr.datetime]` as the bare date. Date tests pin `process.env['TZ'] = 'Asia/Jerusalem'` so the bug can't hide on UTC machines.

**In-page links:** never use bare `href="#id"` (the `<base href="/">` turns it into a link to home). Use `[routerLink]="[]" [fragment]="id"` or a click handler.

## 7. Global styles and CSS tokens (Task 00)

`src/styles.scss` uses, in order: `styles/tokens`, `styles/base`, `styles/typography`, `styles/utilities`, `styles/prose` (Task 08 owns), `styles/motion` (Task 10 owns).

Tokens (CSS custom properties on `:root`, dark values under `[data-theme='dark']` and `prefers-color-scheme: dark`):

- Colors: `--color-bg`, `--color-surface`, `--color-surface-2`, `--color-text`, `--color-muted`, `--color-border`, `--color-accent`, `--color-accent-2`, `--color-accent-contrast`, `--gradient-accent`
- Type: `--font-sans` (Inter Variable), `--font-mono` (JetBrains Mono)
- Space: `--space-1` 0.25rem, `--space-2` 0.5rem, `--space-3` 0.75rem, `--space-4` 1rem, `--space-5` 1.5rem, `--space-6` 2rem, `--space-7` 3rem, `--space-8` 4rem
- Radius: `--radius-sm` 6px, `--radius-md` 12px, `--radius-lg` 20px, `--radius-full` 999px
- Shadow: `--shadow-sm`, `--shadow-md`
- Layout: `--container-max` 72rem, `--prose-max` 46rem, `--header-height` 4rem
- Motion: `--duration-fast` 150ms, `--duration-base` 300ms, `--duration-slow` 600ms, `--ease-out`

Utility classes (Task 00, `_utilities.scss`): `.container`, `.text-gradient`, `.visually-hidden`, `.btn`, `.btn--primary`, `.btn--ghost`, `.chip`, `.chip--active`, `.section`, `.section__title`.

Theme attribute: `<html data-theme="light|dark">`, absent = follow OS. `localStorage` key: `theme`.

Reveal classes (Task 10): `.reveal`, `.reveal--pending`, `.reveal--visible`.

## 8. File ownership

A task may create/modify ONLY files it owns. Task 00 creates many stubs; ownership then passes to the listed task.

| Task | Owns |
|---|---|
| 00 Foundation | everything not listed below; after Wave 0 these are frozen: `package.json`, `package-lock.json`, `angular.json`, `tsconfig*.json`, `src/app/app.*`, `src/app/core/content*.ts`, `src/app/core/cv.data.ts`, `src/app/core/site.config.ts`, `src/testing/**`, `src/styles.scss`, `src/styles/_tokens.scss`, `_base.scss`, `_typography.scss`, `_utilities.scss`, `pages/not-found/**`, `vitest.scripts.config.ts`, `playwright.config.ts`, `.gitignore` |
| 01 Content pipeline | `scripts/build-content.ts`, `scripts/content/**` |
| 02 OG images | `scripts/build-og.ts`, `scripts/og/**` |
| 03 Shell | `shared/layout/**`, `core/theme.service.ts`, `core/theme.service.spec.ts`, `src/index.html` |
| 04 Home | `pages/home/**` |
| 05 About | `pages/about/**` |
| 06 Projects | `pages/projects/**`, `shared/project-card/**` |
| 07 Blog list & tags | `pages/blog-list/**`, `pages/tag/**`, `shared/post-card/**` |
| 08 Blog post | `pages/blog-post/**`, `src/styles/_prose.scss` |
| 09 SEO & analytics | `core/seo.service.ts`, `core/seo.service.spec.ts`, `core/analytics.service.ts`, `core/analytics.service.spec.ts` |
| 10 Motion | `shared/reveal/**`, `src/styles/_motion.scss` |
| 11 Notion sync | `scripts/sync-notion.ts`, `scripts/notion/**`, `.github/workflows/notion-sync.yml`, `.env.example`, `docs/notion-setup.md` |
| 12 Deploy & CI | `scripts/postbuild.ts`, `scripts/postbuild/**`, `.github/workflows/deploy.yml`, `.github/workflows/ci.yml`, `docs/deploy.md` |
| 13 Integration QA | `e2e/**`, `docs/qa-report.md`; may fix any file (runs alone, after Wave 1) |

Page paths above are relative to `src/app/`.
