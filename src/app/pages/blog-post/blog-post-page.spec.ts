import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import type { Post } from '../../core/content.models';
import { FIXTURE_POST } from '../../../testing/fixtures';
import { BlogPostPage } from './blog-post-page';

// Angular's DatePipe parses bare YYYY-MM-DD as local midnight; pin an east-of-UTC zone so the date tests catch that on any runner.
// (spec tsconfig has no node types, so reach process via globalThis)
const env = (globalThis as unknown as { process: { env: Record<string, string | undefined> } }).process.env;
const ORIGINAL_TZ = env['TZ'];
env['TZ'] = 'Asia/Jerusalem';

async function render(post: Post = FIXTURE_POST) {
  const fixture = TestBed.createComponent(BlogPostPage);
  fixture.componentRef.setInput('post', post);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('BlogPostPage', () => {
  afterAll(() => {
    if (ORIGINAL_TZ === undefined) delete env['TZ'];
    else env['TZ'] = ORIGINAL_TZ;
  });

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

  it('uses the trailing-slash page URL in JSON-LD', async () => {
    await render();
    const ld = JSON.parse(document.head.querySelector('script[type="application/ld+json"]')?.textContent ?? '{}');
    expect(ld.url).toBe('https://mnmz81.github.io/blog/angular-signals-in-practice/');
    expect(ld.mainEntityOfPage).toBe(ld.url);
  });
});
