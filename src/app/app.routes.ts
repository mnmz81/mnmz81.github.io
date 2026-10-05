import { Routes } from '@angular/router';
import { indexResolver, postResolver, projectsResolver } from './core/content.resolvers';
import { SITE } from './core/site.config';

const blogRoutes: Routes = [
  {
    path: 'blog',
    loadComponent: () => import('./pages/blog-list/blog-list-page').then((m) => m.BlogListPage),
    resolve: { index: indexResolver },
  },
  {
    path: 'blog/tags/:tag',
    loadComponent: () => import('./pages/tag/tag-page').then((m) => m.TagPage),
    resolve: { index: indexResolver },
  },
  {
    path: 'blog/:slug',
    loadComponent: () => import('./pages/blog-post/blog-post-page').then((m) => m.BlogPostPage),
    resolve: { post: postResolver },
  },
];

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home-page').then((m) => m.HomePage),
    resolve: { index: indexResolver, projects: projectsResolver },
  },
  { path: 'about', loadComponent: () => import('./pages/about/about-page').then((m) => m.AboutPage) },
  {
    path: 'projects',
    loadComponent: () => import('./pages/projects/projects-page').then((m) => m.ProjectsPage),
    resolve: { projects: projectsResolver },
  },
  ...(SITE.features.blog ? blogRoutes : []),
  { path: '404', loadComponent: () => import('./pages/not-found/not-found-page').then((m) => m.NotFoundPage) },
  { path: '**', loadComponent: () => import('./pages/not-found/not-found-page').then((m) => m.NotFoundPage) },
];
