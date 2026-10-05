# Moris Maor Zakay — personal site

Personal site and blog: a statically generated Angular app (SSG, prerendered to plain HTML) with a Markdown content pipeline. Posts and projects live as Markdown in `content/`; a build step turns them into JSON, OG images, RSS and a sitemap.

Requires Node 24 (`.nvmrc`).

## Commands

```bash
npm start        # content + dev server on http://localhost:4200 (drafts included)
npm run build    # content + OG images + production build -> dist/moris-site/browser
npm test         # unit tests (Angular + Vitest)
npm run test:scripts   # tests for the content pipeline in scripts/

INCLUDE_DRAFTS=1 npm run build && npm run e2e   # Playwright end-to-end tests (need the draft fixtures)
```

A bare `ng build` fails: the content JSON must be generated first. `npm run build` does that for you.

## Writing a post

Create `content/blog/<kebab-slug>.md`. The filename (without `.md`) is the URL slug: `/blog/<kebab-slug>`.

```yaml
---
title: My post title            # required
summary: One or two sentences.  # required, max 200 characters
date: 2026-10-05                # required, YYYY-MM-DD
updated: 2026-10-12             # optional, YYYY-MM-DD
tags: [angular, ai]             # required, at least one, lowercase kebab-case
draft: true                     # optional, default false
cover: /images/<slug>/cover.png # optional
---
```

Unknown frontmatter keys fail the build.

- `draft: true` keeps the post local: it shows up with `npm start` but is never built for production.
- Images go in `public/images/<slug>/` and are referenced as `/images/<slug>/x.png`.
- Use `##` and `###` headings; they form the table of contents. Do not use `#` (the title is the page's h1).
- Give code fences a language (```` ```ts ````) so they are highlighted.

You can also write in Notion and sync: see [docs/notion-setup.md](docs/notion-setup.md).

## Adding a project

Create `content/projects/<slug>.md`:

```yaml
---
title: Project name             # required
summary: What it is.            # required, max 240 characters
tech: [Angular, TypeScript]     # required, at least one
repo: https://github.com/...    # optional
url: https://...                # optional (live link)
image: /images/<slug>/shot.png  # optional
featured: true                  # optional, default false (featured projects appear on the home page)
order: 3                        # required, ascending sort key
date: 2026-10-05                # required, YYYY-MM-DD
---
```

## Deploying

Pushes to `main` deploy to GitHub Pages. See [docs/deploy.md](docs/deploy.md) for first-time setup and a custom domain.

## Before going live

- [ ] Replace the profile photo: add `public/profile.jpg` and set `SITE.profileImage` in `src/app/core/site.config.ts`.
- [ ] Put the CV at `public/cv.pdf`, and decide whether it should include a phone number (it is publicly downloadable).
- [ ] Set real dates on the projects in `content/projects/`.
- [ ] Publish the first real post (remove `draft: true`); the sample posts are drafts.
- [ ] Optional: set `SITE.analytics.goatcounterCode` in `src/app/core/site.config.ts` to enable cookie-free GoatCounter page views.

Implementation plan and contracts: [docs/plan/README.md](docs/plan/README.md).
