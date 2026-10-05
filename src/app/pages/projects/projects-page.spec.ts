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
