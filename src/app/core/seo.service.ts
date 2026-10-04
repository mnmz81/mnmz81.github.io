import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { SITE } from './site.config';

export interface PageSeo {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  tags?: string[];
  jsonLd?: Record<string, unknown>;
}

export function formatTitle(title: string): string {
  return title === SITE.title ? title : `${title} · ${SITE.title}`;
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly titleService = inject(Title);

  set(page: PageSeo): void {
    this.titleService.setTitle(formatTitle(page.title));
  }
}
