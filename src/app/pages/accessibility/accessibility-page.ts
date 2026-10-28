import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SeoService } from '../../core/seo.service';
import { SITE } from '../../core/site.config';

@Component({
  selector: 'app-accessibility-page',
  templateUrl: './accessibility-page.html',
  styleUrl: './accessibility-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccessibilityPage {
  // Bump when the statement or the site's accessibility changes.
  protected readonly updated = '2026-10-28';
  protected readonly email = SITE.social.email;
  protected readonly emailAddress = SITE.social.email.replace(/^mailto:/, '');

  constructor() {
    inject(SeoService).set({
      title: 'Accessibility',
      description: 'Accessibility statement: the standard this site follows, what was done and how to report a problem.',
      path: '/accessibility',
    });
  }
}
