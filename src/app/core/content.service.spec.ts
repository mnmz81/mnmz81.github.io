import { TestBed } from '@angular/core/testing';
import { TransferState, makeStateKey } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';
import { FIXTURE_INDEX, FIXTURE_POST, FIXTURE_PROJECTS } from '../../testing/fixtures';
import { CONTENT_LOADER } from './content-loader';
import { ContentService } from './content.service';

function setup() {
  const loader = vi.fn(async (path: string) => {
    if (path === 'index.json') return FIXTURE_INDEX;
    if (path === `posts/${FIXTURE_POST.slug}.json`) return FIXTURE_POST;
    if (path === 'projects.json') return FIXTURE_PROJECTS;
    throw new Error(`not found: ${path}`);
  });
  TestBed.configureTestingModule({ providers: [{ provide: CONTENT_LOADER, useValue: loader }] });
  return { service: TestBed.inject(ContentService), loader };
}

describe('ContentService', () => {
  it('loads the index', async () => {
    const { service, loader } = setup();
    expect(await service.getIndex()).toEqual(FIXTURE_INDEX);
    expect(loader).toHaveBeenCalledWith('index.json');
  });

  it('loads a post by slug', async () => {
    const { service } = setup();
    expect(await service.getPost(FIXTURE_POST.slug)).toEqual(FIXTURE_POST);
  });

  it('loads projects', async () => {
    const { service } = setup();
    expect(await service.getProjects()).toEqual(FIXTURE_PROJECTS);
  });

  it('caches results in TransferState', async () => {
    const { service, loader } = setup();
    await service.getIndex();
    await service.getIndex();
    expect(loader).toHaveBeenCalledTimes(1);
    expect(TestBed.inject(TransferState).get(makeStateKey('content:index.json'), null)).toEqual(FIXTURE_INDEX);
  });

  it('rejects when the file is missing', async () => {
    const { service } = setup();
    await expect(service.getPost('missing')).rejects.toThrow('not found');
  });
});
