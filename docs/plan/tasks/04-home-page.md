# Task 04: Home page

> Read first: `docs/plan/README.md` (Global Constraints), `docs/plan/contracts.md`, `docs/plan/spec.md`.

**Goal:** Build the Home page: animated hero (gradient name, headline, tagline, profile photo, CTAs, social links), career highlights, latest posts, featured projects.

**Wave:** 1 (parallel).

**Files:**
- Modify (replace stubs): `src/app/pages/home/home-page.ts`, `home-page.html`, `home-page.scss`
- Test: `src/app/pages/home/home-page.spec.ts`

**Interfaces:**
- Consumes (from Task 00): inputs `index: ContentIndex`, `projects: Project[]` (route resolvers); `CV`, `SITE`; `SeoService.set(PageSeo)`; `PostCard` (`app-post-card`, input `post`); `ProjectCard` (`app-project-card`, input `project`); `RevealDirective` (`appReveal`, input `revealDelay`); utility classes `.container .section .section__title .btn .btn--primary .btn--ghost .text-gradient`.
- Produces: nothing other tasks consume.

Card internals are owned by Tasks 06/07; use them as-is. The reveal directive is a no-op stub until Task 10 lands; just apply it.

---

### Step 1: Write the failing test

- [ ] Create `src/app/pages/home/home-page.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ContentIndex, Project } from '../../core/content.models';
import { CV } from '../../core/cv.data';
import { FIXTURE_INDEX, FIXTURE_PROJECTS } from '../../../testing/fixtures';
import { HomePage } from './home-page';

async function render(index: ContentIndex = FIXTURE_INDEX, projects: Project[] = FIXTURE_PROJECTS) {
  const fixture = TestBed.createComponent(HomePage);
  fixture.componentRef.setInput('index', index);
  fixture.componentRef.setInput('projects', projects);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('HomePage', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter([])] }));

  it('renders the hero with name, headline and tagline', async () => {
    const el = await render();
    expect(el.querySelector('h1')?.textContent).toContain(CV.name);
    expect(el.textContent).toContain(CV.headline);
    expect(el.textContent).toContain(CV.tagline);
    expect(el.querySelector('.hero__photo')?.getAttribute('alt')).toBe(`Portrait of ${CV.name}`);
  });

  it('links to the blog and the CV download', async () => {
    const el = await render();
    expect(el.querySelector('a[href="/blog"]')).not.toBeNull();
    const cv = el.querySelector('a[href="/cv.pdf"]');
    expect(cv?.hasAttribute('download')).toBe(true);
  });

  it('renders the three highlights', async () => {
    const el = await render();
    expect(el.querySelectorAll('.highlight')).toHaveLength(3);
  });

  it('shows at most three latest posts', async () => {
    const many = { ...FIXTURE_INDEX, posts: [...FIXTURE_INDEX.posts, { ...FIXTURE_INDEX.posts[0], slug: 'extra' }] };
    const el = await render(many);
    expect(el.querySelectorAll('app-post-card')).toHaveLength(3);
  });

  it('hides the posts section when there are no posts', async () => {
    const el = await render({ ...FIXTURE_INDEX, posts: [], tags: [] });
    expect(el.querySelector('#latest-posts')).toBeNull();
  });

  it('shows only featured projects', async () => {
    const projects = [...FIXTURE_PROJECTS, { ...FIXTURE_PROJECTS[0], slug: 'hidden', featured: false }];
    const el = await render(FIXTURE_INDEX, projects);
    expect(el.querySelectorAll('app-project-card')).toHaveLength(2);
  });

  it('sets the page title', async () => {
    await render();
    expect(TestBed.inject(Title).getTitle()).toBe('Moris Maor Zakay');
  });
});
```

- [ ] Run `npm test`. Expected: FAIL (hero elements not found).

### Step 2: Implement the component

- [ ] Replace `src/app/pages/home/home-page.ts`:

```ts
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { ContentIndex, Project } from '../../core/content.models';
import { CV } from '../../core/cv.data';
import { SeoService } from '../../core/seo.service';
import { SITE } from '../../core/site.config';
import { PostCard } from '../../shared/post-card/post-card';
import { ProjectCard } from '../../shared/project-card/project-card';
import { RevealDirective } from '../../shared/reveal/reveal.directive';

const LATEST_POSTS = 3;

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, PostCard, ProjectCard, RevealDirective],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  readonly index = input.required<ContentIndex>();
  readonly projects = input.required<Project[]>();

  protected readonly cv = CV;
  protected readonly site = SITE;
  protected readonly latestPosts = computed(() => this.index().posts.slice(0, LATEST_POSTS));
  protected readonly featuredProjects = computed(() => this.projects().filter((p) => p.featured));

  constructor() {
    inject(SeoService).set({
      title: SITE.title,
      description: SITE.description,
      path: '/',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: CV.name,
        jobTitle: 'Software Engineer',
        url: SITE.url,
        sameAs: [SITE.social.github, SITE.social.linkedin],
      },
    });
  }
}
```

- [ ] Replace `home-page.html`:

```html
<section class="hero">
  <div class="hero__bg" aria-hidden="true">
    <span class="hero__blob hero__blob--one"></span>
    <span class="hero__blob hero__blob--two"></span>
  </div>

  <div class="container hero__inner">
    <div class="hero__text">
      <p class="hero__eyebrow hero__line" style="--i: 0">Hi, I'm</p>
      <h1 class="hero__name hero__line" style="--i: 1"><span class="text-gradient">{{ cv.name }}</span></h1>
      <p class="hero__headline hero__line" style="--i: 2">{{ cv.headline }}</p>
      <p class="hero__tagline hero__line" style="--i: 3">{{ cv.tagline }}</p>

      <div class="hero__actions hero__line" style="--i: 4">
        <a class="btn btn--primary" routerLink="/blog">Read the blog</a>
        <a class="btn btn--ghost" [href]="site.cvPdfPath" download="Moris-Maor-Zakay-CV.pdf">Download CV</a>
      </div>

      <ul class="hero__social hero__line" style="--i: 5">
        <li><a [href]="site.social.github" target="_blank" rel="noopener noreferrer">GitHub</a></li>
        <li><a [href]="site.social.linkedin" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
        <li><a [href]="site.social.email">Email</a></li>
      </ul>
    </div>

    <img
      class="hero__photo"
      [src]="site.profileImage"
      [alt]="'Portrait of ' + cv.name"
      width="320"
      height="320"
      fetchpriority="high"
    />
  </div>
</section>

<section class="section container" aria-labelledby="highlights-title">
  <h2 id="highlights-title" class="section__title" appReveal>What I do</h2>
  <ul class="highlights">
    @for (item of cv.highlights; track item.title; let i = $index) {
      <li class="highlight" appReveal [revealDelay]="i * 100">
        <h3 class="highlight__title">{{ item.title }}</h3>
        <p class="highlight__text">{{ item.description }}</p>
      </li>
    }
  </ul>
</section>

@if (latestPosts().length) {
  <section id="latest-posts" class="section container" aria-labelledby="posts-title">
    <div class="section-head" appReveal>
      <h2 id="posts-title" class="section__title">Latest posts</h2>
      <a routerLink="/blog" class="section-head__link">All posts →</a>
    </div>
    <div class="grid">
      @for (post of latestPosts(); track post.slug; let i = $index) {
        <app-post-card [post]="post" appReveal [revealDelay]="i * 100" />
      }
    </div>
  </section>
}

@if (featuredProjects().length) {
  <section class="section container" aria-labelledby="projects-title">
    <div class="section-head" appReveal>
      <h2 id="projects-title" class="section__title">Featured projects</h2>
      <a routerLink="/projects" class="section-head__link">All projects →</a>
    </div>
    <div class="grid">
      @for (project of featuredProjects(); track project.slug; let i = $index) {
        <app-project-card [project]="project" appReveal [revealDelay]="i * 100" />
      }
    </div>
  </section>
}
```

- [ ] Run `npm test`. Expected: PASS.

### Step 3: Styles and hero animation

- [ ] Replace `home-page.scss`:

```scss
.hero {
  position: relative;
  overflow: hidden;
  padding-block: var(--space-8);
}

.hero__bg {
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
}

.hero__blob {
  position: absolute;
  width: 28rem;
  height: 28rem;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.35;
  animation: drift 18s ease-in-out infinite alternate;
}

.hero__blob--one {
  top: -8rem;
  left: -6rem;
  background: var(--color-accent);
}

.hero__blob--two {
  right: -8rem;
  bottom: -10rem;
  background: var(--color-accent-2);
  animation-delay: -9s;
}

@keyframes drift {
  from {
    transform: translate(0, 0) scale(1);
  }
  to {
    transform: translate(4rem, 3rem) scale(1.15);
  }
}

.hero__inner {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: var(--space-7);
}

.hero__line {
  animation: fade-up var(--duration-slow) var(--ease-out) both;
  animation-delay: calc(var(--i) * 90ms);
}

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.hero__eyebrow {
  margin: 0;
  color: var(--color-muted);
  font-weight: 500;
}

.hero__name {
  margin-bottom: var(--space-3);
}

.hero__headline {
  font-size: 1.25rem;
  font-weight: 600;
}

.hero__tagline {
  max-width: 38rem;
  color: var(--color-muted);
  font-size: 1.125rem;
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-block: var(--space-5);
}

.hero__social {
  display: flex;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;

  a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding-inline: var(--space-2);
    color: var(--color-muted);
    font-weight: 500;

    &:hover {
      color: var(--color-accent);
    }
  }
}

.hero__photo {
  width: clamp(10rem, 25vw, 20rem);
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 50%;
  border: 4px solid var(--color-surface);
  box-shadow: var(--shadow-md), 0 0 0 6px color-mix(in srgb, var(--color-accent) 25%, transparent);
  animation: fade-up var(--duration-slow) var(--ease-out) both 200ms;
}

.highlights {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  gap: var(--space-5);
  margin: 0;
  padding: 0;
  list-style: none;
}

.highlight {
  padding: var(--space-5);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
  transition: transform var(--duration-base) var(--ease-out), box-shadow var(--duration-base) var(--ease-out);

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-md);
  }
}

.highlight__title {
  margin-bottom: var(--space-2);
}

.highlight__text {
  margin: 0;
  color: var(--color-muted);
}

.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-4);
}

.section-head__link {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  font-weight: 600;
  text-decoration: none;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
  gap: var(--space-5);
}

@media (max-width: 767px) {
  .hero__inner {
    grid-template-columns: 1fr;
  }

  .hero__photo {
    grid-row: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero__blob,
  .hero__line,
  .hero__photo {
    animation: none;
  }
}
```

### Step 4: Verify and commit

- [ ] Run `npm test` and `npm run build`. Expected: PASS; build succeeds.
- [ ] Manual check with `npm start`: hero animates once on load, blobs drift slowly; with OS "reduce motion" on, nothing moves; at 360px the photo sits above the text with no horizontal scroll.
- [ ] Commit:

```bash
git add src/app/pages/home
git commit -m "feat(home): animated hero, highlights, latest posts, featured projects"
```
