import { extname } from 'node:path';
import matter from 'gray-matter';

export type ContentType = 'Blog' | 'Project';

/** The subset of a Notion page object this sync reads. */
export interface NotionPageLike {
  id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  properties: Record<string, any>;
}

export interface NotionEntry {
  id: string;
  type: ContentType;
  slug: string;
  title: string;
  summary: string;
  date: string;
  tags: string[];
  tech: string[];
  repo?: string;
  url?: string;
  featured: boolean;
  order?: number;
}

export interface ImageDownload {
  url: string;
  file: string; // relative to public/, e.g. 'images/my-post/1.png'
}

const IMAGE_EXT = /^\.(png|jpe?g|gif|webp|svg|avif)$/;
const DEFAULT_PROJECT_ORDER = 99;
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const plain = (parts: any[] | undefined) => (parts ?? []).map((p) => p.plain_text).join('');
const text = (p: any) => (p?.type === 'title' ? plain(p.title) : p?.type === 'rich_text' ? plain(p.rich_text) : '');
const option = (p: any): string => (p?.type === 'select' ? p.select?.name : p?.type === 'status' ? p.status?.name : '') ?? '';
const options = (p: any): string[] => (p?.type === 'multi_select' ? p.multi_select.map((o: any) => o.name) : []);
const link = (p: any): string | undefined => (p?.type === 'url' && p.url ? p.url : undefined);
const day = (p: any): string => (p?.type === 'date' && p.date?.start ? String(p.date.start).slice(0, 10) : '');
const flag = (p: any): boolean => p?.type === 'checkbox' && p.checkbox === true;
const num = (p: any): number | undefined => (p?.type === 'number' && typeof p.number === 'number' ? p.number : undefined);
/* eslint-enable @typescript-eslint/no-explicit-any */

export function readEntry(page: NotionPageLike): NotionEntry {
  const p = page.properties;
  const type = option(p['Type']);
  if (type !== 'Blog' && type !== 'Project') throw new Error(`Notion page ${page.id}: Type must be Blog or Project`);
  const title = text(p['Title']).trim();
  const date = day(p['Date']);
  if (!date) throw new Error(`Notion page ${page.id} (${title}): Date is required`);
  const slug = slugify(text(p['Slug']) || title);
  if (!KEBAB.test(slug)) {
    throw new Error(`Notion page ${page.id} (${title}): Slug "${slug}" is empty or invalid; set the Slug property to kebab-case (e.g. my-post)`);
  }
  return {
    id: page.id,
    type,
    slug,
    title,
    summary: text(p['Summary']).trim(),
    date,
    tags: options(p['Tags']).map(slugify),
    tech: options(p['Tech']),
    repo: link(p['Repo']),
    url: link(p['URL']),
    featured: flag(p['Featured']),
    order: num(p['Order']),
  };
}

export function toMarkdownFile(entry: NotionEntry, body: string): string {
  const data =
    entry.type === 'Blog'
      ? { title: entry.title, summary: entry.summary, date: entry.date, tags: entry.tags }
      : {
          title: entry.title,
          summary: entry.summary,
          tech: entry.tech,
          ...(entry.repo ? { repo: entry.repo } : {}),
          ...(entry.url ? { url: entry.url } : {}),
          featured: entry.featured,
          order: entry.order ?? DEFAULT_PROJECT_ORDER,
          date: entry.date,
        };
  return matter.stringify(body.trim() ? `\n${body.trim()}\n` : '', data);
}

export function rewriteImages(markdown: string, slug: string): { markdown: string; downloads: ImageDownload[] } {
  const downloads: ImageDownload[] = [];
  const rewritten = markdown.replace(/!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g, (_match, alt: string, url: string) => {
    const ext = extname(new URL(url).pathname).toLowerCase();
    const file = `images/${slug}/${downloads.length + 1}${IMAGE_EXT.test(ext) ? ext.replace('.jpeg', '.jpg') : '.png'}`;
    downloads.push({ url, file });
    return `![${alt}](/${file})`;
  });
  return { markdown: rewritten, downloads };
}
