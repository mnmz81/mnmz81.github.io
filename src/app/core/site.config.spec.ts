import { describe, expect, it } from 'vitest';
import { SITE, pageUrl } from './site.config';

describe('pageUrl', () => {
  it('returns the site root with a trailing slash', () => {
    expect(pageUrl('/')).toBe(`${SITE.url}/`);
  });

  it('adds exactly one trailing slash to other pages', () => {
    expect(pageUrl('/about')).toBe(`${SITE.url}/about/`);
    expect(pageUrl('/blog/a-post')).toBe(`${SITE.url}/blog/a-post/`);
    expect(pageUrl('/blog/')).toBe(`${SITE.url}/blog/`);
  });

  it('accepts a custom base', () => {
    expect(pageUrl('/about', 'https://example.dev')).toBe('https://example.dev/about/');
  });
});
