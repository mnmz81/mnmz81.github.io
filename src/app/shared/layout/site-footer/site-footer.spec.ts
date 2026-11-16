import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { SITE } from '../../../core/site.config';
import { setBlogEnabled } from '../../../../testing/blog-flag';
import { SiteFooter } from './site-footer';

describe('SiteFooter', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter([])] }));

  it('links to the accessibility statement', async () => {
    const fixture = TestBed.createComponent(SiteFooter);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.site-footer__link')?.getAttribute('href')).toBe('/accessibility');
  });

  it('shows the email address as a mailto link in the contact block', async () => {
    const fixture = TestBed.createComponent(SiteFooter);
    await fixture.whenStable();
    const email: HTMLAnchorElement = fixture.nativeElement.querySelector('#contact .site-footer__email');
    expect(email.getAttribute('href')).toBe(SITE.social.email);
    expect(`mailto:${email.textContent}`).toBe(SITE.social.email);
  });

  it('renders social links with visible labels', async () => {
    const restore = setBlogEnabled(true);
    const fixture = TestBed.createComponent(SiteFooter);
    restore();
    await fixture.whenStable();
    const links: HTMLAnchorElement[] = [...fixture.nativeElement.querySelectorAll('.site-footer__social a')];
    expect(links.map((a) => [a.textContent?.replace(/\s+/g, ' ').trim(), a.getAttribute('href')])).toEqual([
      ['GitHub (opens in a new tab)', SITE.social.github],
      ['LinkedIn (opens in a new tab)', SITE.social.linkedin],
      ['Email', SITE.social.email],
      ['RSS feed', '/rss.xml'],
    ]);
    expect(links[0].getAttribute('rel')).toBe('noopener noreferrer');
    expect(links[2].getAttribute('target')).toBeNull();
  });

  it('links to the external blog instead of RSS when the blog is off', async () => {
    const restore = setBlogEnabled(false);
    const fixture = TestBed.createComponent(SiteFooter);
    restore();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('a[href="/rss.xml"]')).toBeNull();
    expect(fixture.nativeElement.querySelector(`.site-footer__social a[href="${SITE.blogUrl}"]`)).not.toBeNull();
  });

  it('shows the current year', async () => {
    const fixture = TestBed.createComponent(SiteFooter);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain(String(new Date().getFullYear()));
  });
});
