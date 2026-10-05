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
    expect(live?.getAttribute('aria-label')).toBe(`Live site of ${project.title}`);
    expect(repo?.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('omits links that are not defined', async () => {
    const { repo: _r, url: _u, ...rest } = FIXTURE_PROJECTS[1];
    const el = await render(rest as Project);
    expect(el.querySelectorAll('a')).toHaveLength(0);
  });
});
