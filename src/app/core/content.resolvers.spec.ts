import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RedirectCommand, RouterStateSnapshot, convertToParamMap, provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { FIXTURE_INDEX, FIXTURE_POST, FIXTURE_PROJECTS } from '../../testing/fixtures';
import { CONTENT_LOADER } from './content-loader';
import { indexResolver, postResolver, projectsResolver } from './content.resolvers';

function setup() {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      {
        provide: CONTENT_LOADER,
        useValue: async (path: string) => {
          if (path === 'index.json') return FIXTURE_INDEX;
          if (path === 'projects.json') return FIXTURE_PROJECTS;
          if (path === `posts/${FIXTURE_POST.slug}.json`) return FIXTURE_POST;
          throw new Error('not found');
        },
      },
    ],
  });
}

const routeWith = (slug: string) => ({ paramMap: convertToParamMap({ slug }) }) as unknown as ActivatedRouteSnapshot;
const state = {} as RouterStateSnapshot;

describe('content resolvers', () => {
  it('indexResolver returns the index', async () => {
    setup();
    expect(await TestBed.runInInjectionContext(() => indexResolver(routeWith(''), state))).toEqual(FIXTURE_INDEX);
  });

  it('projectsResolver returns projects', async () => {
    setup();
    expect(await TestBed.runInInjectionContext(() => projectsResolver(routeWith(''), state))).toEqual(FIXTURE_PROJECTS);
  });

  it('postResolver returns the post', async () => {
    setup();
    expect(await TestBed.runInInjectionContext(() => postResolver(routeWith(FIXTURE_POST.slug), state))).toEqual(FIXTURE_POST);
  });

  it('postResolver redirects to /404 for a missing post', async () => {
    setup();
    const result = await TestBed.runInInjectionContext(() => postResolver(routeWith('missing'), state));
    expect(result).toBeInstanceOf(RedirectCommand);
    expect((result as RedirectCommand).redirectTo.toString()).toBe('/404');
  });
});
