# Task 07: Blog list, tag page, PostCard

> Read first: `docs/plan/README.md` (Global Constraints), `docs/plan/contracts.md`, `docs/plan/spec.md`.

**Goal:** Build `/blog` (intro, tag filter chips with counts, post cards, empty state) and `/blog/tags/:tag` (filtered posts, back link, empty state), and finish the shared `PostCard`.

**Wave:** 1 (parallel).

**Files:**
- Modify (replace stubs): `src/app/shared/post-card/post-card.{ts,html,scss}`; create `post-card.spec.ts`
- Modify (replace stubs): `src/app/pages/blog-list/blog-list-page.{ts,html,scss}`; create `blog-list-page.spec.ts`
- Modify (replace stubs): `src/app/pages/tag/tag-page.{ts,html,scss}`; create `tag-page.spec.ts`

**Interfaces:**
- Consumes (from Task 00): inputs `index: ContentIndex` (both pages), `tag: string` (tag page, route param); `PostMeta`, `TagCount`; `SeoService.set`; `RevealDirective`; utility classes `.chip .chip--active`.
- Produces: `PostCard` keeps selector `app-post-card`, `post = input.required<PostMeta>()`, and the title element keeps `view-transition-name: post-title-<slug>` (contracts §6; Home and the post page rely on it).

---

### Step 1: PostCard (TDD)

- [ ] Create `src/app/shared/post-card/post-card.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { FIXTURE_INDEX } from '../../../testing/fixtures';
import { PostCard } from './post-card';

const post = FIXTURE_INDEX.posts[1]; // angular-signals-in-practice, 2026-08-30

async function render() {
  const fixture = TestBed.createComponent(PostCard);
  fixture.componentRef.setInput('post', post);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('PostCard', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter([])] }));

  it('links the title to the post', async () => {
    const el = await render();
    const link = el.querySelector('.post-card__title a');
    expect(link?.getAttribute('href')).toBe('/blog/angular-signals-in-practice');
    expect(link?.textContent?.trim()).toBe(post.title);
  });

  it('shows the UTC date and reading time', async () => {
    const el = await render();
    const time = el.querySelector('time');
    expect(time?.getAttribute('datetime')).toBe('2026-08-30');
    expect(time?.textContent?.trim()).toBe('Aug 30, 2026');
    expect(el.textContent).toContain('4 min read');
  });

  it('links each tag to its tag page', async () => {
    const el = await render();
    const hrefs = [...el.querySelectorAll('.post-card__tags a')].map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/blog/tags/angular', '/blog/tags/frontend']);
  });

  it('sets the shared view-transition name on the title', async () => {
    const el = await render();
    const title = el.querySelector<HTMLElement>('.post-card__title');
    expect(title?.style.getPropertyValue('view-transition-name')).toBe('post-title-angular-signals-in-practice');
  });
});
```

- [ ] Run `npm test`. Expected: FAIL (tags not rendered).

- [ ] Replace `src/app/shared/post-card/post-card.ts`:

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

- [ ] Replace `post-card.html`:

```html
<article class="post-card">
  <p class="post-card__meta">
    <time [attr.datetime]="post().date">{{ post().date | date: 'mediumDate' : 'UTC' }}</time>
    <span aria-hidden="true">·</span>
    <span>{{ post().readingMinutes }} min read</span>
  </p>
  <h3 class="post-card__title" [style.view-transition-name]="'post-title-' + post().slug">
    <a class="post-card__link" [routerLink]="['/blog', post().slug]">{{ post().title }}</a>
  </h3>
  <p class="post-card__summary">{{ post().summary }}</p>
  <ul class="post-card__tags" aria-label="Tags">
    @for (tag of post().tags; track tag) {
      <li><a class="chip" [routerLink]="['/blog/tags', tag]">#{{ tag }}</a></li>
    }
  </ul>
</article>
```

- [ ] Replace `post-card.scss`:

```scss
:host {
  display: block;
}

.post-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
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

.post-card__meta {
  display: flex;
  gap: var(--space-2);
  margin: 0;
  color: var(--color-muted);
  font-size: 0.875rem;
}

.post-card__title {
  margin: 0;
}

.post-card__link {
  color: var(--color-text);
  text-decoration: none;

  &:hover {
    color: var(--color-accent);
  }
}

.post-card__summary {
  flex: 1;
  margin: 0;
  color: var(--color-muted);
}

.post-card__tags {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}
```

- [ ] Run `npm test`. Expected: PASS.

### Step 2: BlogListPage (TDD)

- [ ] Create `src/app/pages/blog-list/blog-list-page.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ContentIndex } from '../../core/content.models';
import { FIXTURE_INDEX } from '../../../testing/fixtures';
import { BlogListPage } from './blog-list-page';

async function render(index: ContentIndex = FIXTURE_INDEX) {
  const fixture = TestBed.createComponent(BlogListPage);
  fixture.componentRef.setInput('index', index);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('BlogListPage', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter([])] }));

  it('lists every post', async () => {
    expect((await render()).querySelectorAll('app-post-card')).toHaveLength(FIXTURE_INDEX.posts.length);
  });

  it('renders an active "All" chip and a chip per tag with counts', async () => {
    const el = await render();
    const chips = [...el.querySelectorAll('.tag-filter a')];
    expect(chips[0].textContent?.trim()).toBe('All');
    expect(chips[0].classList).toContain('chip--active');
    expect(chips[0].getAttribute('aria-current')).toBe('page');
    expect(chips.slice(1).map((c) => c.getAttribute('href'))).toEqual(FIXTURE_INDEX.tags.map((t) => `/blog/tags/${t.tag}`));
    expect(chips[1].textContent).toContain('(1)');
  });

  it('shows an empty state with no posts', async () => {
    const el = await render({ ...FIXTURE_INDEX, posts: [], tags: [] });
    expect(el.querySelector('.blog__empty')?.textContent).toContain('First posts are on the way');
    expect(el.querySelector('.tag-filter')).toBeNull();
  });

  it('sets the title', async () => {
    await render();
    expect(TestBed.inject(Title).getTitle()).toBe('Blog · Moris Maor Zakay');
  });
});
```

- [ ] Run `npm test`. Expected: FAIL.

- [ ] Replace `src/app/pages/blog-list/blog-list-page.ts`:

```ts
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { ContentIndex } from '../../core/content.models';
import { SeoService } from '../../core/seo.service';
import { PostCard } from '../../shared/post-card/post-card';
import { RevealDirective } from '../../shared/reveal/reveal.directive';

@Component({
  selector: 'app-blog-list-page',
  imports: [RouterLink, PostCard, RevealDirective],
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

- [ ] Replace `blog-list-page.html`:

```html
<div class="container section">
  <header class="blog__intro" appReveal>
    <h1><span class="text-gradient">Blog</span></h1>
    <p class="blog__lead">Notes on what I'm learning: AI engineering, Angular, algorithms from my M.Sc., and more.</p>
  </header>

  @if (index().posts.length) {
    <nav class="tag-filter" aria-label="Filter by tag">
      <a class="chip chip--active" routerLink="/blog" aria-current="page">All</a>
      @for (t of index().tags; track t.tag) {
        <a class="chip" [routerLink]="['/blog/tags', t.tag]">#{{ t.tag }} <span class="tag-filter__count">({{ t.count }})</span></a>
      }
    </nav>

    <div class="blog__list">
      @for (post of index().posts; track post.slug; let i = $index) {
        <app-post-card [post]="post" appReveal [revealDelay]="(i % 3) * 100" />
      }
    </div>
  } @else {
    <p class="blog__empty">First posts are on the way. Follow the <a href="/rss.xml">RSS feed</a> to get them.</p>
  }
</div>
```

- [ ] Replace `blog-list-page.scss`:

```scss
.blog__intro {
  margin-bottom: var(--space-6);
}

.blog__lead {
  max-width: var(--prose-max);
  color: var(--color-muted);
  font-size: 1.125rem;
}

.tag-filter {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-6);
}

.tag-filter__count {
  margin-left: var(--space-1);
  opacity: 0.7;
}

.blog__list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(20rem, 100%), 1fr));
  gap: var(--space-5);
}

.blog__empty {
  color: var(--color-muted);
}
```

- [ ] Run `npm test`. Expected: PASS.

### Step 3: TagPage (TDD)

- [ ] Create `src/app/pages/tag/tag-page.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';
import { FIXTURE_INDEX } from '../../../testing/fixtures';
import { TagPage } from './tag-page';

async function render(tag: string) {
  const fixture = TestBed.createComponent(TagPage);
  fixture.componentRef.setInput('index', FIXTURE_INDEX);
  fixture.componentRef.setInput('tag', tag);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('TagPage', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter([])] }));

  it('shows only posts with the tag', async () => {
    const el = await render('angular');
    const titles = [...el.querySelectorAll('app-post-card h3')].map((h) => h.textContent?.trim());
    expect(titles).toEqual(['Angular Signals in practice']);
    expect(el.querySelector('h1')?.textContent).toContain('#angular');
  });

  it('shows the post count', async () => {
    expect((await render('angular')).textContent).toContain('1 post');
  });

  it('shows an empty state for unknown tags', async () => {
    const el = await render('nope');
    expect(el.querySelector('.tag__empty')?.textContent).toContain('No posts tagged');
  });

  it('links back to all posts', async () => {
    expect((await render('angular')).querySelector('a[href="/blog"]')).not.toBeNull();
  });

  it('sets the title', async () => {
    await render('angular');
    expect(TestBed.inject(Title).getTitle()).toBe('#angular · Moris Maor Zakay');
  });
});
```

- [ ] Run `npm test`. Expected: FAIL.

- [ ] Replace `src/app/pages/tag/tag-page.ts`:

```ts
import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { ContentIndex } from '../../core/content.models';
import { SeoService } from '../../core/seo.service';
import { PostCard } from '../../shared/post-card/post-card';
import { RevealDirective } from '../../shared/reveal/reveal.directive';

@Component({
  selector: 'app-tag-page',
  imports: [RouterLink, PostCard, RevealDirective],
  templateUrl: './tag-page.html',
  styleUrl: './tag-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagPage {
  readonly index = input.required<ContentIndex>();
  readonly tag = input.required<string>();

  protected readonly posts = computed(() => this.index().posts.filter((p) => p.tags.includes(this.tag())));

  constructor() {
    const seo = inject(SeoService);
    effect(() => {
      const tag = this.tag();
      seo.set({ title: `#${tag}`, description: `Posts tagged ${tag}.`, path: `/blog/tags/${tag}` });
    });
  }
}
```

- [ ] Replace `tag-page.html`:

```html
<div class="container section">
  <a class="tag__back" routerLink="/blog">← All posts</a>
  <header class="tag__intro" appReveal>
    <h1><span class="text-gradient">#{{ tag() }}</span></h1>
    <p class="tag__count">{{ posts().length }} {{ posts().length === 1 ? 'post' : 'posts' }}</p>
  </header>

  @if (posts().length) {
    <div class="tag__list">
      @for (post of posts(); track post.slug; let i = $index) {
        <app-post-card [post]="post" appReveal [revealDelay]="(i % 3) * 100" />
      }
    </div>
  } @else {
    <p class="tag__empty">No posts tagged “{{ tag() }}” yet.</p>
  }
</div>
```

- [ ] Replace `tag-page.scss`:

```scss
.tag__back {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  margin-bottom: var(--space-4);
  font-weight: 600;
  text-decoration: none;
}

.tag__intro {
  margin-bottom: var(--space-6);
}

.tag__count,
.tag__empty {
  color: var(--color-muted);
}

.tag__list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(20rem, 100%), 1fr));
  gap: var(--space-5);
}
```

- [ ] Run `npm test`. Expected: PASS.

### Step 4: Verify and commit

- [ ] Run `npm test` and `npm run build`. Expected: PASS; `dist/moris-site/browser/blog/tags/angular/index.html` exists (fixtures/drafts may require `INCLUDE_DRAFTS=1 npm run build` once Task 01 is merged).
- [ ] Commit:

```bash
git add src/app/shared/post-card src/app/pages/blog-list src/app/pages/tag
git commit -m "feat(blog): post list with tag filter, tag pages and post card"
```
