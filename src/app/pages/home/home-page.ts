import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import type { ContentIndex, Project } from '../../core/content.models';
import { CV } from '../../core/cv.data';
import { SeoService } from '../../core/seo.service';
import { SITE } from '../../core/site.config';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  readonly index = input.required<ContentIndex>();
  readonly projects = input.required<Project[]>();
  protected readonly cv = CV;

  constructor() {
    inject(SeoService).set({ title: SITE.title, description: SITE.description, path: '/' });
  }
}
