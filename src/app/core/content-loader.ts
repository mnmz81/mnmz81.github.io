import { HttpClient } from '@angular/common/http';
import { InjectionToken, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

/** Loads a JSON file from the generated content folder, e.g. 'index.json' or 'posts/my-post.json'. */
export type ContentLoader = (path: string) => Promise<unknown>;

export const CONTENT_LOADER = new InjectionToken<ContentLoader>('CONTENT_LOADER');

export function browserContentLoader(): ContentLoader {
  const http = inject(HttpClient);
  return (path) => firstValueFrom(http.get<unknown>(`/content/${path}`));
}
