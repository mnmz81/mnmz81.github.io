import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';
import { SeoService, formatTitle } from './seo.service';

const meta = (attr: 'name' | 'property', key: string) =>
  document.head.querySelector(`meta[${attr}="${key}"]`)?.getAttribute('content');

describe('formatTitle', () => {
  it('keeps the site title unchanged', () => {
    expect(formatTitle('Moris Maor Zakay')).toBe('Moris Maor Zakay');
  });

  it('suffixes page titles with the site title', () => {
    expect(formatTitle('Blog')).toBe('Blog · Moris Maor Zakay');
  });
});

describe('SeoService', () => {
  let seo: SeoService;
  beforeEach(() => {
    document.head.querySelectorAll('meta, link[rel="canonical"], script[type="application/ld+json"]').forEach((n) => n.remove());
    seo = TestBed.inject(SeoService);
  });

  it('sets title, description and canonical', () => {
    seo.set({ title: 'About', description: 'About me', path: '/about' });
    expect(TestBed.inject(Title).getTitle()).toBe('About · Moris Maor Zakay');
    expect(meta('name', 'description')).toBe('About me');
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://mnmz81.github.io/about/');
  });

  it('sets Open Graph and Twitter tags with absolute default image', () => {
    seo.set({ title: 'About', description: 'About me', path: '/about' });
    expect(meta('property', 'og:title')).toBe('About · Moris Maor Zakay');
    expect(meta('property', 'og:description')).toBe('About me');
    expect(meta('property', 'og:url')).toBe('https://mnmz81.github.io/about/');
    expect(meta('property', 'og:type')).toBe('website');
    expect(meta('property', 'og:image')).toBe('https://mnmz81.github.io/og/default.png');
    expect(meta('property', 'og:site_name')).toBe('Moris Maor Zakay');
    expect(meta('name', 'twitter:card')).toBe('summary_large_image');
    expect(meta('name', 'twitter:image')).toBe('https://mnmz81.github.io/og/default.png');
  });

  it('sets article meta and replaces tags between pages', () => {
    seo.set({
      title: 'Post',
      description: 'd',
      path: '/blog/post',
      type: 'article',
      image: '/og/post.png',
      publishedTime: '2026-08-30',
      tags: ['a', 'b'],
    });
    expect(meta('property', 'og:type')).toBe('article');
    expect(meta('property', 'og:image')).toBe('https://mnmz81.github.io/og/post.png');
    expect(meta('property', 'article:published_time')).toBe('2026-08-30');
    expect(document.head.querySelectorAll('meta[property="article:tag"]')).toHaveLength(2);

    seo.set({ title: 'About', description: 'd', path: '/about' });
    expect(document.head.querySelectorAll('meta[property="article:tag"]')).toHaveLength(0);
    expect(meta('property', 'article:published_time')).toBeUndefined();
  });

  it('writes a single JSON-LD script and removes it when absent', () => {
    seo.set({ title: 'Home', description: 'd', path: '/', jsonLd: { '@type': 'Person', name: 'A </script>' } });
    seo.set({ title: 'Home', description: 'd', path: '/', jsonLd: { '@type': 'Person', name: 'B' } });
    const scripts = document.head.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts).toHaveLength(1);
    expect(JSON.parse(scripts[0].textContent ?? '')).toEqual({ '@type': 'Person', name: 'B' });

    seo.set({ title: 'About', description: 'd', path: '/about' });
    expect(document.head.querySelector('script[type="application/ld+json"]')).toBeNull();
  });

  it('escapes "<" inside JSON-LD', () => {
    seo.set({ title: 'Home', description: 'd', path: '/', jsonLd: { name: 'A </script>' } });
    expect(document.head.querySelector('script[type="application/ld+json"]')?.textContent).not.toContain('</script>');
  });
});
