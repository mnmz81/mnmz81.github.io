# Task 08: Blog post page + prose styles

> Read first: `docs/plan/README.md` (Global Constraints), `docs/plan/contracts.md`, `docs/plan/spec.md`.

**Goal:** Build `/blog/:slug`: header (date, reading time, updated date, tags, title with shared-element view transition), table of contents (sticky sidebar on desktop, collapsible on mobile), article body with prose styles and dual-theme Shiki code blocks.

**Wave:** 1 (parallel).

**Files:**
- Modify (replace stubs): `src/app/pages/blog-post/blog-post-page.{ts,html,scss}`; create `blog-post-page.spec.ts`
- Modify (replace stub): `src/styles/_prose.scss`

**Interfaces:**
- Consumes (from Task 00): input `post: Post` (resolver; missing slug already redirects to `/404`); `Post`/`TocItem`; `SeoService.set` with `PageSeo` (contracts §4–§5); `SITE`; utility classes. Post HTML shape from contracts §3 (heading ids, Shiki markup with `--shiki-light`/`--shiki-dark` CSS variables). `FIXTURE_POST` has a TOC and a Shiki block.
- Produces: `<h1>` with `view-transition-name: post-title-<slug>` (pairs with `PostCard`). Global `.prose` class styles.

Security: the post body is the one allowed use of `bypassSecurityTrustHtml` (Global Constraints). The HTML is generated at build time from repository Markdown with raw HTML disabled (Task 01). Angular's sanitizer would otherwise strip Shiki's `style` attributes.

---

### Step 1: Write the failing test

- [ ] Create `src/app/pages/blog-post/blog-post-page.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Post } from '../../core/content.models';
import { FIXTURE_POST } from '../../../testing/fixtures';
import { BlogPostPage } from './blog-post-page';

async function render(post: Post = FIXTURE_POST) {
  const fixture = TestBed.createComponent(BlogPostPage);
  fixture.componentRef.setInput('post', post);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('BlogPostPage', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter([])] }));

  it('renders the header', async () => {
    const el = await render();
    const h1 = el.querySelector<HTMLElement>('h1');
    expect(h1?.textContent?.trim()).toBe(FIXTURE_POST.title);
    expect(h1?.style.getPropertyValue('view-transition-name')).toBe('post-title-angular-signals-in-practice');
    expect(el.querySelector('.post__meta time')?.textContent?.trim()).toBe('Aug 30, 2026');
    expect(el.textContent).toContain('4 min read');
    expect([...el.querySelectorAll('.post__tags a')].map((a) => a.getAttribute('href'))).toEqual([
      '/blog/tags/angular',
      '/blog/tags/frontend',
    ]);
  });

  it('shows the updated date only when present', async () => {
    expect((await render()).textContent).not.toContain('Updated');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    expect((await render({ ...FIXTURE_POST, updated: '2026-09-15' })).textContent).toContain('Updated Sep 15, 2026');
  });

  it('renders the body with shiki styles intact', async () => {
    const el = await render();
    const body = el.querySelector('.prose');
    expect(body?.querySelector('h2#why-signals')).not.toBeNull();
    expect(body?.querySelector('pre.shiki span[style*="--shiki-dark"]')).not.toBeNull();
  });

  it('renders toc links as fragments', async () => {
    const el = await render();
    const links = [...el.querySelectorAll('.toc--desktop a')];
    expect(links.map((a) => a.textContent?.trim())).toEqual(['Why signals', 'Computed values', 'Takeaways']);
    expect(links[0].getAttribute('href')).toMatch(/#why-signals$/);
    expect(links[1].classList).toContain('toc__link--sub');
  });

  it('omits the toc when the post has no headings', async () => {
    const el = await render({ ...FIXTURE_POST, toc: [] });
    expect(el.querySelector('.toc--desktop')).toBeNull();
    expect(el.querySelector('.toc--mobile')).toBeNull();
  });

  it('sets the title', async () => {
    await render();
    expect(TestBed.inject(Title).getTitle()).toBe('Angular Signals in practice · Moris Maor Zakay');
  });
});
```

- [ ] Run `npm test`. Expected: FAIL.

### Step 2: Implement the component

- [ ] Replace `src/app/pages/blog-post/blog-post-page.ts`:

```ts
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import type { Post } from '../../core/content.models';
import { SeoService } from '../../core/seo.service';
import { SITE } from '../../core/site.config';

@Component({
  selector: 'app-blog-post-page',
  imports: [RouterLink, DatePipe, NgTemplateOutlet],
  templateUrl: './blog-post-page.html',
  styleUrl: './blog-post-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogPostPage {
  readonly post = input.required<Post>();

  private readonly sanitizer = inject(DomSanitizer);

  // Trusted: built from repository Markdown with raw HTML disabled (Task 01).
  // Bypassing keeps Shiki's inline CSS variables, which the sanitizer would strip.
  protected readonly body = computed(() => this.sanitizer.bypassSecurityTrustHtml(this.post().html));

  constructor() {
    const seo = inject(SeoService);
    effect(() => {
      const post = this.post();
      const url = `${SITE.url}/blog/${post.slug}`;
      seo.set({
        title: post.title,
        description: post.summary,
        path: `/blog/${post.slug}`,
        type: 'article',
        image: `/og/${post.slug}.png`,
        publishedTime: post.date,
        modifiedTime: post.updated,
        tags: post.tags,
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          description: post.summary,
          datePublished: post.date,
          dateModified: post.updated ?? post.date,
          url,
          mainEntityOfPage: url,
          image: `${SITE.url}/og/${post.slug}.png`,
          keywords: post.tags.join(', '),
          author: { '@type': 'Person', name: SITE.author, url: SITE.url },
        },
      });
    });
  }
}
```

- [ ] Replace `blog-post-page.html`:

```html
<article class="post container">
  <a class="post__back" routerLink="/blog">← All posts</a>

  <header class="post__header">
    <p class="post__meta">
      <time [attr.datetime]="post().date">{{ post().date + 'T00:00:00Z' | date: 'mediumDate' : 'UTC' }}</time>
      <span aria-hidden="true">·</span>
      <span>{{ post().readingMinutes }} min read</span>
      @if (post().updated; as updated) {
        <span aria-hidden="true">·</span>
        <span>Updated <time [attr.datetime]="updated">{{ updated + 'T00:00:00Z' | date: 'mediumDate' : 'UTC' }}</time></span>
      }
    </p>
    <h1 class="post__title" [style.view-transition-name]="'post-title-' + post().slug">{{ post().title }}</h1>
    <p class="post__summary">{{ post().summary }}</p>
    <ul class="post__tags" aria-label="Tags">
      @for (tag of post().tags; track tag) {
        <li><a class="chip" [routerLink]="['/blog/tags', tag]">#{{ tag }}</a></li>
      }
    </ul>
  </header>

  <ng-template #tocList>
    <ol class="toc__list">
      @for (item of post().toc; track item.id) {
        <li>
          <a class="toc__link" [class.toc__link--sub]="item.depth === 3" [routerLink]="[]" [fragment]="item.id">{{ item.text }}</a>
        </li>
      }
    </ol>
  </ng-template>

  <div class="post__layout" [class.post__layout--with-toc]="post().toc.length > 0">
    @if (post().toc.length) {
      <details class="toc toc--mobile">
        <summary>On this page</summary>
        <ng-container [ngTemplateOutlet]="tocList" />
      </details>
    }

    <div class="prose" [innerHTML]="body()"></div>

    @if (post().toc.length) {
      <nav class="toc toc--desktop" aria-label="On this page">
        <p class="toc__title">On this page</p>
        <ng-container [ngTemplateOutlet]="tocList" />
      </nav>
    }
  </div>
</article>
```

- [ ] Replace `blog-post-page.scss`:

```scss
.post {
  padding-block: var(--space-6) var(--space-8);
}

.post__back {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  margin-bottom: var(--space-4);
  font-weight: 600;
  text-decoration: none;
}

.post__header {
  max-width: var(--prose-max);
  margin-bottom: var(--space-7);
}

.post__meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  color: var(--color-muted);
  font-size: 0.9rem;
}

.post__title {
  margin-bottom: var(--space-4);
}

.post__summary {
  color: var(--color-muted);
  font-size: 1.2rem;
}

.post__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.post__layout--with-toc {
  display: grid;
  grid-template-columns: minmax(0, var(--prose-max)) 14rem;
  justify-content: space-between;
  gap: var(--space-7);
}

.toc__title {
  margin-bottom: var(--space-3);
  color: var(--color-muted);
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.toc__list {
  display: grid;
  gap: var(--space-1);
  margin: 0;
  padding: 0;
  list-style: none;
}

.toc__link {
  display: block;
  padding-block: var(--space-2);
  color: var(--color-muted);
  font-size: 0.9rem;
  text-decoration: none;

  &:hover {
    color: var(--color-accent);
  }
}

.toc__link--sub {
  padding-left: var(--space-4);
}

.toc--desktop {
  position: sticky;
  top: calc(var(--header-height) + var(--space-5));
  align-self: start;
}

.toc--mobile {
  display: none;
  margin-bottom: var(--space-5);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);

  summary {
    min-height: 44px;
    display: flex;
    align-items: center;
    font-weight: 600;
    cursor: pointer;
  }
}

@media (max-width: 1023px) {
  .post__layout--with-toc {
    display: block;
  }

  .toc--desktop {
    display: none;
  }

  .toc--mobile {
    display: block;
  }
}
```

- [ ] Run `npm test`. Expected: PASS.

### Step 3: Prose styles

- [ ] Replace `src/styles/_prose.scss`:

```scss
// Article body (rendered Markdown). Global because [innerHTML] content is outside view encapsulation.
.prose {
  max-width: var(--prose-max);
  font-size: 1.0625rem;
  line-height: 1.75;
  overflow-wrap: break-word;

  > :first-child {
    margin-top: 0;
  }

  p,
  ul,
  ol,
  blockquote,
  pre,
  table,
  figure {
    margin: 0 0 var(--space-5);
  }

  h2 {
    margin-top: var(--space-7);
  }

  h3 {
    margin-top: var(--space-6);
  }

  a {
    font-weight: 500;
    text-decoration-thickness: 1px;

    &:hover {
      text-decoration-thickness: 2px;
    }
  }

  ul,
  ol {
    padding-left: var(--space-5);
  }

  li + li {
    margin-top: var(--space-2);
  }

  blockquote {
    padding-left: var(--space-4);
    border-left: 3px solid var(--color-accent);
    color: var(--color-muted);
    font-style: italic;
  }

  :not(pre) > code {
    padding: 0.15em 0.4em;
    border-radius: var(--radius-sm);
    background: var(--color-surface-2);
  }

  pre {
    overflow-x: auto;
    padding: var(--space-4) var(--space-5);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: 0.875rem;
    line-height: 1.65;
  }

  img {
    border-radius: var(--radius-md);
  }

  hr {
    margin-block: var(--space-7);
    border: 0;
    border-top: 1px solid var(--color-border);
  }

  table {
    display: block;
    width: 100%;
    overflow-x: auto;
    border-collapse: collapse;
  }

  th,
  td {
    padding: var(--space-2) var(--space-3);
    border-bottom: 1px solid var(--color-border);
    text-align: left;
  }
}

// Shiki dual theme: spans carry --shiki-light / --shiki-dark variables (Task 01).
.prose pre.shiki {
  background-color: var(--shiki-light-bg);
}

.prose pre.shiki span {
  color: var(--shiki-light);
}

@mixin shiki-dark {
  .prose pre.shiki {
    background-color: var(--shiki-dark-bg);
  }

  .prose pre.shiki span {
    color: var(--shiki-dark);
  }
}

:root[data-theme='dark'] {
  @include shiki-dark;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    @include shiki-dark;
  }
}
```

### Step 4: Verify and commit

- [ ] Run `npm test` and `npm run build`. Expected: PASS; `grep -c 'shiki' dist/moris-site/browser/blog/angular-signals-in-practice/index.html` ≥ 1 (with fixtures from the Task 00 placeholder, or `INCLUDE_DRAFTS=1 npm run build` once Task 01 is merged).
- [ ] Manual check with `npm start`: open the post, switch theme → code colors switch; click a TOC entry → page scrolls to the heading and the URL gets `#id`; at 375px the TOC is a collapsed "On this page" box; long code lines scroll horizontally inside the block, not the page.
- [ ] Commit:

```bash
git add src/app/pages/blog-post src/styles/_prose.scss
git commit -m "feat(blog): post page with toc, prose and dual-theme code"
```
