import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeToggle } from './theme-toggle';

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
  });
  afterEach(() => vi.unstubAllGlobals());

  it('labels the action and toggles the theme on click', async () => {
    const fixture = TestBed.createComponent(ThemeToggle);
    await fixture.whenStable();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(button.getAttribute('aria-label')).toBe('Switch to dark theme');

    button.click();
    await fixture.whenStable();
    expect(button.getAttribute('aria-label')).toBe('Switch to light theme');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
