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
