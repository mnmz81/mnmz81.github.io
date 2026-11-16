import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SITE } from '../../../core/site.config';
import { setBlogEnabled } from '../../../../testing/blog-flag';
import { SiteHeader } from './site-header';

@Component({ template: '' })
class Blank {}

describe('SiteHeader', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: '**', component: Blank }])],
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('renders brand and nav links', async () => {
    const restore = setBlogEnabled(true);
    const fixture = TestBed.createComponent(SiteHeader);
    restore();
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    const hrefs = [...el.querySelectorAll('nav a')].map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/about', '/projects', '/blog']);
    expect(el.querySelector('.site-header__brand')?.getAttribute('href')).toBe('/');
    expect(el.querySelector('app-theme-toggle')).not.toBeNull();
  });

  it('points Blog at the external blog, in a new tab, when the built-in blog is off', async () => {
    const restore = setBlogEnabled(false);
    const fixture = TestBed.createComponent(SiteHeader);
    restore();
    await fixture.whenStable();
    const links: HTMLAnchorElement[] = [...fixture.nativeElement.querySelectorAll('nav a')];
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['/about', '/projects', SITE.blogUrl]);
    expect(links[2].getAttribute('target')).toBe('_blank');
    expect(links[2].getAttribute('rel')).toBe('noopener noreferrer');
    expect(links[2].getAttribute('aria-label')).toBe('Blog (opens in a new tab)');
  });

  it('toggles the mobile menu, and Escape closes it and returns focus to the menu button', async () => {
    const fixture = TestBed.createComponent(SiteHeader);
    const el: HTMLElement = fixture.nativeElement;
    document.body.appendChild(el);
    await fixture.whenStable();
    const button = el.querySelector<HTMLButtonElement>('button[aria-controls]')!;
    const firstLink = el.querySelector<HTMLAnchorElement>('nav a')!;
    // The library hides the button on wide screens and jsdom has no viewport: show it, or it cannot take focus.
    button.style.display = 'inline-flex';
    expect(el.querySelector('nav')?.id).toBe(button.getAttribute('aria-controls'));
    expect(button.getAttribute('aria-expanded')).toBe('false');

    button.click();
    await fixture.whenStable();
    expect(button.getAttribute('aria-expanded')).toBe('true');

    firstLink.focus();
    firstLink.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(button);
    el.remove();
  });

  it('marks the active section with aria-current', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/blog/some-post');
    const restore = setBlogEnabled(true);
    const fixture = TestBed.createComponent(SiteHeader);
    restore();
    await fixture.whenStable();
    const blog = [...fixture.nativeElement.querySelectorAll('nav a')].find((a: Element) => a.textContent?.trim() === 'Blog');
    expect(blog?.getAttribute('aria-current')).toBe('page');
  });
});
