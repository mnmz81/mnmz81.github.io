import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CV } from '../../core/cv.data';
import { SeoService } from '../../core/seo.service';
import { RevealDirective } from '../../shared/reveal/reveal.directive';

@Component({
  selector: 'app-about-page',
  imports: [RevealDirective],
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
