import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { ContentIndex, Project } from '../../core/content.models';
import { CV } from '../../core/cv.data';
import { SeoService } from '../../core/seo.service';
import { SITE } from '../../core/site.config';
import { PostCard } from '../../shared/post-card/post-card';
import { ProjectCard } from '../../shared/project-card/project-card';
import { RevealDirective } from '../../shared/reveal/reveal.directive';

const LATEST_POSTS = 3;

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, PostCard, ProjectCard, RevealDirective],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  readonly index = input.required<ContentIndex>();
  readonly projects = input.required<Project[]>();

  protected readonly cv = CV;
  protected readonly site = SITE;
  protected readonly latestPosts = computed(() => (SITE.features.blog ? this.index().posts.slice(0, LATEST_POSTS) : []));
  protected readonly featuredProjects = computed(() => this.projects().filter((p) => p.featured));

  constructor() {
    inject(SeoService).set({
      title: SITE.title,
      description: SITE.description,
      path: '/',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: CV.name,
        jobTitle: 'Software Engineer',
        url: SITE.url,
        sameAs: [SITE.social.github, SITE.social.linkedin],
      },
    });
  }
}
