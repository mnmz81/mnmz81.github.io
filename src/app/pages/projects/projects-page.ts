import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import type { Project } from '../../core/content.models';
import { SeoService } from '../../core/seo.service';
import { ProjectCard } from '../../shared/project-card/project-card';

@Component({
  selector: 'app-projects-page',
  imports: [ProjectCard],
  templateUrl: './projects-page.html',
  styleUrl: './projects-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsPage {
  readonly projects = input.required<Project[]>();

  /** Featured work first, the rest under its own heading; empty groups are dropped. */
  protected readonly groups = computed(() =>
    [
      { id: 'projects-main', title: 'Main projects', projects: this.projects().filter((p) => p.featured) },
      { id: 'projects-more', title: 'More projects', projects: this.projects().filter((p) => !p.featured) },
    ].filter((group) => group.projects.length),
  );

  constructor() {
    inject(SeoService).set({
      title: 'Projects',
      description: "Things I've built: side projects and university work.",
      path: '/projects',
    });
  }
}
