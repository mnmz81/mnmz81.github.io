import { describe, expect, it } from 'vitest';
import { postFrontmatter, projectFrontmatter, slugFromFile } from './schema';

describe('postFrontmatter', () => {
  const valid = { title: 'T', summary: 'S', date: '2026-08-30', tags: ['angular'] };

  it('accepts valid frontmatter and defaults draft to false', () => {
    expect(postFrontmatter.parse(valid)).toEqual({ ...valid, draft: false });
  });

  it('converts YAML Date objects to YYYY-MM-DD', () => {
    expect(postFrontmatter.parse({ ...valid, date: new Date('2026-08-30T00:00:00Z') }).date).toBe('2026-08-30');
  });

  it('rejects a missing title', () => {
    const { title: _omit, ...rest } = valid;
    expect(() => postFrontmatter.parse(rest)).toThrow();
  });

  it('rejects a bad date format', () => {
    expect(() => postFrontmatter.parse({ ...valid, date: '30/08/2026' })).toThrow();
  });

  it('rejects non-kebab tags', () => {
    expect(() => postFrontmatter.parse({ ...valid, tags: ['Angular Signals'] })).toThrow();
  });

  it('rejects empty tags', () => {
    expect(() => postFrontmatter.parse({ ...valid, tags: [] })).toThrow();
  });

  it('rejects summaries over 200 chars', () => {
    expect(() => postFrontmatter.parse({ ...valid, summary: 'x'.repeat(201) })).toThrow();
  });

  it('rejects unknown keys', () => {
    expect(() => postFrontmatter.parse({ ...valid, author: 'me' })).toThrow();
  });
});

describe('projectFrontmatter', () => {
  const valid = { title: 'P', summary: 'S', tech: ['Angular'], order: 1, date: '2026-10-04' };

  it('accepts valid frontmatter and defaults featured to false', () => {
    expect(projectFrontmatter.parse(valid)).toEqual({ ...valid, featured: false });
  });

  it('rejects a non-URL repo', () => {
    expect(() => projectFrontmatter.parse({ ...valid, repo: 'github.com/x' })).toThrow();
  });
});

describe('slugFromFile', () => {
  it('returns the filename without extension', () => {
    expect(slugFromFile('/a/b/my-post.md')).toBe('my-post');
  });

  it('rejects non-kebab filenames', () => {
    expect(() => slugFromFile('/a/My Post.md')).toThrow(/kebab-case/);
  });
});
