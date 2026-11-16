import { ChangeDetectionStrategy, Component, type Signal, inject, signal } from '@angular/core';
import { Router, RouterLink, isActive } from '@angular/router';
import { NavLink as MuiNavLink, SiteHeader as MuiSiteHeader } from '@mushilu-san/ui/navigation';
import { SITE } from '../../../core/site.config';
import { ThemeToggle } from '../theme-toggle/theme-toggle';

interface NavLink {
  label: string;
  path: string;
  /** Current section; a signal, so the OnPush header follows navigation. Not set on external links. */
  active?: Signal<boolean>;
  /** Absolute URL outside this site; opens in a new tab. */
  external?: boolean;
}

@Component({
  selector: 'app-site-header',
  imports: [RouterLink, ThemeToggle, MuiNavLink, MuiSiteHeader],
  templateUrl: './site-header.html',
  styleUrl: './site-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteHeader {
  private readonly router = inject(Router);

  protected readonly links: NavLink[] = [
    this.internal('About', '/about'),
    this.internal('Projects', '/projects'),
    // The built-in blog is off: Blog points at the external learning blog (Loom).
    SITE.features.blog ? this.internal('Blog', '/blog') : { label: 'Blog', path: SITE.blogUrl, external: true },
  ];
  protected readonly menuOpen = signal(false);

  private internal(label: string, path: string): NavLink {
    const active = isActive(path, this.router, {
      paths: 'subset',
      queryParams: 'ignored',
      fragment: 'ignored',
      matrixParams: 'ignored',
    });
    return { label, path, active };
  }
}
