import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { FIXTURE_INDEX } from '../../../testing/fixtures';
import { PostCard } from './post-card';

// Angular's DatePipe parses bare YYYY-MM-DD as local midnight; pin an east-of-UTC zone so the date test catches that on any runner.
// (spec tsconfig has no node types, so reach process via globalThis)
const env = (globalThis as unknown as { process: { env: Record<string, string | undefined> } }).process.env;
const ORIGINAL_TZ = env['TZ'];
env['TZ'] = 'Asia/Jerusalem';

const post = FIXTURE_INDEX.posts[1]; // angular-signals-in-practice, 2026-08-30

async function render() {
  const fixture = TestBed.createComponent(PostCard);
  fixture.componentRef.setInput('post', post);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('PostCard', () => {
  afterAll(() => {
    if (ORIGINAL_TZ === undefined) delete env['TZ'];
    else env['TZ'] = ORIGINAL_TZ;
  });

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
