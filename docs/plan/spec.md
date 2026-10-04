# Personal Site — Design Spec

**Owner:** Moris Maor Zakay · **Date:** 2026-10-04 · **Status:** Approved design

## 1. Purpose

A personal-branding website based on Moris's CV (Software Engineer, Full-Stack & AI Application Development) with a **Blog** where he publishes posts about things he is learning. Audience: recruiters, hiring managers, and engineers. Success = a fast, polished, accessible site that presents the CV well and makes publishing a post as easy as writing Markdown (or writing in Notion and syncing).

## 2. Decisions (locked)

| Topic | Decision |
|---|---|
| Language | English only (LTR) |
| Framework | Angular (latest stable, ≥ 21): standalone components, Signals, zoneless, OnPush |
| Rendering | Static Site Generation via `@angular/ssr` with `outputMode: "static"` (every route prerendered to HTML) |
| Content | Markdown files in the repo are the source of truth (`content/blog`, `content/projects`) |
| Content pipeline | Node build script (`scripts/build-content.ts`) turns Markdown into JSON consumed by Angular |
| Notion | Optional writing tool. `npm run sync:notion` + a manual GitHub Actions workflow that opens a PR with synced Markdown |
| Styling | SCSS + CSS custom properties (design tokens); no CSS framework |
| Visual style | Modern with animations: gradient accents, animated hero, reveal-on-scroll, route view transitions, card hover motion. Every motion honors `prefers-reduced-motion` |
| Theme | Light + dark with a toggle; default follows the OS; choice persisted in `localStorage` |
| Pages | Home, About (CV), Projects, Blog (list, tag pages, post page), 404 |
| Blog features | Post list, tags with tag pages and filter chips, syntax-highlighted code (Shiki, dual theme), reading time, table of contents, RSS, drafts. No comments, no search (add Pagefind later at ~15+ posts) |
| Extras | Profile photo (placeholder until supplied), CV PDF download, auto-generated Open Graph image per post, sitemap, SEO meta + JSON-LD, privacy-friendly analytics (GoatCounter, off until configured) |
| Privacy | No phone number on the site. Email, GitHub, LinkedIn only |
| Hosting | GitHub Pages via GitHub Actions; repo `mnmz81.github.io` → `https://mnmz81.github.io`. Custom domain later = change `SITE.url` + add `public/CNAME` |
| Testing | Angular CLI default unit runner (Vitest) for app code; Vitest for Node scripts; Playwright (+ axe) for e2e |

## 3. Architecture

```
content/*.md ──► scripts/build-content.ts ──► public/content/*.json ──► Angular (resolvers → page inputs)
                      │                              │
                      ├─► public/rss.xml             └─► app.routes.server.ts getPrerenderParams()
                      └─► public/sitemap.xml                 (one static page per post / tag)
public/content/index.json ──► scripts/build-og.ts ──► public/og/<slug>.png
Notion DB ──► scripts/sync-notion.ts ──► content/*.md + public/images/<slug>/*
```

- **Data loading:** `ContentService` loads JSON through an injectable `CONTENT_LOADER`. In the browser it uses `HttpClient` (`/content/<path>`); during prerender it reads `public/content/<path>` from disk. Results are stored in `TransferState` so hydration does not refetch.
- **Routing:** route resolvers fetch content; pages receive it as signal inputs via `withComponentInputBinding()`. A missing post redirects to `/404`.
- **Prerender:** `app.routes.server.ts` reads `public/content/index.json` to enumerate post slugs and tags.
- **Single source for CV data:** `src/app/core/cv.data.ts`. Site-wide settings: `src/app/core/site.config.ts` (framework-free so Node scripts can import it).
- **Generated files are not committed:** `public/content/`, `public/og/`, `public/rss.xml`, `public/sitemap.xml` are build outputs.

## 4. Pages

- **Home** — Hero (name with gradient, headline, tagline, profile photo, CTAs: "Read the blog", "Download CV", social icons) over animated gradient blobs; 3 career highlight cards; latest 3 posts (hidden if none); featured projects.
- **About** — Summary, experience timeline, skills grouped as chips, education, languages, download CV.
- **Projects** — Responsive grid of project cards (title, summary, tech chips, repo/live links).
- **Blog** — Intro, tag filter chips (with counts), post cards, empty state ("First posts are on the way").
- **Tag page** (`/blog/tags/:tag`) — Posts with that tag, back link, empty state for unknown tags.
- **Post** (`/blog/:slug`) — Title (shared-element view transition from its card), date, reading time, tags, TOC (sticky sidebar on desktop, collapsible on mobile), article body with prose styling and dual-theme code blocks.
- **404** — Friendly message + link home. Copied to `404.html` for GitHub Pages.

## 5. Content model

Blog frontmatter: `title`, `summary` (≤ 200 chars), `date` (YYYY-MM-DD), optional `updated`, `tags` (≥ 1, lowercase kebab-case), `draft` (default false), optional `cover`. Slug = filename. Projects frontmatter: `title`, `summary`, `tech[]`, optional `repo`/`url`/`image`, `featured`, `order`, `date`. Invalid frontmatter fails the build with the file name. Drafts are excluded unless `INCLUDE_DRAFTS=1` (set automatically by `npm start`). Exact types live in `docs/plan/contracts.md`.

## 6. Notion integration

Notion database with properties `Title`, `Slug`, `Type` (Blog/Project), `Status` (Notion *Status* type: Draft/Published), `Tags`, `Date`, `Summary`, `Tech`, `Repo`, `URL`, `Featured`, `Order`. The sync pulls only `Published` pages, converts them with `notion-to-md`, downloads images into `public/images/<slug>/` (Notion image URLs expire after ~1 hour), and writes `content/blog|projects/<slug>.md`. Create/update only; it never deletes files. Runs locally (`.env`) or via the manual "Notion sync" workflow, which opens a PR.

## 7. Deployment

`deploy.yml`: push to `main` → install → unit tests → `npm run build` (content → OG images → `ng build` → postbuild copies 404 and verifies output) → GitHub Pages. `ci.yml` runs tests + build on pull requests.

## 8. Quality bars

- Lighthouse (desktop, home + a post): Performance ≥ 95, Accessibility ≥ 95, Best Practices ≥ 95, SEO = 100.
- WCAG AA contrast in both themes; visible focus rings; keyboard-operable menu and toggle; 44×44px touch targets; skip link.
- No horizontal scroll at 360px width; 16px side gutters.
- Unit tests for every service, resolver, directive, component and script module; e2e for main flows plus an axe scan per page.

## 9. Out of scope (v1)

Comments, search, newsletter, i18n/Hebrew, project detail pages, copy-code buttons, post series, CMS other than Notion.
