import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import type { ContentIndex, Post, PostMeta, Project, TagCount } from '../../src/app/core/content.models';
import { createRenderer } from './markdown';
import { postFrontmatter, projectFrontmatter, slugFromFile } from './schema';

export interface BuildOptions {
  contentDir: string;
  outDir: string;
  includeDrafts: boolean;
}

export interface BuildResult {
  index: ContentIndex;
  projects: Project[];
}

function markdownFiles(dir: string): string[] {
  try {
    return readdirSync(dir)
      .filter((f) => f.endsWith('.md'))
      .sort()
      .map((f) => join(dir, f));
  } catch {
    return [];
  }
}

function countTags(posts: PostMeta[]): TagCount[] {
  const counts = new Map<string, number>();
  for (const post of posts) for (const tag of post.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  return [...counts]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export async function buildContent({ contentDir, outDir, includeDrafts }: BuildOptions): Promise<BuildResult> {
  const render = await createRenderer();
  const errors: string[] = [];
  const posts: Post[] = [];
  const projects: Project[] = [];

  for (const file of markdownFiles(join(contentDir, 'blog'))) {
    try {
      const { data, content } = matter(readFileSync(file, 'utf8'));
      const { draft, ...fm } = postFrontmatter.parse(data);
      if (draft && !includeDrafts) continue;
      posts.push({ slug: slugFromFile(file), ...fm, ...render(content) });
    } catch (error) {
      errors.push(`${file}: ${(error as Error).message}`);
    }
  }

  for (const file of markdownFiles(join(contentDir, 'projects'))) {
    try {
      const { data } = matter(readFileSync(file, 'utf8'));
      projects.push({ slug: slugFromFile(file), ...projectFrontmatter.parse(data) });
    } catch (error) {
      errors.push(`${file}: ${(error as Error).message}`);
    }
  }

  if (errors.length) throw new Error(`Invalid content:\n${errors.join('\n')}`);

  posts.sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
  projects.sort((a, b) => a.order - b.order);

  const metas: PostMeta[] = posts.map(({ html: _html, toc: _toc, ...meta }) => meta);
  const index: ContentIndex = { generatedAt: new Date().toISOString(), posts: metas, tags: countTags(metas) };

  rmSync(join(outDir, 'posts'), { recursive: true, force: true });
  mkdirSync(join(outDir, 'posts'), { recursive: true });
  writeFileSync(join(outDir, 'index.json'), JSON.stringify(index, null, 2));
  writeFileSync(join(outDir, 'projects.json'), JSON.stringify(projects, null, 2));
  for (const post of posts) writeFileSync(join(outDir, 'posts', `${post.slug}.json`), JSON.stringify(post));

  return { index, projects };
}
