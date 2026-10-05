import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
    const fixture = TestBed.createComponent(SiteHeader);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    const hrefs = [...el.querySelectorAll('nav a')].map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/about', '/projects', '/blog']);
    expect(el.querySelector('.site-header__brand')?.getAttribute('href')).toBe('/');
    expect(el.querySelector('app-theme-toggle')).not.toBeNull();
  });

  it('toggles the mobile menu and closes it on Escape', async () => {
    const fixture = TestBed.createComponent(SiteHeader);
    await fixture.whenStable();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.site-header__menu-btn');
    expect(button.getAttribute('aria-expanded')).toBe('false');

    button.click();
    await fixture.whenStable();
    expect(button.getAttribute('aria-expanded')).toBe('true');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('returns focus to the menu button when Escape closes the open menu', async () => {
    const fixture = TestBed.createComponent(SiteHeader);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.site-header__menu-btn');
    button.style.display = 'inline-grid'; // the button is only displayed below 768px; jsdom ignores media queries
    const firstLink: HTMLAnchorElement = fixture.nativeElement.querySelector('nav a');

    button.click();
    await fixture.whenStable();
    firstLink.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();
    expect(document.activeElement).toBe(button);

    // Escape while closed must not steal focus.
    firstLink.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();
    expect(document.activeElement).toBe(firstLink);
    fixture.nativeElement.remove();
  });

  it('marks the active section with aria-current', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/blog/some-post');
    const fixture = TestBed.createComponent(SiteHeader);
    await fixture.whenStable();
    const blog = [...fixture.nativeElement.querySelectorAll('nav a')].find((a: Element) => a.textContent?.trim() === 'Blog');
    expect(blog?.getAttribute('aria-current')).toBe('page');
  });
});
