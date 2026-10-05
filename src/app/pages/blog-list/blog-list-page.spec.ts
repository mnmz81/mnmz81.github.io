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
