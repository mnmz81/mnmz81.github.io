import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button, Icon } from '@mushilu-san/ui/primitives';
import { SITE } from '../../../core/site.config';

interface SocialLink {
  label: string;
  href: string;
  /** A built-in `mui-icon` name, or `linkedin` (registered in app.config.ts). */
  icon: 'github' | 'linkedin' | 'mail' | 'rss' | 'link';
  external: boolean;
}

@Component({
  selector: 'app-site-footer',
  imports: [RouterLink, Button, Icon],
  templateUrl: './site-footer.html',
  styleUrl: './site-footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteFooter {
  protected readonly year = new Date().getFullYear();
  protected readonly author = SITE.author;
  protected readonly email = { href: SITE.social.email, address: SITE.social.email.replace('mailto:', '') };
  protected readonly social: SocialLink[] = [
    { label: 'GitHub', href: SITE.social.github, icon: 'github', external: true },
    { label: 'LinkedIn', href: SITE.social.linkedin, icon: 'linkedin', external: true },
    { label: 'Email', href: SITE.social.email, icon: 'mail', external: false },
    SITE.features.blog
      ? { label: 'RSS feed', href: '/rss.xml', icon: 'rss', external: false }
      : { label: 'Blog', href: SITE.blogUrl, icon: 'link', external: true },
  ];
}
