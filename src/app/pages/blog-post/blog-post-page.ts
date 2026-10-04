import { ChangeDetectionStrategy, Component, effect, inject, input } from '@angular/core';
import type { Post } from '../../core/content.models';
import { SeoService } from '../../core/seo.service';

@Component({
  selector: 'app-blog-post-page',
  templateUrl: './blog-post-page.html',
  styleUrl: './blog-post-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogPostPage {
  readonly post = input.required<Post>();

  constructor() {
    const seo = inject(SeoService);
    effect(() => {
      const post = this.post();
      seo.set({
        title: post.title,
        description: post.summary,
        path: `/blog/${post.slug}`,
        type: 'article',
        image: `/og/${post.slug}.png`,
        publishedTime: post.date,
        modifiedTime: post.updated,
        tags: post.tags,
      });
    });
  }
}
