import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { type NotionPageLike, readEntry, rewriteImages, toMarkdownFile } from './mapping';

export interface NotionSource {
  listPublished(): Promise<NotionPageLike[]>;
  pageMarkdown(pageId: string): Promise<string>;
}

export type Downloader = (url: string, destination: string) => Promise<void>;

export interface SyncOptions {
  source: NotionSource;
  download: Downloader;
  contentDir: string;
  publicDir: string;
}

export async function runSync({ source, download, contentDir, publicDir }: SyncOptions): Promise<{ written: string[] }> {
  const written: string[] = [];
  const errors: string[] = [];

  for (const page of await source.listPublished()) {
    try {
      const entry = readEntry(page);
      const isBlog = entry.type === 'Blog';
      let body = '';
      if (isBlog) {
        const { markdown, downloads } = rewriteImages(await source.pageMarkdown(page.id), entry.slug);
        const imagesRoot = resolve(publicDir, 'images');
        const imageDir = resolve(imagesRoot, entry.slug);
        const rel = relative(imagesRoot, imageDir);
        if (!rel || rel.startsWith('..') || isAbsolute(rel)) throw new Error(`Refusing to clear image directory for slug "${entry.slug}"`);
        rmSync(imageDir, { recursive: true, force: true });
        for (const { url, file } of downloads) {
          const destination = join(publicDir, file);
          mkdirSync(dirname(destination), { recursive: true });
          await download(url, destination);
        }
        body = markdown;
      }
      const file = join(contentDir, isBlog ? 'blog' : 'projects', `${entry.slug}.md`);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, toMarkdownFile(entry, body));
      written.push(file);
    } catch (error) {
      errors.push(`${page.id}: ${(error as Error).message}`);
    }
  }

  if (errors.length) throw new Error(`Notion sync finished with errors (${written.length} written):\n${errors.join('\n')}`);
  return { written };
}
