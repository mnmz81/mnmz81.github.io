import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import type { Post } from '../../core/content.models';
import { SeoService } from '../../core/seo.service';
import { SITE, pageUrl } from '../../core/site.config';

@Component({
  selector: 'app-blog-post-page',
  imports: [RouterLink, DatePipe, NgTemplateOutlet],
  templateUrl: './blog-post-page.html',
  styleUrl: './blog-post-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogPostPage {
  readonly post = input.required<Post>();

  private readonly sanitizer = inject(DomSanitizer);

  // Trusted: built from repository Markdown with raw HTML disabled (Task 01).
  // Bypassing keeps Shiki's inline CSS variables, which the sanitizer would strip.
  protected readonly body = computed(() => this.sanitizer.bypassSecurityTrustHtml(this.post().html));

  constructor() {
    const seo = inject(SeoService);
    effect(() => {
      const post = this.post();
      const url = pageUrl(`/blog/${post.slug}`);
      seo.set({
        title: post.title,
        description: post.summary,
        path: `/blog/${post.slug}`,
        type: 'article',
        image: `/og/${post.slug}.png`,
        publishedTime: post.date,
        modifiedTime: post.updated,
        tags: post.tags,
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          description: post.summary,
          datePublished: post.date,
          dateModified: post.updated ?? post.date,
          url,
          mainEntityOfPage: url,
          image: `${SITE.url}/og/${post.slug}.png`,
          keywords: post.tags.join(', '),
          author: { '@type': 'Person', name: SITE.author, url: SITE.url },
        },
      });
    });
  }
}
