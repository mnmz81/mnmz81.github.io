import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { describe, expect, it } from 'vitest';
import { SeoService, formatTitle } from './seo.service';

describe('formatTitle', () => {
  it('keeps the site title unchanged', () => {
    expect(formatTitle('Moris Maor Zakay')).toBe('Moris Maor Zakay');
  });

  it('suffixes page titles with the site title', () => {
    expect(formatTitle('Blog')).toBe('Blog · Moris Maor Zakay');
  });
});

describe('SeoService', () => {
  it('sets the document title', () => {
    TestBed.inject(SeoService).set({ title: 'About', description: 'x', path: '/about' });
    expect(TestBed.inject(Title).getTitle()).toBe('About · Moris Maor Zakay');
  });
});
