import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import type { NotionPageLike } from './mapping';
import { runSync, type NotionSource } from './sync';

const rich = (s: string) => [{ plain_text: s }];
const blogPage = (id: string, title: string): NotionPageLike => ({
  id,
  properties: {
    Title: { type: 'title', title: rich(title) },
    Type: { type: 'select', select: { name: 'Blog' } },
    Tags: { type: 'multi_select', multi_select: [{ name: 'ai' }] },
    Date: { type: 'date', date: { start: '2026-09-01' } },
    Summary: { type: 'rich_text', rich_text: rich('Sum') },
  },
});

function dirs() {
  const root = mkdtempSync(join(tmpdir(), 'notion-'));
  return { contentDir: join(root, 'content'), publicDir: join(root, 'public') };
}

describe('runSync', () => {
  it('writes markdown and downloads images', async () => {
    const source: NotionSource = {
      listPublished: async () => [blogPage('p1', 'First Post')],
      pageMarkdown: async () => 'Intro\n\n![shot](https://files.notion.so/a/shot.png?x=1)\n',
    };
    const download = vi.fn(async () => undefined);
    const { contentDir, publicDir } = dirs();

    const result = await runSync({ source, download, contentDir, publicDir });

    const file = join(contentDir, 'blog', 'first-post.md');
    expect(result.written).toEqual([file]);
    const md = readFileSync(file, 'utf8');
    expect(md).toContain('title: First Post');
    expect(md).toContain('![shot](/images/first-post/1.png)');
    expect(download).toHaveBeenCalledWith('https://files.notion.so/a/shot.png?x=1', join(publicDir, 'images', 'first-post', '1.png'));
  });

  it('continues past a bad page and reports it', async () => {
    const bad: NotionPageLike = { id: 'bad', properties: {} };
    const source: NotionSource = {
      listPublished: async () => [bad, blogPage('p2', 'Good One')],
      pageMarkdown: async () => 'Body',
    };
    const { contentDir, publicDir } = dirs();

    await expect(runSync({ source, download: async () => undefined, contentDir, publicDir })).rejects.toThrow(/bad/);
    expect(existsSync(join(contentDir, 'blog', 'good-one.md'))).toBe(true);
  });

  it('rejects a page whose slug is empty without touching existing images', async () => {
    const source: NotionSource = {
      listPublished: async () => [blogPage('he', 'שלום עולם')],
      pageMarkdown: async () => 'Body',
    };
    const { contentDir, publicDir } = dirs();
    const existing = join(publicDir, 'images', 'other', 'x.png');
    mkdirSync(join(publicDir, 'images', 'other'), { recursive: true });
    writeFileSync(existing, 'png');

    await expect(runSync({ source, download: async () => undefined, contentDir, publicDir })).rejects.toThrow(/Slug/);
    expect(existsSync(existing)).toBe(true);
    expect(existsSync(join(contentDir, 'blog', '.md'))).toBe(false);
  });
});
