# Task 00: Foundation

> Read first: `docs/plan/README.md` (Global Constraints), `docs/plan/contracts.md`, `docs/plan/spec.md`.

**Goal:** Create the Angular SSG project with every dependency installed, the shared contracts implemented (types, content loading, resolvers, routes, SEO/analytics/reveal stubs, card stubs, page stubs), design tokens and global styles, fixtures, and placeholder scripts, so all Wave 1 tasks can run in parallel.

**Wave:** 0 (runs alone, first).

**Files:** everything listed for Task 00 in contracts §8, plus the stub files owned later by other tasks (stubs only).

**Interfaces:**
- Consumes: nothing.
- Produces: everything in contracts §2–§7 with exactly those names and signatures.

---

### Step 1: Move CV files and init git

- [ ] Run from the project root (`my cv web/`):

```bash
mkdir -p resume
mv "Moris Maor Zakay Resume - Updated.docx" "Moris Maor Zakay Resume.pdf" resume/
git init -b main
```

### Step 2: Generate the Angular app in place

- [ ] Run:

```bash
npx @angular/cli@latest new moris-site --directory . --style=scss --ssr --routing --skip-git --package-manager=npm --defaults --interactive=false
```

Expected: `angular.json`, `src/app/app.ts`, `src/app/app.config.ts`, `src/app/app.config.server.ts`, `src/app/app.routes.ts`, `src/app/app.routes.server.ts`, `src/main.server.ts`, `src/server.ts` exist. If the CLI refuses the non-empty directory, generate into `/tmp/moris-site` and `rsync -a /tmp/moris-site/ ./` (do not overwrite `docs/` or `resume/`).

- [ ] Verify the CLI version is ≥ 21 and the test builder is Vitest:

```bash
npx ng version | head -20
grep -n '"builder"' angular.json
```

Expected: Angular ≥ 21; the `test` target builder is `@angular/build:unit-test`.

### Step 3: Install every dependency the whole plan needs

- [ ] Run:

```bash
npm i -D tsx vitest gray-matter zod markdown-it @types/markdown-it markdown-it-anchor github-slugger shiki satori @resvg/resvg-js @fontsource/inter @notionhq/client notion-to-md @playwright/test @axe-core/playwright http-server
npm i @fontsource-variable/inter @fontsource/jetbrains-mono
```

### Step 4: Project configuration

- [ ] `angular.json` → `projects.moris-site.architect.build.options`: add `"outputMode": "static"` and set `styles`:

```json
"styles": [
  "node_modules/@fontsource-variable/inter/index.css",
  "node_modules/@fontsource/jetbrains-mono/400.css",
  "src/styles.scss"
]
```

- [ ] `tsconfig.json` → `compilerOptions`: add `"resolveJsonModule": true` and `"esModuleInterop": true`.

- [ ] `package.json` → replace `scripts` with exactly the block in contracts §2 (keep `"ng": "ng"`).

- [ ] Create `.nvmrc`:

```
24
```

- [ ] Append to `.gitignore`:

```
# generated content
/public/content/
/public/og/
/public/rss.xml
/public/sitemap.xml
# secrets
.env
# playwright
/test-results/
/playwright-report/
```

- [ ] Create `vitest.scripts.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['scripts/**/*.test.ts'],
    environment: 'node',
  },
});
```

- [ ] Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  use: { baseURL: 'http://localhost:4300', trace: 'on-first-retry' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npx http-server dist/moris-site/browser -p 4300 -s -c-1',
    url: 'http://localhost:4300',
    reuseExistingServer: !process.env['CI'],
  },
});
```

- [ ] Copy the CV PDF and create placeholder images:

```bash
cp "resume/Moris Maor Zakay Resume.pdf" public/cv.pdf
```

`public/profile-placeholder.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="Moris Maor Zakay">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#4f46e5"/>
      <stop offset="1" stop-color="#0891b2"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="256" fill="url(#g)"/>
  <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-family="Inter, system-ui, sans-serif" font-size="200" font-weight="700" fill="#fff">MZ</text>
</svg>
```

`public/favicon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#4f46e5"/>
      <stop offset="1" stop-color="#0891b2"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="14" fill="url(#g)"/>
  <text x="50%" y="56%" text-anchor="middle" dominant-baseline="middle" font-family="system-ui, sans-serif" font-size="28" font-weight="700" fill="#fff">MZ</text>
</svg>
```

Delete `public/favicon.ico` if the CLI generated it.

### Step 5: Site config, CV data, content models

- [ ] Create `src/app/core/site.config.ts`:

```ts
// Framework-free: imported by Angular and by Node scripts in scripts/.
export const SITE = {
  url: 'https://mnmz81.github.io',
  title: 'Moris Maor Zakay',
  description:
    'Software engineer building full-stack products and agentic AI applications. Notes on AI, Angular, and what I learn along the way.',
  author: 'Moris Maor Zakay',
  locale: 'en',
  cvPdfPath: '/cv.pdf',
  profileImage: '/profile-placeholder.svg',
  defaultOgImage: '/og/default.png',
  social: {
    github: 'https://github.com/mnmz81',
    linkedin: 'https://www.linkedin.com/in/moris-maor-zakay',
    email: 'mailto:moriszakay42@gmail.com',
  },
  analytics: {
    goatcounterCode: '',
  },
} as const;
```

- [ ] Create `src/app/core/cv.data.ts`:

```ts
// Single source of truth for CV content. Framework-free.
export interface Experience {
  role: string;
  company: string;
  location: string;
  start: string;
  end: string;
  bullets: string[];
}

export interface SkillGroup {
  name: string;
  items: string[];
}

export interface Education {
  degree: string;
  school: string;
  start: string;
  end: string;
  details: string;
}

export interface Highlight {
  title: string;
  description: string;
}

export interface Cv {
  name: string;
  headline: string;
  tagline: string;
  location: string;
  summary: string;
  experience: Experience[];
  skills: SkillGroup[];
  education: Education[];
  languages: string[];
  highlights: Highlight[];
}

export const CV: Cv = {
  name: 'Moris Maor Zakay',
  headline: 'Software Engineer · Full-Stack & AI Application Development',
  tagline: 'I build full-stack products and production agentic AI features, and write about what I learn along the way.',
  location: 'Upper Galilee, Israel (open to hybrid)',
  summary:
    'Software engineer with 5+ years building enterprise product features at BMC Software (Control-M), including designing and shipping agentic AI capabilities in production. Built LLM-powered features with Google ADK and LiteLLM on AWS Bedrock (Claude), and improved their cost, latency, and reliability through prompt engineering, multi-agent orchestration, and LLM evaluation pipelines. Full-stack across Angular/TypeScript and Python. Pursuing an M.Sc. in Computer Science (ML focus).',
  experience: [
    {
      role: 'Software Engineer (Product Developer)',
      company: 'BMC Software',
      location: 'Kiryat Shmona',
      start: '2021',
      end: 'Present',
      bullets: [
        'Designed and shipped agentic AI capabilities in Control-M for enterprise customers, built with Google ADK and LiteLLM on AWS Bedrock (Claude); owned prompt design, tool and skill definitions, and streaming responses end to end.',
        'Significantly reduced token consumption, latency, and API cost through prompt optimization and sub-agent orchestration with isolated context.',
        'Built an LLM evaluation pipeline with LLM-as-judge scoring and RAG-based retrieval, improving response quality and catching regressions before release.',
        'Developed and maintained Angular 20+ features (Signals, RxJS, Nx) with Jest unit tests and Playwright e2e coverage, integrated with Python services via REST APIs.',
        'Containerized services with Docker and authored CI/CD pipelines in Jenkins and GitHub Actions, streamlining build and deployment.',
        'Owned features end to end with product and UX across global sites; wrote technical design docs, mentored and onboarded new developers, and served as a core code reviewer.',
      ],
    },
    {
      role: 'Software Developer Intern',
      company: 'Galcon',
      location: 'Kfar Blum',
      start: '2019',
      end: '2020',
      bullets: [
        'Built backend services in C# / .NET for hardware controllers using National Instruments (NI) SDKs.',
        'Extended the internal backend API layer used across product lines.',
      ],
    },
  ],
  skills: [
    { name: 'Languages', items: ['TypeScript / JavaScript', 'Python', 'Java', 'SQL'] },
    {
      name: 'AI / LLM',
      items: [
        'Agentic AI (Google ADK, LiteLLM)',
        'Claude via AWS Bedrock',
        'Prompt engineering',
        'Tool calling & agent skills',
        'Multi-agent orchestration',
        'RAG',
        'LLM evaluation (LLM-as-judge)',
        'Streaming responses',
        'Token/cost optimization',
      ],
    },
    {
      name: 'Frontend',
      items: ['Angular 20+ (standalone, Signals)', 'TypeScript', 'RxJS', 'Nx monorepo', 'SCSS', 'Bootstrap', 'Jest', 'Playwright'],
    },
    {
      name: 'DevOps / Cloud',
      items: ['Docker & docker-compose', 'Jenkins', 'GitHub Actions', 'AWS Bedrock', 'Git', 'GitHub', 'Bitbucket'],
    },
    {
      name: 'Practices',
      items: [
        'Agile/Scrum',
        'Code review',
        'Mentoring & onboarding',
        'Feature ownership',
        'Technical design docs',
        'Cross-site collaboration',
        'AI-assisted development (Claude Code, Cursor)',
      ],
    },
  ],
  education: [
    {
      degree: 'M.Sc. Computer Science',
      school: 'The Open University of Israel',
      start: '2023',
      end: 'Present',
      details:
        '38 credit points completed. Coursework: Algorithms for Massive Data, Data Mining, Image Processing, Brain-Inspired Computing Architectures, Advanced Topics in Algorithms, Research Seminar in Algorithms and Theory.',
    },
    {
      degree: 'B.Sc. Computer Science, GPA 87',
      school: 'Tel-Hai College',
      start: '2017',
      end: '2020',
      details:
        'Relevant coursework: Machine Learning & Pattern Recognition, Computer Vision, Computational Intelligence, Compilers, Signal Processing.',
    },
  ],
  languages: ['Hebrew (native)', 'English (fluent)'],
  highlights: [
    {
      title: 'Agentic AI in production',
      description: 'Designed and shipped agentic AI capabilities in Control-M with Google ADK and LiteLLM on AWS Bedrock (Claude).',
    },
    {
      title: 'Faster, cheaper LLM features',
      description: 'Cut token use, latency and API cost through prompt optimization and sub-agent orchestration with isolated context.',
    },
    {
      title: 'LLM evaluation pipeline',
      description: 'Built LLM-as-judge scoring with RAG-based retrieval to raise response quality and catch regressions before release.',
    },
  ],
};
```

- [ ] Create `src/app/core/content.models.ts` with the exact code block from contracts §3.

### Step 6: Fixtures and sample content

- [ ] Create `src/testing/fixtures/content/index.json`:

```json
{
  "generatedAt": "2026-10-04T00:00:00.000Z",
  "posts": [
    {
      "slug": "building-agents-with-google-adk",
      "title": "Building agents with Google ADK",
      "summary": "What I learned shipping an agentic AI feature to production: tools, skills, streaming and keeping costs down.",
      "date": "2026-09-20",
      "tags": ["ai", "agents"],
      "readingMinutes": 6
    },
    {
      "slug": "angular-signals-in-practice",
      "title": "Angular Signals in practice",
      "summary": "How signals, computed values and effects changed the way I structure state in Angular apps.",
      "date": "2026-08-30",
      "tags": ["angular", "frontend"],
      "readingMinutes": 4
    },
    {
      "slug": "notes-on-streaming-algorithms",
      "title": "Notes on streaming algorithms",
      "summary": "Count-Min Sketch and reservoir sampling, from my M.Sc. course on algorithms for massive data.",
      "date": "2026-07-15",
      "tags": ["algorithms", "msc"],
      "readingMinutes": 5
    }
  ],
  "tags": [
    { "tag": "agents", "count": 1 },
    { "tag": "ai", "count": 1 },
    { "tag": "algorithms", "count": 1 },
    { "tag": "angular", "count": 1 },
    { "tag": "frontend", "count": 1 },
    { "tag": "msc", "count": 1 }
  ]
}
```

- [ ] Create `src/testing/fixtures/content/posts/angular-signals-in-practice.json`:

```json
{
  "slug": "angular-signals-in-practice",
  "title": "Angular Signals in practice",
  "summary": "How signals, computed values and effects changed the way I structure state in Angular apps.",
  "date": "2026-08-30",
  "tags": ["angular", "frontend"],
  "readingMinutes": 4,
  "html": "<p>Signals changed how I think about state in Angular.</p>\n<h2 id=\"why-signals\">Why signals</h2>\n<p>A signal is a value that notifies consumers when it changes.</p>\n<pre class=\"shiki shiki-themes github-light github-dark\" style=\"--shiki-light-bg:#fff;--shiki-dark-bg:#24292e\" tabindex=\"0\"><code><span class=\"line\"><span style=\"--shiki-light:#D73A49;--shiki-dark:#F97583\">const</span><span style=\"--shiki-light:#24292E;--shiki-dark:#E1E4E8\"> count </span><span style=\"--shiki-light:#D73A49;--shiki-dark:#F97583\">=</span><span style=\"--shiki-light:#6F42C1;--shiki-dark:#B392F0\"> signal</span><span style=\"--shiki-light:#24292E;--shiki-dark:#E1E4E8\">(</span><span style=\"--shiki-light:#005CC5;--shiki-dark:#79B8FF\">0</span><span style=\"--shiki-light:#24292E;--shiki-dark:#E1E4E8\">);</span></span></code></pre>\n<h3 id=\"computed-values\">Computed values</h3>\n<p>Derived state stays in sync without manual subscriptions.</p>\n<h2 id=\"takeaways\">Takeaways</h2>\n<ul>\n<li>Prefer <code>computed</code> over effects for derived state.</li>\n</ul>",
  "toc": [
    { "id": "why-signals", "text": "Why signals", "depth": 2 },
    { "id": "computed-values", "text": "Computed values", "depth": 3 },
    { "id": "takeaways", "text": "Takeaways", "depth": 2 }
  ]
}
```

- [ ] Create `src/testing/fixtures/content/posts/building-agents-with-google-adk.json`:

```json
{
  "slug": "building-agents-with-google-adk",
  "title": "Building agents with Google ADK",
  "summary": "What I learned shipping an agentic AI feature to production: tools, skills, streaming and keeping costs down.",
  "date": "2026-09-20",
  "tags": ["ai", "agents"],
  "readingMinutes": 6,
  "html": "<p>Notes from shipping an agent to enterprise customers.</p>\n<h2 id=\"tools-and-skills\">Tools and skills</h2>\n<p>Small, well-described tools beat one giant tool.</p>",
  "toc": [{ "id": "tools-and-skills", "text": "Tools and skills", "depth": 2 }]
}
```

- [ ] Create `src/testing/fixtures/content/posts/notes-on-streaming-algorithms.json`:

```json
{
  "slug": "notes-on-streaming-algorithms",
  "title": "Notes on streaming algorithms",
  "summary": "Count-Min Sketch and reservoir sampling, from my M.Sc. course on algorithms for massive data.",
  "date": "2026-07-15",
  "tags": ["algorithms", "msc"],
  "readingMinutes": 5,
  "html": "<p>Some data is too big to store. Streaming algorithms summarize it in one pass.</p>",
  "toc": []
}
```

- [ ] Create `src/testing/fixtures/content/projects.json`:

```json
[
  {
    "slug": "grimoire-cc-mmz",
    "title": "grimoire-cc-mmz",
    "summary": "A domain-based plugin marketplace for Claude Code that consolidates custom AI agents and skills for code review, debugging, UI/UX and bug hunting.",
    "tech": ["Python", "Shell", "GitHub Actions", "Claude Code"],
    "repo": "https://github.com/mnmz81/grimoire-cc-mmz",
    "featured": true,
    "order": 1,
    "date": "2026-09-01"
  },
  {
    "slug": "moris-site",
    "title": "This website",
    "summary": "My personal site and blog: a statically generated Angular app with a Markdown content pipeline and Notion sync.",
    "tech": ["Angular", "TypeScript", "SCSS", "GitHub Actions"],
    "repo": "https://github.com/mnmz81/mnmz81.github.io",
    "url": "https://mnmz81.github.io",
    "featured": true,
    "order": 2,
    "date": "2026-10-04"
  }
]
```

- [ ] Create `src/testing/fixtures.ts`:

```ts
import type { ContentIndex, Post, Project } from '../app/core/content.models';
import index from './fixtures/content/index.json';
import post from './fixtures/content/posts/angular-signals-in-practice.json';
import projects from './fixtures/content/projects.json';

export const FIXTURE_INDEX = index as unknown as ContentIndex;
export const FIXTURE_POST = post as unknown as Post;
export const FIXTURE_PROJECTS = projects as unknown as Project[];
```

- [ ] Create sample Markdown (inputs for Task 01). Posts are drafts so they never publish by accident.

`content/blog/angular-signals-in-practice.md`:

````markdown
---
title: Angular Signals in practice
summary: How signals, computed values and effects changed the way I structure state in Angular apps.
date: 2026-08-30
tags: [angular, frontend]
draft: true
---

Signals changed how I think about state in Angular.

## Why signals

A signal is a value that notifies consumers when it changes.

```ts
const count = signal(0);
```

### Computed values

Derived state stays in sync without manual subscriptions.

## Takeaways

- Prefer `computed` over effects for derived state.
````

`content/blog/building-agents-with-google-adk.md`:

```markdown
---
title: Building agents with Google ADK
summary: "What I learned shipping an agentic AI feature to production: tools, skills, streaming and keeping costs down."
date: 2026-09-20
tags: [ai, agents]
draft: true
---

Notes from shipping an agent to enterprise customers.

## Tools and skills

Small, well-described tools beat one giant tool.
```

`content/blog/notes-on-streaming-algorithms.md`:

```markdown
---
title: Notes on streaming algorithms
summary: Count-Min Sketch and reservoir sampling, from my M.Sc. course on algorithms for massive data.
date: 2026-07-15
tags: [algorithms, msc]
draft: true
---

Some data is too big to store. Streaming algorithms summarize it in one pass.
```

`content/projects/grimoire-cc-mmz.md`:

```markdown
---
title: grimoire-cc-mmz
summary: A domain-based plugin marketplace for Claude Code that consolidates custom AI agents and skills for code review, debugging, UI/UX and bug hunting.
tech: [Python, Shell, GitHub Actions, Claude Code]
repo: https://github.com/mnmz81/grimoire-cc-mmz
featured: true
order: 1
date: 2026-09-01
---
```

`content/projects/moris-site.md`:

```markdown
---
title: This website
summary: "My personal site and blog: a statically generated Angular app with a Markdown content pipeline and Notion sync."
tech: [Angular, TypeScript, SCSS, GitHub Actions]
repo: https://github.com/mnmz81/mnmz81.github.io
url: https://mnmz81.github.io
featured: true
order: 2
date: 2026-10-04
---
```

### Step 7: Placeholder scripts (replaced by Tasks 01, 02, 11, 12)

- [ ] `scripts/build-content.ts`:

```ts
// Placeholder from Task 00; Task 01 replaces this file with the real pipeline.
// Copies fixture JSON into public/content so the app builds before Task 01 lands.
import { cpSync, rmSync } from 'node:fs';

rmSync('public/content', { recursive: true, force: true });
cpSync('src/testing/fixtures/content', 'public/content', { recursive: true });
console.log('[content] placeholder: copied fixtures to public/content');
```

- [ ] `scripts/build-og.ts`:

```ts
// Placeholder from Task 00; Task 02 replaces this file.
console.log('[og] placeholder: skipped');
```

- [ ] `scripts/postbuild.ts`:

```ts
// Placeholder from Task 00; Task 12 replaces this file.
console.log('[postbuild] placeholder: skipped');
```

- [ ] `scripts/sync-notion.ts`:

```ts
// Placeholder from Task 00; Task 11 replaces this file.
console.error('[notion] not implemented yet');
process.exit(1);
```

- [ ] Run `npm run content`. Expected: `public/content/index.json` exists.

### Step 8: ContentService (TDD)

- [ ] Create `src/app/core/content-loader.ts`:

```ts
import { HttpClient } from '@angular/common/http';
import { InjectionToken, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

/** Loads a JSON file from the generated content folder, e.g. 'index.json' or 'posts/my-post.json'. */
export type ContentLoader = (path: string) => Promise<unknown>;

export const CONTENT_LOADER = new InjectionToken<ContentLoader>('CONTENT_LOADER');

export function browserContentLoader(): ContentLoader {
  const http = inject(HttpClient);
  return (path) => firstValueFrom(http.get<unknown>(`/content/${path}`));
}
```

- [ ] Create `src/app/core/content-loader.server.ts`:

```ts
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ContentLoader } from './content-loader';

// Prerender runs with cwd = project root, where `npm run content` wrote public/content.
export const serverContentLoader: ContentLoader = async (path) =>
  JSON.parse(await readFile(join(process.cwd(), 'public', 'content', path), 'utf8'));
```

- [ ] Write the failing test `src/app/core/content.service.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { TransferState, makeStateKey } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';
import { FIXTURE_INDEX, FIXTURE_POST, FIXTURE_PROJECTS } from '../../testing/fixtures';
import { CONTENT_LOADER } from './content-loader';
import { ContentService } from './content.service';

function setup() {
  const loader = vi.fn(async (path: string) => {
    if (path === 'index.json') return FIXTURE_INDEX;
    if (path === `posts/${FIXTURE_POST.slug}.json`) return FIXTURE_POST;
    if (path === 'projects.json') return FIXTURE_PROJECTS;
    throw new Error(`not found: ${path}`);
  });
  TestBed.configureTestingModule({ providers: [{ provide: CONTENT_LOADER, useValue: loader }] });
  return { service: TestBed.inject(ContentService), loader };
}

describe('ContentService', () => {
  it('loads the index', async () => {
    const { service, loader } = setup();
    expect(await service.getIndex()).toEqual(FIXTURE_INDEX);
    expect(loader).toHaveBeenCalledWith('index.json');
  });

  it('loads a post by slug', async () => {
    const { service } = setup();
    expect(await service.getPost(FIXTURE_POST.slug)).toEqual(FIXTURE_POST);
  });

  it('loads projects', async () => {
    const { service } = setup();
    expect(await service.getProjects()).toEqual(FIXTURE_PROJECTS);
  });

  it('caches results in TransferState', async () => {
    const { service, loader } = setup();
    await service.getIndex();
    await service.getIndex();
    expect(loader).toHaveBeenCalledTimes(1);
    expect(TestBed.inject(TransferState).get(makeStateKey('content:index.json'), null)).toEqual(FIXTURE_INDEX);
  });

  it('rejects when the file is missing', async () => {
    const { service } = setup();
    await expect(service.getPost('missing')).rejects.toThrow('not found');
  });
});
```

- [ ] Run `npm test`. Expected: FAIL (cannot resolve `./content.service`).

- [ ] Create `src/app/core/content.service.ts`:

```ts
import { Injectable, TransferState, inject, makeStateKey } from '@angular/core';
import { CONTENT_LOADER } from './content-loader';
import type { ContentIndex, Post, Project } from './content.models';

@Injectable({ providedIn: 'root' })
export class ContentService {
  private readonly load = inject(CONTENT_LOADER);
  private readonly state = inject(TransferState);

  getIndex(): Promise<ContentIndex> {
    return this.get<ContentIndex>('index.json');
  }

  getPost(slug: string): Promise<Post> {
    return this.get<Post>(`posts/${slug}.json`);
  }

  getProjects(): Promise<Project[]> {
    return this.get<Project[]>('projects.json');
  }

  private async get<T>(path: string): Promise<T> {
    const key = makeStateKey<T>(`content:${path}`);
    const cached = this.state.get(key, null);
    if (cached !== null) return cached;
    const data = (await this.load(path)) as T;
    this.state.set(key, data);
    return data;
  }
}
```

- [ ] Run `npm test`. Expected: PASS (5 tests).

### Step 9: Resolvers (TDD)

- [ ] Write the failing test `src/app/core/content.resolvers.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RedirectCommand, RouterStateSnapshot, convertToParamMap, provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { FIXTURE_INDEX, FIXTURE_POST, FIXTURE_PROJECTS } from '../../testing/fixtures';
import { CONTENT_LOADER } from './content-loader';
import { indexResolver, postResolver, projectsResolver } from './content.resolvers';

function setup() {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      {
        provide: CONTENT_LOADER,
        useValue: async (path: string) => {
          if (path === 'index.json') return FIXTURE_INDEX;
          if (path === 'projects.json') return FIXTURE_PROJECTS;
          if (path === `posts/${FIXTURE_POST.slug}.json`) return FIXTURE_POST;
          throw new Error('not found');
        },
      },
    ],
  });
}

const routeWith = (slug: string) => ({ paramMap: convertToParamMap({ slug }) }) as unknown as ActivatedRouteSnapshot;
const state = {} as RouterStateSnapshot;

describe('content resolvers', () => {
  it('indexResolver returns the index', async () => {
    setup();
    expect(await TestBed.runInInjectionContext(() => indexResolver(routeWith(''), state))).toEqual(FIXTURE_INDEX);
  });

  it('projectsResolver returns projects', async () => {
    setup();
    expect(await TestBed.runInInjectionContext(() => projectsResolver(routeWith(''), state))).toEqual(FIXTURE_PROJECTS);
  });

  it('postResolver returns the post', async () => {
    setup();
    expect(await TestBed.runInInjectionContext(() => postResolver(routeWith(FIXTURE_POST.slug), state))).toEqual(FIXTURE_POST);
  });

  it('postResolver redirects to /404 for a missing post', async () => {
    setup();
    const result = await TestBed.runInInjectionContext(() => postResolver(routeWith('missing'), state));
    expect(result).toBeInstanceOf(RedirectCommand);
    expect((result as RedirectCommand).redirectTo.toString()).toBe('/404');
  });
});
```

- [ ] Run `npm test`. Expected: FAIL (cannot resolve `./content.resolvers`).

- [ ] Create `src/app/core/content.resolvers.ts`:

```ts
import { inject } from '@angular/core';
import { RedirectCommand, ResolveFn, Router } from '@angular/router';
import type { ContentIndex, Post, Project } from './content.models';
import { ContentService } from './content.service';

export const indexResolver: ResolveFn<ContentIndex> = () => inject(ContentService).getIndex();

export const projectsResolver: ResolveFn<Project[]> = () => inject(ContentService).getProjects();

export const postResolver: ResolveFn<Post | RedirectCommand> = async (route) => {
  // Inject before the first await: the injection context ends there.
  const content = inject(ContentService);
  const router = inject(Router);
  try {
    return await content.getPost(route.paramMap.get('slug') ?? '');
  } catch {
    return new RedirectCommand(router.parseUrl('/404'));
  }
};
```

- [ ] Run `npm test`. Expected: PASS.

### Step 10: SEO, analytics, reveal stubs

- [ ] Write the failing test `src/app/core/seo.service.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { describe, expect, it } from 'vitest';
import { SeoService, formatTitle } from './seo.service';

describe('formatTitle', () => {
  it('keeps the site title unchanged', () => {
    expect(formatTitle('Moris Maor Zakay')).toBe('Moris Maor Zakay');
  });

  it('suffixes page titles with the site title', () => {
    expect(formatTitle('Blog')).toBe('Blog · Moris Maor Zakay');
  });
});

describe('SeoService', () => {
  it('sets the document title', () => {
    TestBed.inject(SeoService).set({ title: 'About', description: 'x', path: '/about' });
    expect(TestBed.inject(Title).getTitle()).toBe('About · Moris Maor Zakay');
  });
});
```

- [ ] Run `npm test`. Expected: FAIL.

- [ ] Create `src/app/core/seo.service.ts` (Task 09 extends it with meta tags):

```ts
import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { SITE } from './site.config';

export interface PageSeo {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  tags?: string[];
  jsonLd?: Record<string, unknown>;
}

export function formatTitle(title: string): string {
  return title === SITE.title ? title : `${title} · ${SITE.title}`;
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly titleService = inject(Title);

  set(page: PageSeo): void {
    this.titleService.setTitle(formatTitle(page.title));
  }
}
```

- [ ] Run `npm test`. Expected: PASS.

- [ ] Create `src/app/core/analytics.service.ts` (stub; Task 09 implements):

```ts
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  init(): void {
    // Implemented in Task 09.
  }
}
```

- [ ] Create `src/app/shared/reveal/reveal.directive.ts` (stub; Task 10 implements):

```ts
import { Directive, input } from '@angular/core';

/** Fades the host in when it scrolls into view. Stub: no-op until Task 10. */
@Directive({ selector: '[appReveal]' })
export class RevealDirective {
  readonly revealDelay = input(0);
}
```

### Step 11: App config, server config, routes

- [ ] Replace `src/app/app.config.ts`:

```ts
import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling, withViewTransitions } from '@angular/router';
import { routes } from './app.routes';
import { CONTENT_LOADER, browserContentLoader } from './core/content-loader';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withViewTransitions(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
    ),
    provideHttpClient(withFetch()),
    provideClientHydration(withEventReplay()),
    { provide: CONTENT_LOADER, useFactory: browserContentLoader },
  ],
};
```

- [ ] Edit `src/app/app.config.server.ts`: keep the generated `provideServerRendering(withRoutes(serverRoutes))` and add the server loader so the file reads:

```ts
import { ApplicationConfig, mergeApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { CONTENT_LOADER } from './core/content-loader';
import { serverContentLoader } from './core/content-loader.server';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    { provide: CONTENT_LOADER, useValue: serverContentLoader },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
```

- [ ] Replace `src/app/app.routes.server.ts`:

```ts
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
```

- [ ] Replace `src/app/app.routes.ts`:

```ts
import { Routes } from '@angular/router';
import { indexResolver, postResolver, projectsResolver } from './core/content.resolvers';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home-page').then((m) => m.HomePage),
    resolve: { index: indexResolver, projects: projectsResolver },
  },
  { path: 'about', loadComponent: () => import('./pages/about/about-page').then((m) => m.AboutPage) },
  {
    path: 'projects',
    loadComponent: () => import('./pages/projects/projects-page').then((m) => m.ProjectsPage),
    resolve: { projects: projectsResolver },
  },
  {
    path: 'blog',
    loadComponent: () => import('./pages/blog-list/blog-list-page').then((m) => m.BlogListPage),
    resolve: { index: indexResolver },
  },
  {
    path: 'blog/tags/:tag',
    loadComponent: () => import('./pages/tag/tag-page').then((m) => m.TagPage),
    resolve: { index: indexResolver },
  },
  {
    path: 'blog/:slug',
    loadComponent: () => import('./pages/blog-post/blog-post-page').then((m) => m.BlogPostPage),
    resolve: { post: postResolver },
  },
  { path: '404', loadComponent: () => import('./pages/not-found/not-found-page').then((m) => m.NotFoundPage) },
  { path: '**', loadComponent: () => import('./pages/not-found/not-found-page').then((m) => m.NotFoundPage) },
];
```

### Step 12: Shell stubs and root component

- [ ] `src/app/shared/layout/site-header/site-header.ts` (stub; Task 03 finishes):

```ts
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-site-header',
  imports: [RouterLink],
  templateUrl: './site-header.html',
  styleUrl: './site-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteHeader {}
```

`site-header.html`:

```html
<header class="container">
  <nav aria-label="Main">
    <a routerLink="/">Moris Maor Zakay</a>
    <a routerLink="/about">About</a>
    <a routerLink="/projects">Projects</a>
    <a routerLink="/blog">Blog</a>
  </nav>
</header>
```

`site-header.scss`: empty file.

- [ ] `src/app/shared/layout/site-footer/site-footer.ts` (stub; Task 03 finishes):

```ts
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-site-footer',
  templateUrl: './site-footer.html',
  styleUrl: './site-footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteFooter {
  protected readonly year = new Date().getFullYear();
}
```

`site-footer.html`:

```html
<footer class="container">© {{ year }} Moris Maor Zakay</footer>
```

`site-footer.scss`: empty file.

- [ ] Replace `src/app/app.ts`:

```ts
import { ChangeDetectionStrategy, Component, DOCUMENT, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AnalyticsService } from './core/analytics.service';
import { SiteFooter } from './shared/layout/site-footer/site-footer';
import { SiteHeader } from './shared/layout/site-header/site-header';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SiteHeader, SiteFooter],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly document = inject(DOCUMENT);

  constructor() {
    inject(AnalyticsService).init();
  }

  protected skipToMain(event: Event): void {
    event.preventDefault();
    this.document.getElementById('main')?.focus();
  }
}
```

(If `DOCUMENT` is not exported from `@angular/core` in your version, import it from `@angular/common`.)

- [ ] Replace `src/app/app.html`:

```html
<a class="skip-link" href="#main" (click)="skipToMain($event)">Skip to content</a>
<app-site-header />
<main id="main" tabindex="-1">
  <router-outlet />
</main>
<app-site-footer />
```

- [ ] Replace `src/app/app.scss`:

```scss
:host {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
}

main {
  flex: 1;
}
```

- [ ] Delete the generated `src/app/app.spec.ts` (it asserts the CLI welcome page).

- [ ] Replace `src/index.html` (Task 03 later adds the theme script):

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Moris Maor Zakay</title>
    <base href="/" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light dark" />
    <link rel="icon" type="image/svg+xml" href="favicon.svg" />
    <link rel="alternate" type="application/rss+xml" title="Moris Maor Zakay — Blog" href="/rss.xml" />
  </head>
  <body>
    <app-root></app-root>
  </body>
</html>
```

### Step 13: Card stubs

- [ ] `src/app/shared/post-card/post-card.ts` (Task 07 finishes):

```ts
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { PostMeta } from '../../core/content.models';

@Component({
  selector: 'app-post-card',
  imports: [RouterLink, DatePipe],
  templateUrl: './post-card.html',
  styleUrl: './post-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostCard {
  readonly post = input.required<PostMeta>();
}
```

`post-card.html`:

```html
<article class="post-card">
  <h3 class="post-card__title" [style.view-transition-name]="'post-title-' + post().slug">
    <a [routerLink]="['/blog', post().slug]">{{ post().title }}</a>
  </h3>
  <p class="post-card__meta">
    <time [attr.datetime]="post().date">{{ post().date | date: 'mediumDate' : 'UTC' }}</time>
    · {{ post().readingMinutes }} min read
  </p>
  <p class="post-card__summary">{{ post().summary }}</p>
</article>
```

`post-card.scss`: empty file.

- [ ] `src/app/shared/project-card/project-card.ts` (Task 06 finishes):

```ts
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { Project } from '../../core/content.models';

@Component({
  selector: 'app-project-card',
  templateUrl: './project-card.html',
  styleUrl: './project-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectCard {
  readonly project = input.required<Project>();
}
```

`project-card.html`:

```html
<article class="project-card">
  <h3>{{ project().title }}</h3>
  <p>{{ project().summary }}</p>
</article>
```

`project-card.scss`: empty file.

### Step 14: Page stubs

Each page gets `.ts`, `.html`, `.scss` (empty). The owning Wave 1 task replaces the template and adds a spec.

- [ ] `src/app/pages/home/home-page.ts`:

```ts
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import type { ContentIndex, Project } from '../../core/content.models';
import { CV } from '../../core/cv.data';
import { SeoService } from '../../core/seo.service';
import { SITE } from '../../core/site.config';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  readonly index = input.required<ContentIndex>();
  readonly projects = input.required<Project[]>();
  protected readonly cv = CV;

  constructor() {
    inject(SeoService).set({ title: SITE.title, description: SITE.description, path: '/' });
  }
}
```

`home-page.html`: `<section class="container"><h1>{{ cv.name }}</h1></section>`

- [ ] `src/app/pages/about/about-page.ts`:

```ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CV } from '../../core/cv.data';
import { SeoService } from '../../core/seo.service';

@Component({
  selector: 'app-about-page',
  templateUrl: './about-page.html',
  styleUrl: './about-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutPage {
  protected readonly cv = CV;

  constructor() {
    inject(SeoService).set({ title: 'About', description: CV.summary, path: '/about' });
  }
}
```

`about-page.html`: `<section class="container"><h1>About</h1></section>`

- [ ] `src/app/pages/projects/projects-page.ts`:

```ts
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import type { Project } from '../../core/content.models';
import { SeoService } from '../../core/seo.service';

@Component({
  selector: 'app-projects-page',
  templateUrl: './projects-page.html',
  styleUrl: './projects-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsPage {
  readonly projects = input.required<Project[]>();

  constructor() {
    inject(SeoService).set({
      title: 'Projects',
      description: "Things I've built — side projects and open source.",
      path: '/projects',
    });
  }
}
```

`projects-page.html`: `<section class="container"><h1>Projects</h1></section>`

- [ ] `src/app/pages/blog-list/blog-list-page.ts`:

```ts
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import type { ContentIndex } from '../../core/content.models';
import { SeoService } from '../../core/seo.service';

@Component({
  selector: 'app-blog-list-page',
  templateUrl: './blog-list-page.html',
  styleUrl: './blog-list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogListPage {
  readonly index = input.required<ContentIndex>();

  constructor() {
    inject(SeoService).set({
      title: 'Blog',
      description: "Notes on what I'm learning: AI engineering, Angular, algorithms and more.",
      path: '/blog',
    });
  }
}
```

`blog-list-page.html`: `<section class="container"><h1>Blog</h1></section>`

- [ ] `src/app/pages/tag/tag-page.ts`:

```ts
import { ChangeDetectionStrategy, Component, effect, inject, input } from '@angular/core';
import type { ContentIndex } from '../../core/content.models';
import { SeoService } from '../../core/seo.service';

@Component({
  selector: 'app-tag-page',
  templateUrl: './tag-page.html',
  styleUrl: './tag-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagPage {
  readonly index = input.required<ContentIndex>();
  readonly tag = input.required<string>();

  constructor() {
    const seo = inject(SeoService);
    effect(() => {
      const tag = this.tag();
      seo.set({ title: `#${tag}`, description: `Posts tagged ${tag}.`, path: `/blog/tags/${tag}` });
    });
  }
}
```

`tag-page.html`: `<section class="container"><h1>#{{ tag() }}</h1></section>`

- [ ] `src/app/pages/blog-post/blog-post-page.ts`:

```ts
import { ChangeDetectionStrategy, Component, effect, inject, input } from '@angular/core';
import type { Post } from '../../core/content.models';
import { SeoService } from '../../core/seo.service';

@Component({
  selector: 'app-blog-post-page',
  templateUrl: './blog-post-page.html',
  styleUrl: './blog-post-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogPostPage {
  readonly post = input.required<Post>();

  constructor() {
    const seo = inject(SeoService);
    effect(() => {
      const post = this.post();
      seo.set({
        title: post.title,
        description: post.summary,
        path: `/blog/${post.slug}`,
        type: 'article',
        image: `/og/${post.slug}.png`,
        publishedTime: post.date,
        modifiedTime: post.updated,
        tags: post.tags,
      });
    });
  }
}
```

`blog-post-page.html`: `<article class="container"><h1>{{ post().title }}</h1></article>`

- [ ] `src/app/pages/not-found/not-found-page.ts` (final, owned by Task 00):

```ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/seo.service';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink],
  templateUrl: './not-found-page.html',
  styleUrl: './not-found-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPage {
  constructor() {
    inject(SeoService).set({ title: 'Page not found', description: 'This page does not exist.', path: '/404' });
  }
}
```

`not-found-page.html`:

```html
<section class="container not-found">
  <p class="not-found__code text-gradient" aria-hidden="true">404</p>
  <h1>Page not found</h1>
  <p>The page you are looking for does not exist or has moved.</p>
  <a class="btn btn--primary" routerLink="/">Back to home</a>
</section>
```

`not-found-page.scss`:

```scss
.not-found {
  display: grid;
  justify-items: start;
  gap: var(--space-4);
  padding-block: var(--space-8);
}

.not-found__code {
  margin: 0;
  font-size: clamp(4rem, 15vw, 8rem);
  font-weight: 800;
  line-height: 1;
}
```

### Step 15: Global styles

- [ ] `src/styles.scss`:

```scss
@use 'styles/tokens';
@use 'styles/base';
@use 'styles/typography';
@use 'styles/utilities';
@use 'styles/prose';
@use 'styles/motion';
```

- [ ] `src/styles/_tokens.scss`:

```scss
@mixin light {
  --color-bg: #fafafa;
  --color-surface: #ffffff;
  --color-surface-2: #f1f5f9;
  --color-text: #0f172a;
  --color-muted: #475569;
  --color-border: #e2e8f0;
  --color-accent: #4f46e5;
  --color-accent-2: #0891b2;
  --color-accent-contrast: #ffffff;
  --shadow-sm: 0 1px 2px rgb(15 23 42 / 0.06);
  --shadow-md: 0 12px 32px rgb(15 23 42 / 0.1);
  color-scheme: light;
}

@mixin dark {
  --color-bg: #0b0f19;
  --color-surface: #111827;
  --color-surface-2: #1f2937;
  --color-text: #e5e7eb;
  --color-muted: #9ca3af;
  --color-border: #1f2937;
  --color-accent: #818cf8;
  --color-accent-2: #22d3ee;
  --color-accent-contrast: #0b0f19;
  --shadow-sm: 0 1px 2px rgb(0 0 0 / 0.4);
  --shadow-md: 0 12px 32px rgb(0 0 0 / 0.5);
  color-scheme: dark;
}

:root {
  @include light;
  --gradient-accent: linear-gradient(135deg, var(--color-accent), var(--color-accent-2));
  --font-sans: 'Inter Variable', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.5rem;
  --space-6: 2rem;
  --space-7: 3rem;
  --space-8: 4rem;
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 20px;
  --radius-full: 999px;
  --container-max: 72rem;
  --prose-max: 46rem;
  --header-height: 4rem;
  --duration-fast: 150ms;
  --duration-base: 300ms;
  --duration-slow: 600ms;
  --ease-out: cubic-bezier(0.2, 0.8, 0.2, 1);
}

:root[data-theme='dark'] {
  @include dark;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    @include dark;
  }
}
```

- [ ] `src/styles/_base.scss`:

```scss
*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  -webkit-text-size-adjust: 100%;
  scroll-padding-top: calc(var(--header-height) + var(--space-4));
}

body {
  margin: 0;
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-sans);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  transition:
    background-color var(--duration-base) var(--ease-out),
    color var(--duration-base) var(--ease-out);
}

img,
svg {
  display: block;
  max-width: 100%;
  height: auto;
}

a {
  color: var(--color-accent);
  text-underline-offset: 0.2em;
}

:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 3px;
  border-radius: var(--radius-sm);
}

main:focus {
  outline: none;
}

.skip-link {
  position: absolute;
  top: -100%;
  left: var(--space-4);
  z-index: 100;
  padding: var(--space-2) var(--space-4);
  background: var(--color-surface);
  color: var(--color-text);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-md);

  &:focus {
    top: var(--space-4);
  }
}
```

- [ ] `src/styles/_typography.scss`:

```scss
h1,
h2,
h3,
h4 {
  margin: 0 0 var(--space-4);
  line-height: 1.2;
  letter-spacing: -0.02em;
  font-weight: 700;
}

h1 {
  font-size: clamp(2.25rem, 5vw + 1rem, 3.75rem);
}

h2 {
  font-size: clamp(1.5rem, 2vw + 1rem, 2.25rem);
}

h3 {
  font-size: 1.25rem;
}

p {
  margin: 0 0 var(--space-4);
}

code,
pre,
kbd {
  font-family: var(--font-mono);
  font-size: 0.9em;
}
```

- [ ] `src/styles/_utilities.scss`:

```scss
.container {
  width: min(100% - 2rem, var(--container-max));
  margin-inline: auto;
}

.section {
  padding-block: var(--space-7);
}

.section__title {
  margin-bottom: var(--space-5);
}

.text-gradient {
  background: var(--gradient-accent);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: 44px;
  padding: var(--space-2) var(--space-5);
  border: 1px solid transparent;
  border-radius: var(--radius-full);
  font: inherit;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition:
    transform var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out),
    background-color var(--duration-fast) var(--ease-out);

  &:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
}

.btn--primary {
  background: var(--color-accent);
  color: var(--color-accent-contrast);
}

.btn--ghost {
  background: transparent;
  color: var(--color-text);
  border-color: var(--color-border);
}

.chip {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-surface);
  color: var(--color-muted);
  font-size: 0.875rem;
  text-decoration: none;
}

a.chip {
  min-height: 44px;

  &:hover {
    color: var(--color-text);
    border-color: var(--color-accent);
  }
}

.chip--active {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: var(--color-accent-contrast);
}
```

- [ ] `src/styles/_prose.scss` (Task 08 owns):

```scss
// Article body styles. Implemented in Task 08.
```

- [ ] `src/styles/_motion.scss` (Task 10 owns):

```scss
// Reveal, view-transition and reduced-motion styles. Implemented in Task 10.
```

### Step 16: Verify and commit

- [ ] Run unit tests:

```bash
npm test
npm run test:scripts -- --passWithNoTests
```

Expected: all app tests PASS; scripts runner exits 0 with no tests.

- [ ] Run the build:

```bash
npm run build
```

Expected: success. Then:

```bash
ls dist/moris-site/browser/index.html dist/moris-site/browser/about/index.html dist/moris-site/browser/projects/index.html dist/moris-site/browser/blog/index.html dist/moris-site/browser/blog/angular-signals-in-practice/index.html dist/moris-site/browser/blog/tags/angular/index.html dist/moris-site/browser/404/index.html
grep -c "Angular Signals in practice" dist/moris-site/browser/blog/angular-signals-in-practice/index.html
```

Expected: all files listed; grep count ≥ 1 (title prerendered into HTML).

- [ ] Smoke-run the dev server: `npm start`, open `http://localhost:4200/blog/angular-signals-in-practice`, confirm the title renders; stop the server.

- [ ] Commit:

```bash
git add -A
git commit -m "chore: scaffold Angular SSG site with content contracts, stubs and tokens"
```
