import type { ContentIndex, Post, Project } from '../app/core/content.models';
import index from './fixtures/content/index.json';
import post from './fixtures/content/posts/angular-signals-in-practice.json';
import projects from './fixtures/content/projects.json';

export const FIXTURE_INDEX = index as unknown as ContentIndex;
export const FIXTURE_POST = post as unknown as Post;
export const FIXTURE_PROJECTS = projects as unknown as Project[];
