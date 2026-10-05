import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SITE } from '../../../core/site.config';

interface SocialLink {
  label: string;
  href: string;
  icon: 'github' | 'linkedin' | 'email' | 'rss';
  external: boolean;
}

@Component({
  selector: 'app-site-footer',
  templateUrl: './site-footer.html',
  styleUrl: './site-footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteFooter {
  protected readonly year = new Date().getFullYear();
  protected readonly author = SITE.author;
  protected readonly social: SocialLink[] = [
    { label: 'GitHub', href: SITE.social.github, icon: 'github', external: true },
    { label: 'LinkedIn', href: SITE.social.linkedin, icon: 'linkedin', external: true },
    { label: 'Email', href: SITE.social.email, icon: 'email', external: false },
    ...(SITE.features.blog ? [{ label: 'RSS feed', href: '/rss.xml', icon: 'rss' as const, external: false }] : []),
  ];
}
