import { describe, expect, it } from 'vitest';
import matter from 'gray-matter';
import { postFrontmatter, projectFrontmatter } from '../content/schema';
import { readEntry, rewriteImages, slugify, toMarkdownFile, type NotionPageLike } from './mapping';

const rich = (s: string) => [{ plain_text: s }];

function page(overrides: Record<string, unknown> = {}): NotionPageLike {
  return {
    id: 'page-1',
    properties: {
      Title: { type: 'title', title: rich('Angular Signals in Practice!') },
      Slug: { type: 'rich_text', rich_text: [] },
      Type: { type: 'select', select: { name: 'Blog' } },
      Status: { type: 'status', status: { name: 'Published' } },
      Tags: { type: 'multi_select', multi_select: [{ name: 'Angular' }, { name: 'Web Dev' }] },
      Date: { type: 'date', date: { start: '2026-08-30T10:00:00.000+03:00' } },
      Summary: { type: 'rich_text', rich_text: rich('How signals changed my state code.') },
      Tech: { type: 'multi_select', multi_select: [] },
      Repo: { type: 'url', url: null },
      URL: { type: 'url', url: null },
      Featured: { type: 'checkbox', checkbox: false },
      Order: { type: 'number', number: null },
      ...overrides,
    },
  };
}

describe('slugify', () => {
  it('makes kebab-case slugs', () => {
    expect(slugify('Angular Signals in Practice!')).toBe('angular-signals-in-practice');
    expect(slugify('  Web   Dev_2 ')).toBe('web-dev-2');
  });
});

describe('readEntry', () => {
  it('reads a blog page, deriving the slug from the title', () => {
    expect(readEntry(page())).toMatchObject({
      id: 'page-1',
      type: 'Blog',
      slug: 'angular-signals-in-practice',
      title: 'Angular Signals in Practice!',
      summary: 'How signals changed my state code.',
      date: '2026-08-30',
      tags: ['angular', 'web-dev'],
    });
  });

  it('prefers an explicit slug', () => {
    expect(readEntry(page({ Slug: { type: 'rich_text', rich_text: rich('signals') } })).slug).toBe('signals');
  });

  it('accepts Type as a status-less select and reads project fields', () => {
    const entry = readEntry(
      page({
        Type: { type: 'select', select: { name: 'Project' } },
        Tech: { type: 'multi_select', multi_select: [{ name: 'Angular' }] },
        Repo: { type: 'url', url: 'https://github.com/mnmz81/x' },
        Featured: { type: 'checkbox', checkbox: true },
        Order: { type: 'number', number: 3 },
      }),
    );
    expect(entry).toMatchObject({ type: 'Project', tech: ['Angular'], repo: 'https://github.com/mnmz81/x', featured: true, order: 3 });
  });

  it('rejects pages without a valid Type', () => {
    expect(() => readEntry(page({ Type: { type: 'select', select: null } }))).toThrow(/Type must be Blog or Project/);
  });

  it('rejects pages without a date', () => {
    expect(() => readEntry(page({ Date: { type: 'date', date: null } }))).toThrow(/Date is required/);
  });
});

describe('toMarkdownFile', () => {
  it('writes contract frontmatter for a blog post', () => {
    const file = toMarkdownFile(readEntry(page()), 'Hello\n');
    const { data, content } = matter(file);
    expect(data).toEqual({
      title: 'Angular Signals in Practice!',
      summary: 'How signals changed my state code.',
      date: '2026-08-30',
      tags: ['angular', 'web-dev'],
    });
    expect(content.trim()).toBe('Hello');
  });

  it('writes contract frontmatter for a project without empty optional keys', () => {
    const entry = readEntry(
      page({
        Type: { type: 'select', select: { name: 'Project' } },
        Tech: { type: 'multi_select', multi_select: [{ name: 'Python' }] },
        Order: { type: 'number', number: 2 },
      }),
    );
    const { data } = matter(toMarkdownFile(entry, ''));
    expect(data).toEqual({
      title: 'Angular Signals in Practice!',
      summary: 'How signals changed my state code.',
      tech: ['Python'],
      featured: false,
      order: 2,
      date: '2026-08-30',
    });
  });
});

describe('rewriteImages', () => {
  it('rewrites remote images to local paths and lists downloads', () => {
    const md = '![a](https://s3.aws.com/x/photo.JPG?sig=1)\ntext\n![](https://img.dev/no-ext)';
    const { markdown, downloads } = rewriteImages(md, 'my-post');
    expect(markdown).toBe('![a](/images/my-post/1.jpg)\ntext\n![](/images/my-post/2.png)');
    expect(downloads).toEqual([
      { url: 'https://s3.aws.com/x/photo.JPG?sig=1', file: 'images/my-post/1.jpg' },
      { url: 'https://img.dev/no-ext', file: 'images/my-post/2.png' },
    ]);
  });

  it('leaves local images alone', () => {
    expect(rewriteImages('![a](/images/x/1.png)', 'x').downloads).toEqual([]);
  });
});

describe('schema compatibility', () => {
  it('produces files that pass the strict content schema', () => {
    const blog = matter(toMarkdownFile(readEntry(page()), 'Hello\n')).data;
    expect(postFrontmatter.parse(blog)).toMatchObject({ date: '2026-08-30', draft: false });

    const project = readEntry(
      page({
        Type: { type: 'select', select: { name: 'Project' } },
        Tech: { type: 'multi_select', multi_select: [{ name: 'Angular' }] },
        Repo: { type: 'url', url: 'https://github.com/mnmz81/x' },
        URL: { type: 'url', url: 'https://example.com' },
      }),
    );
    const parsed = projectFrontmatter.parse(matter(toMarkdownFile(project, '')).data);
    expect(parsed).toMatchObject({ order: 99, featured: false, date: '2026-08-30' });
  });
});
