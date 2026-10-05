# Personal Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Moris Maor Zakay's personal-branding site (Home, About/CV, Projects, Blog) as a statically generated Angular app deployed to GitHub Pages, with Markdown posts and optional Notion sync.

**Architecture:** Angular (≥ 21, standalone, Signals, zoneless) prerendered with `@angular/ssr` `outputMode: "static"`. A Node content pipeline converts `content/**/*.md` into JSON under `public/content/`. Route resolvers load the JSON (from disk during prerender, over HTTP in the browser, shared via TransferState) and pass it to pages as signal inputs.

**Tech Stack:** Angular, TypeScript, SCSS, Vitest, Playwright + axe, tsx, gray-matter, zod, markdown-it, Shiki, Satori + resvg, @notionhq/client + notion-to-md, GitHub Actions, GitHub Pages.

**Spec:** [`docs/plan/spec.md`](spec.md) · **Contracts (names, types, ownership):** [`docs/plan/contracts.md`](contracts.md)

## Global Constraints

- Angular ≥ 21; standalone components only; `ChangeDetectionStrategy.OnPush` on every component; signal `input()`/`output()` (no `@Input`/`@Output` decorators); zoneless.
- Node 24 LTS; npm; commit `package-lock.json`.
- English UI copy only. No phone number anywhere on the site.
- SCSS + CSS custom properties from `src/styles/_tokens.scss`. No hard-coded colors in components; use tokens.
- Every animation/transition must be disabled under `prefers-reduced-motion: reduce`.
- WCAG AA contrast in both themes; visible `:focus-visible` ring; interactive targets ≥ 44×44px.
- Layout works at 360px wide with no horizontal scroll and 16px side gutters (`.container`).
- Dates: `DatePipe` `'mediumDate'` with timezone `'UTC'`, on `date + 'T00:00:00Z'` (bare YYYY-MM-DD parses as local midnight; see contracts §6).
- Never `href="#..."` for in-page links; use `routerLink` + `fragment`.
- `[innerHTML]` + `bypassSecurityTrustHtml` is allowed in exactly one place: the post body in `BlogPostPage`.
- Modify only files your task owns (see contracts §8). Do not edit `package.json`.
- TDD: write the failing test, watch it fail, implement, watch it pass, commit.
- Every task ends green: `npm test` and `npm run test:scripts` pass, `npm run build` succeeds.

## Waves

```
Wave 0 (sequential):  00 Foundation
Wave 1 (parallel):    01 02 03 04 05 06 07 08 09 10 11 12
Wave 2 (sequential):  13 Integration QA
```

| # | Task | File | Depends on |
|---|---|---|---|
| 00 | Foundation: scaffold, deps, contracts, stubs, fixtures, styles | [tasks/00-foundation.md](tasks/00-foundation.md) | — |
| 01 | Content pipeline (md → JSON, RSS, sitemap) | [tasks/01-content-pipeline.md](tasks/01-content-pipeline.md) | 00 |
| 02 | Open Graph images | [tasks/02-og-images.md](tasks/02-og-images.md) | 00 |
| 03 | Shell: header, footer, theme toggle | [tasks/03-shell-theme.md](tasks/03-shell-theme.md) | 00 |
| 04 | Home page | [tasks/04-home-page.md](tasks/04-home-page.md) | 00 |
| 05 | About page | [tasks/05-about-page.md](tasks/05-about-page.md) | 00 |
| 06 | Projects page + project card | [tasks/06-projects-page.md](tasks/06-projects-page.md) | 00 |
| 07 | Blog list, tag page, post card | [tasks/07-blog-list-tags.md](tasks/07-blog-list-tags.md) | 00 |
| 08 | Blog post page + prose styles | [tasks/08-blog-post-page.md](tasks/08-blog-post-page.md) | 00 |
| 09 | SEO meta, JSON-LD, analytics | [tasks/09-seo-analytics.md](tasks/09-seo-analytics.md) | 00 |
| 10 | Motion: reveal directive, view transitions | [tasks/10-motion.md](tasks/10-motion.md) | 00 |
| 11 | Notion sync script + workflow | [tasks/11-notion-sync.md](tasks/11-notion-sync.md) | 00 |
| 12 | Deploy & CI workflows, postbuild | [tasks/12-deploy-ci.md](tasks/12-deploy-ci.md) | 00 |
| 13 | Integration QA: e2e, axe, Lighthouse | [tasks/13-integration-qa.md](tasks/13-integration-qa.md) | all |

Wave 1 tasks are independent: each owns a disjoint set of files and only consumes what Task 00 created (stubs with final names and signatures, fixtures, tokens). They can run in any order or all at once.

## Running with sub-agents

1. Run **Task 00** alone. Review and merge it to `main`.
2. For each Wave 1 task, dispatch one sub-agent **in its own git worktree** (`isolation: "worktree"`), branch `task/NN-<name>`, with this prompt:

   > Implement `docs/plan/tasks/NN-<name>.md`. First read `docs/plan/README.md` (Global Constraints), `docs/plan/contracts.md`, and `docs/plan/spec.md`. Modify only files your task owns (contracts §8). Follow the steps in order using TDD. Run every verification command in the task and paste the output in your report. Commit on branch `task/NN-<name>`. Report: summary, files changed, test and build output, and any deviation from the contracts (with the reason).

3. Review each branch (tests green, ownership respected), then merge into `main`. Files are disjoint, so merges are conflict-free; a conflict means a task broke ownership.
4. Run **Task 13** after all Wave 1 branches are merged.

## Things Moris supplies (not blocking)

- `public/profile.jpg` (square, ≥ 512px). Then set `SITE.profileImage = '/profile.jpg'` in `src/app/core/site.config.ts`.
- Up-to-date CV PDF at `public/cv.pdf` (Task 00 copies the current one from `resume/`).
- Real dates for projects in `content/projects/*.md`.
- First real blog posts in `content/blog/` (sample posts ship as `draft: true`).
- GitHub repo `mnmz81.github.io`, Pages source = GitHub Actions (see `docs/deploy.md` from Task 12).
- Optional: GoatCounter code in `SITE.analytics.goatcounterCode`; Notion token/data source (see `docs/notion-setup.md` from Task 11).
