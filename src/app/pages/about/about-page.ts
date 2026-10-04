import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CV } from '../../core/cv.data';
import { SeoService } from '../../core/seo.service';

@Component({
  selector: 'app-about-page',
  templateUrl: './about-page.html',
  styleUrl: './about-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutPage {
  protected readonly cv = CV;

  constructor() {
    inject(SeoService).set({ title: 'About', description: CV.summary, path: '/about' });
  }
}
