# Task 06: Projects page + ProjectCard

> Read first: `docs/plan/README.md` (Global Constraints), `docs/plan/contracts.md`, `docs/plan/spec.md`.

**Goal:** Build the Projects page (responsive grid) and finish the shared `ProjectCard` (title, summary, tech chips, repo/live links, hover lift).

**Wave:** 1 (parallel).

**Files:**
- Modify (replace stubs): `src/app/pages/projects/projects-page.{ts,html,scss}`; create `projects-page.spec.ts`
- Modify (replace stubs): `src/app/shared/project-card/project-card.{ts,html,scss}`; create `project-card.spec.ts`

**Interfaces:**
- Consumes (from Task 00): input `projects: Project[]` (already sorted by `order`), `Project` type, `SeoService.set`, `RevealDirective`, utility classes.
- Produces: `ProjectCard` keeps selector `app-project-card` and `project = input.required<Project>()` (Home page, Task 04, uses it).

---

### Step 1: ProjectCard (TDD)

- [ ] Create `src/app/shared/project-card/project-card.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import type { Project } from '../../core/content.models';
import { FIXTURE_PROJECTS } from '../../../testing/fixtures';
import { ProjectCard } from './project-card';

async function render(project: Project) {
  const fixture = TestBed.createComponent(ProjectCard);
  fixture.componentRef.setInput('project', project);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('ProjectCard', () => {
  it('renders title, summary and tech chips', async () => {
    const project = FIXTURE_PROJECTS[0];
    const el = await render(project);
    expect(el.querySelector('h3')?.textContent).toContain(project.title);
    expect(el.textContent).toContain(project.summary);
    expect([...el.querySelectorAll('.chip')].map((c) => c.textContent?.trim())).toEqual(project.tech);
  });

  it('renders repo and live links with accessible names', async () => {
    const project = FIXTURE_PROJECTS[1];
    const el = await render(project);
    const repo = el.querySelector(`a[href="${project.repo}"]`);
    const live = el.querySelector(`a[href="${project.url}"]`);
    expect(repo?.getAttribute('aria-label')).toBe(`Source code of ${project.title} on GitHub`);
    expect(live?.getAttribute('aria-label')).toBe(`Open ${project.title}`);
    expect(repo?.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('omits links that are not defined', async () => {
    const { repo: _r, url: _u, ...rest } = FIXTURE_PROJECTS[1];
    const el = await render(rest as Project);
    expect(el.querySelectorAll('a')).toHaveLength(0);
  });
});
```

- [ ] Run `npm test`. Expected: FAIL.

- [ ] Replace `src/app/shared/project-card/project-card.ts`:

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

- [ ] Replace `project-card.html`:

```html
<article class="project-card">
  @if (project().image) {
    <img class="project-card__image" [src]="project().image" alt="" loading="lazy" width="640" height="360" />
  }
  <h3 class="project-card__title">{{ project().title }}</h3>
  <p class="project-card__summary">{{ project().summary }}</p>
  <ul class="project-card__tech" aria-label="Technologies">
    @for (tech of project().tech; track tech) {
      <li class="chip">{{ tech }}</li>
    }
  </ul>
  @if (project().repo || project().url) {
    <div class="project-card__links">
      @if (project().repo) {
        <a
          class="btn btn--ghost"
          [href]="project().repo"
          target="_blank"
          rel="noopener noreferrer"
          [attr.aria-label]="'Source code of ' + project().title + ' on GitHub'"
        >Code</a>
      }
      @if (project().url) {
        <a
          class="btn btn--primary"
          [href]="project().url"
          target="_blank"
          rel="noopener noreferrer"
          [attr.aria-label]="'Open ' + project().title"
        >Live</a>
      }
    </div>
  }
</article>
```

- [ ] Replace `project-card.scss`:

```scss
:host {
  display: block;
}

.project-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  height: 100%;
  padding: var(--space-5);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
  transition:
    transform var(--duration-base) var(--ease-out),
    box-shadow var(--duration-base) var(--ease-out),
    border-color var(--duration-base) var(--ease-out);

  &:hover {
    transform: translateY(-4px);
    border-color: color-mix(in srgb, var(--color-accent) 50%, var(--color-border));
    box-shadow: var(--shadow-md);
  }
}

.project-card__image {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  border-radius: var(--radius-md);
}

.project-card__title {
  margin: 0;
}

.project-card__summary {
  flex: 1;
  margin: 0;
  color: var(--color-muted);
}

.project-card__tech {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.project-card__links {
  display: flex;
  gap: var(--space-2);
}
```

- [ ] Run `npm test`. Expected: PASS.

### Step 2: ProjectsPage (TDD)

- [ ] Create `src/app/pages/projects/projects-page.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { describe, expect, it } from 'vitest';
import type { Project } from '../../core/content.models';
import { FIXTURE_PROJECTS } from '../../../testing/fixtures';
import { ProjectsPage } from './projects-page';

async function render(projects: Project[]) {
  const fixture = TestBed.createComponent(ProjectsPage);
  fixture.componentRef.setInput('projects', projects);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('ProjectsPage', () => {
  it('renders a card per project in the given order', async () => {
    const el = await render(FIXTURE_PROJECTS);
    const titles = [...el.querySelectorAll('app-project-card h3')].map((h) => h.textContent?.trim());
    expect(titles).toEqual(FIXTURE_PROJECTS.map((p) => p.title));
  });

  it('shows an empty state with no projects', async () => {
    const el = await render([]);
    expect(el.querySelector('.projects__empty')?.textContent).toContain('Projects are on the way');
  });

  it('sets the title', async () => {
    await render(FIXTURE_PROJECTS);
    expect(TestBed.inject(Title).getTitle()).toBe('Projects · Moris Maor Zakay');
  });
});
```

- [ ] Run `npm test`. Expected: FAIL.

- [ ] Replace `src/app/pages/projects/projects-page.ts`:

```ts
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import type { Project } from '../../core/content.models';
import { SeoService } from '../../core/seo.service';
import { ProjectCard } from '../../shared/project-card/project-card';
import { RevealDirective } from '../../shared/reveal/reveal.directive';

@Component({
  selector: 'app-projects-page',
  imports: [ProjectCard, RevealDirective],
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

- [ ] Replace `projects-page.html`:

```html
<div class="container section">
  <header class="projects__intro" appReveal>
    <h1><span class="text-gradient">Projects</span></h1>
    <p class="projects__lead">Things I've built: side projects, open source and experiments.</p>
  </header>

  @if (projects().length) {
    <div class="projects__grid">
      @for (project of projects(); track project.slug; let i = $index) {
        <app-project-card [project]="project" appReveal [revealDelay]="(i % 3) * 100" />
      }
    </div>
  } @else {
    <p class="projects__empty">Projects are on the way.</p>
  }
</div>
```

- [ ] Replace `projects-page.scss`:

```scss
.projects__intro {
  margin-bottom: var(--space-7);
}

.projects__lead {
  max-width: var(--prose-max);
  color: var(--color-muted);
  font-size: 1.125rem;
}

.projects__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
  gap: var(--space-5);
}

.projects__empty {
  color: var(--color-muted);
}
```

- [ ] Run `npm test`. Expected: PASS.

### Step 3: Verify and commit

- [ ] Run `npm test` and `npm run build`. Expected: PASS; build succeeds.
- [ ] Commit:

```bash
git add src/app/pages/projects src/app/shared/project-card
git commit -m "feat(projects): projects grid and project card"
```
