import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildContent } from './collect';

function makeContent(files: Record<string, string>): { contentDir: string; outDir: string } {
  const root = mkdtempSync(join(tmpdir(), 'content-'));
  const contentDir = join(root, 'content');
  for (const [rel, body] of Object.entries(files)) {
    const file = join(contentDir, rel);
    mkdirSync(join(file, '..'), { recursive: true });
    writeFileSync(file, body);
  }
  mkdirSync(join(contentDir, 'blog'), { recursive: true });
  mkdirSync(join(contentDir, 'projects'), { recursive: true });
  return { contentDir, outDir: join(root, 'out') };
}

const post = (title: string, date: string, tags: string, extra = '') =>
  `---\ntitle: ${title}\nsummary: S\ndate: ${date}\ntags: [${tags}]\n${extra}---\n\n## Heading\n\nBody\n`;

const project = (title: string, order: number) =>
  `---\ntitle: ${title}\nsummary: S\ntech: [Angular]\norder: ${order}\ndate: 2026-01-01\n---\n`;

const readJson = (file: string) => JSON.parse(readFileSync(file, 'utf8'));

describe('buildContent', () => {
  it('writes index, posts and projects sorted per contract', async () => {
    const dirs = makeContent({
      'blog/older.md': post('Older', '2026-01-01', 'ai'),
      'blog/newer.md': post('Newer', '2026-02-01', 'ai, angular'),
      'projects/b.md': project('B', 2),
      'projects/a.md': project('A', 1),
    });
    await buildContent({ ...dirs, includeDrafts: false });

    const index = readJson(join(dirs.outDir, 'index.json'));
    expect(index.posts.map((p: { slug: string }) => p.slug)).toEqual(['newer', 'older']);
    expect(index.tags).toEqual([
      { tag: 'ai', count: 2 },
      { tag: 'angular', count: 1 },
    ]);
    expect(index.posts[0]).not.toHaveProperty('html');

    const newer = readJson(join(dirs.outDir, 'posts', 'newer.json'));
    expect(newer).toMatchObject({ slug: 'newer', title: 'Newer', date: '2026-02-01', readingMinutes: 1 });
    expect(newer.toc).toEqual([{ id: 'heading', text: 'Heading', depth: 2 }]);
    expect(newer).not.toHaveProperty('draft');

    expect(readJson(join(dirs.outDir, 'projects.json')).map((p: { slug: string }) => p.slug)).toEqual(['a', 'b']);
  });

  it('excludes drafts unless includeDrafts is true', async () => {
    const dirs = makeContent({ 'blog/wip.md': post('WIP', '2026-01-01', 'ai', 'draft: true\n') });
    await buildContent({ ...dirs, includeDrafts: false });
    expect(readJson(join(dirs.outDir, 'index.json')).posts).toEqual([]);
    expect(existsSync(join(dirs.outDir, 'posts', 'wip.json'))).toBe(false);

    await buildContent({ ...dirs, includeDrafts: true });
    expect(readJson(join(dirs.outDir, 'index.json')).posts).toHaveLength(1);
  });

  it('skips every post when includePosts is false', async () => {
    const dirs = makeContent({ 'blog/live.md': post('Live', '2026-01-01', 'ai'), 'projects/a.md': project('A', 1) });
    await buildContent({ ...dirs, includeDrafts: true, includePosts: false });
    const index = readJson(join(dirs.outDir, 'index.json'));
    expect(index.posts).toEqual([]);
    expect(index.tags).toEqual([]);
    expect(existsSync(join(dirs.outDir, 'posts', 'live.json'))).toBe(false);
    expect(readJson(join(dirs.outDir, 'projects.json'))).toHaveLength(1);
  });

  it('removes JSON for posts that no longer exist', async () => {
    const dirs = makeContent({ 'blog/keep.md': post('Keep', '2026-01-01', 'ai') });
    mkdirSync(join(dirs.outDir, 'posts'), { recursive: true });
    writeFileSync(join(dirs.outDir, 'posts', 'stale.json'), '{}');
    await buildContent({ ...dirs, includeDrafts: false });
    expect(existsSync(join(dirs.outDir, 'posts', 'stale.json'))).toBe(false);
  });

  it('reports every invalid file by path', async () => {
    const dirs = makeContent({
      'blog/bad-one.md': '---\ntitle: X\n---\n',
      'projects/bad-two.md': '---\ntitle: Y\n---\n',
    });
    await expect(buildContent({ ...dirs, includeDrafts: false })).rejects.toThrow(/bad-one\.md[\s\S]*bad-two\.md/);
  });
});
