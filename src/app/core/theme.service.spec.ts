import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeService } from './theme.service';

function stubSystemDark(matches: boolean) {
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches }));
}

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });
  afterEach(() => vi.unstubAllGlobals());

  it('uses the stored theme first', () => {
    localStorage.setItem('theme', 'dark');
    stubSystemDark(false);
    expect(TestBed.inject(ThemeService).theme()).toBe('dark');
  });

  it('falls back to the system preference', () => {
    stubSystemDark(true);
    expect(TestBed.inject(ThemeService).theme()).toBe('dark');
  });

  it('defaults to light', () => {
    stubSystemDark(false);
    expect(TestBed.inject(ThemeService).theme()).toBe('light');
  });

  it('toggle switches theme, sets data-theme and persists', () => {
    stubSystemDark(false);
    const service = TestBed.inject(ThemeService);
    service.toggle();
    expect(service.theme()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
    service.toggle();
    expect(service.theme()).toBe('light');
    expect(localStorage.getItem('theme')).toBe('light');
  });
});
