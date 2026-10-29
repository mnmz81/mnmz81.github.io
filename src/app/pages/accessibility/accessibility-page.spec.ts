import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { describe, expect, it } from 'vitest';
import { SITE } from '../../core/site.config';
import { AccessibilityPage } from './accessibility-page';

async function render() {
  const fixture = TestBed.createComponent(AccessibilityPage);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('AccessibilityPage', () => {
  it('names the standard and level', async () => {
    const text = (await render()).textContent ?? '';
    expect(text).toContain('WCAG 2.1 level AA');
    expect(text).toContain('IS 5568');
  });

  it('isolates the Hebrew standard name so it renders right-to-left', async () => {
    const he = (await render()).querySelector('bdi[lang="he"]');
    expect(he?.getAttribute('dir')).toBe('rtl');
    expect(he?.textContent).toBe('ת"י 5568');
  });

  it('gives a contact email and an update date', async () => {
    const el = await render();
    expect(el.querySelector('a[href^="mailto:"]')?.getAttribute('href')).toBe(SITE.social.email);
    expect(el.querySelector('time')?.getAttribute('datetime')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('uses a single h1 and sets the title', async () => {
    const el = await render();
    expect(el.querySelectorAll('h1')).toHaveLength(1);
    expect(TestBed.inject(Title).getTitle()).toBe('Accessibility · Moris Maor Zakay');
  });
});
