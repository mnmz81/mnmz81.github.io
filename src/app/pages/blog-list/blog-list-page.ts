import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import type { ContentIndex } from '../../core/content.models';
import { SeoService } from '../../core/seo.service';

@Component({
  selector: 'app-blog-list-page',
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
