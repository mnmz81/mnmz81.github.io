import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { ContentIndex } from '../../core/content.models';
import { SeoService } from '../../core/seo.service';
import { PostCard } from '../../shared/post-card/post-card';
import { RevealDirective } from '../../shared/reveal/reveal.directive';

@Component({
  selector: 'app-blog-list-page',
  imports: [RouterLink, PostCard, RevealDirective],
  templateUrl: './blog-list-page.html',
  styleUrl: './blog-list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogListPage {
  readonly index = input.required<ContentIndex>();

  constructor() {
    inject(SeoService).set({
      title: 'Blog',
      description: "Notes on what I'm learning: AI engineering, Angular, algorithms and more.",
      path: '/blog',
    });
  }
}
