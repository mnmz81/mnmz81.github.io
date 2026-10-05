import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { SITE } from '../../../core/site.config';
import { setBlogEnabled } from '../../../../testing/blog-flag';
import { SiteFooter } from './site-footer';

describe('SiteFooter', () => {
  it('renders social links with accessible labels', async () => {
    const restore = setBlogEnabled(true);
    const fixture = TestBed.createComponent(SiteFooter);
    restore();
    await fixture.whenStable();
    const links: HTMLAnchorElement[] = [...fixture.nativeElement.querySelectorAll('.site-footer__social a')];
    expect(links.map((a) => [a.getAttribute('aria-label'), a.getAttribute('href')])).toEqual([
      ['GitHub', SITE.social.github],
      ['LinkedIn', SITE.social.linkedin],
      ['Email', SITE.social.email],
      ['RSS feed', '/rss.xml'],
    ]);
    expect(links[0].getAttribute('rel')).toBe('noopener noreferrer');
    expect(links[2].getAttribute('target')).toBeNull();
  });

  it('omits the RSS link when the blog is off', async () => {
    const restore = setBlogEnabled(false);
    const fixture = TestBed.createComponent(SiteFooter);
    restore();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('a[href="/rss.xml"]')).toBeNull();
  });

  it('shows the current year', async () => {
    const fixture = TestBed.createComponent(SiteFooter);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain(String(new Date().getFullYear()));
  });
});
