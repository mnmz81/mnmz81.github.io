import { ChangeDetectionStrategy, Component, effect, inject, input } from '@angular/core';
import type { ContentIndex } from '../../core/content.models';
import { SeoService } from '../../core/seo.service';

@Component({
  selector: 'app-tag-page',
  templateUrl: './tag-page.html',
  styleUrl: './tag-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagPage {
  readonly index = input.required<ContentIndex>();
  readonly tag = input.required<string>();

  constructor() {
    const seo = inject(SeoService);
    effect(() => {
      const tag = this.tag();
      seo.set({ title: `#${tag}`, description: `Posts tagged ${tag}.`, path: `/blog/tags/${tag}` });
    });
  }
}
