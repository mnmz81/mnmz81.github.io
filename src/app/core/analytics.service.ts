import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT, DestroyRef, Injectable, InjectionToken, PLATFORM_ID, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { SITE } from './site.config';

interface GoatCounter {
  count(vars: { path: string }): void;
}

export const GOATCOUNTER_CODE = new InjectionToken<string>('GOATCOUNTER_CODE', {
  factory: () => SITE.analytics.goatcounterCode,
});

/** Cookie-free page view counting with GoatCounter. Inactive until SITE.analytics.goatcounterCode is set. */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly code = inject(GOATCOUNTER_CODE);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private pending: string[] = [];

  init(): void {
    if (!this.isBrowser || !this.code) return;

    const script = this.document.createElement('script');
    script.async = true;
    script.src = 'https://gc.zgo.at/count.js';
    script.dataset['goatcounter'] = `https://${this.code}.goatcounter.com/count`;
    script.dataset['goatcounterSettings'] = JSON.stringify({ no_onload: true });
    script.addEventListener('load', () => this.flush());
    this.document.head.appendChild(script);

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => this.track(event.urlAfterRedirects));
  }

  private track(path: string): void {
    const counter = (this.document.defaultView as (Window & { goatcounter?: GoatCounter }) | null)?.goatcounter;
    if (counter?.count) counter.count({ path });
    else this.pending.push(path);
  }

  private flush(): void {
    const queued = this.pending;
    this.pending = [];
    queued.forEach((path) => this.track(path));
  }
}
