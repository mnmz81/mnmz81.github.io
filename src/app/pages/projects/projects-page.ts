import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import type { Project } from '../../core/content.models';
import { SeoService } from '../../core/seo.service';
import { ProjectCard } from '../../shared/project-card/project-card';
import { RevealDirective } from '../../shared/reveal/reveal.directive';

@Component({
  selector: 'app-projects-page',
  imports: [ProjectCard, RevealDirective],
  templateUrl: './projects-page.html',
  styleUrl: './projects-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsPage {
  readonly projects = input.required<Project[]>();

  constructor() {
    inject(SeoService).set({
      title: 'Projects',
      description: "Things I've built: side projects and university work.",
      path: '/projects',
    });
  }
}
