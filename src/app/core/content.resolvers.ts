import { inject } from '@angular/core';
import { RedirectCommand, ResolveFn, Router } from '@angular/router';
import type { ContentIndex, Post, Project } from './content.models';
import { ContentService } from './content.service';

export const indexResolver: ResolveFn<ContentIndex> = () => inject(ContentService).getIndex();

export const projectsResolver: ResolveFn<Project[]> = () => inject(ContentService).getProjects();

export const postResolver: ResolveFn<Post | RedirectCommand> = async (route) => {
  // Inject before the first await: the injection context ends there.
  const content = inject(ContentService);
  const router = inject(Router);
  try {
    return await content.getPost(route.paramMap.get('slug') ?? '');
  } catch {
    return new RedirectCommand(router.parseUrl('/404'));
  }
};
