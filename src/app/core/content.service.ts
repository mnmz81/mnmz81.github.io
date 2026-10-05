import { Injectable, TransferState, inject, makeStateKey } from '@angular/core';
import { CONTENT_LOADER } from './content-loader';
import type { ContentIndex, Post, Project } from './content.models';

@Injectable({ providedIn: 'root' })
export class ContentService {
  private readonly load = inject(CONTENT_LOADER);
  private readonly state = inject(TransferState);

  getIndex(): Promise<ContentIndex> {
    return this.get<ContentIndex>('index.json');
  }

  getPost(slug: string): Promise<Post> {
    return this.get<Post>(`posts/${slug}.json`);
  }

  getProjects(): Promise<Project[]> {
    return this.get<Project[]>('projects.json');
  }

  private async get<T>(path: string): Promise<T> {
    const key = makeStateKey<T>(`content:${path}`);
    const cached = this.state.get(key, null);
    if (cached !== null) return cached;
    const data = (await this.load(path)) as T;
    this.state.set(key, data);
    return data;
  }
}
