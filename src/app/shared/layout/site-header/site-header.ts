import { ChangeDetectionStrategy, Component, ElementRef, signal, viewChild } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SITE } from '../../../core/site.config';
import { ThemeToggle } from '../theme-toggle/theme-toggle';

interface NavLink {
  label: string;
  path: string;
  /** Absolute URL outside this site; opens in a new tab. */
  external?: boolean;
}

@Component({
  selector: 'app-site-header',
  imports: [RouterLink, RouterLinkActive, ThemeToggle],
  templateUrl: './site-header.html',
  styleUrl: './site-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'onEscape()' },
})
export class SiteHeader {
  protected readonly links: NavLink[] = [
    { label: 'About', path: '/about' },
    { label: 'Projects', path: '/projects' },
    // The built-in blog is off: Blog points at the external learning blog (Loom).
    SITE.features.blog ? { label: 'Blog', path: '/blog' } : { label: 'Blog', path: SITE.blogUrl, external: true },
  ];
  protected readonly menuOpen = signal(false);
  private readonly menuButton = viewChild.required<ElementRef<HTMLButtonElement>>('menuButton');

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  protected onEscape(): void {
    if (!this.menuOpen()) return;
    this.closeMenu();
    this.menuButton().nativeElement.focus();
  }
}
