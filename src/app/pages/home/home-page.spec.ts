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

  it('links to the blog and the about page, with no CV download', async () => {
    const el = await render();
    expect(el.querySelector('a[href="/blog"]')).not.toBeNull();
    expect(el.querySelector('.hero__actions a[href="/about"]')).not.toBeNull();
    expect(el.querySelector('a[download]')).toBeNull();
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
