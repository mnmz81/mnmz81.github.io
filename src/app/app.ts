import { ChangeDetectionStrategy, Component, DOCUMENT, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AnalyticsService } from './core/analytics.service';
import { SITE } from './core/site.config';
import { SiteFooter } from './shared/layout/site-footer/site-footer';
import { SiteHeader } from './shared/layout/site-header/site-header';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SiteHeader, SiteFooter],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly document = inject(DOCUMENT);

  constructor() {
    inject(AnalyticsService).init();
    if (SITE.features.blog) this.addFeedLink();
  }

  private addFeedLink(): void {
    const link = this.document.createElement('link');
    Object.assign(link, { rel: 'alternate', type: 'application/rss+xml', title: `${SITE.title} — Blog`, href: '/rss.xml' });
    this.document.head.appendChild(link);
  }

  protected skipToMain(event: Event): void {
    event.preventDefault();
    this.document.getElementById('main')?.focus();
  }
}
