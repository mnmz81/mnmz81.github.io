import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { ContentIndex } from '../../core/content.models';
import { SeoService } from '../../core/seo.service';
import { PostCard } from '../../shared/post-card/post-card';
import { RevealDirective } from '../../shared/reveal/reveal.directive';

@Component({
  selector: 'app-tag-page',
  imports: [RouterLink, PostCard, RevealDirective],
  templateUrl: './tag-page.html',
  styleUrl: './tag-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagPage {
  readonly index = input.required<ContentIndex>();
  readonly tag = input.required<string>();

  protected readonly posts = computed(() => this.index().posts.filter((p) => p.tags.includes(this.tag())));

  constructor() {
    const seo = inject(SeoService);
    effect(() => {
      const tag = this.tag();
      seo.set({ title: `#${tag}`, description: `Posts tagged ${tag}.`, path: `/blog/tags/${tag}` });
    });
  }
}
