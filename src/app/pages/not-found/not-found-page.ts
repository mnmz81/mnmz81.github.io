import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from '@mushilu-san/ui/primitives';
import { SeoService } from '../../core/seo.service';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink, Button],
  templateUrl: './not-found-page.html',
  styleUrl: './not-found-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPage {
  constructor() {
    inject(SeoService).set({ title: 'Page not found', description: 'This page does not exist.', path: '/404' });
  }
}
