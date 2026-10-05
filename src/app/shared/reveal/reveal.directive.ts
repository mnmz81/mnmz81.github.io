import { isPlatformBrowser } from '@angular/common';
import { DestroyRef, Directive, ElementRef, PLATFORM_ID, afterNextRender, inject, input } from '@angular/core';

/** Fades the host in when it first scrolls into view. Content above the fold, on the server, or with reduced motion is never hidden. */
@Directive({ selector: '[appReveal]' })
export class RevealDirective {
  readonly revealDelay = input(0);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private observer?: IntersectionObserver;

  constructor() {
    afterNextRender(() => this.setup());
    inject(DestroyRef).onDestroy(() => this.observer?.disconnect());
  }

  private setup(): void {
    const el = this.host.nativeElement;
    const win = el.ownerDocument.defaultView;
    if (!this.isBrowser || !win || typeof win.IntersectionObserver === 'undefined') return;
    if (win.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    if (el.getBoundingClientRect().top < win.innerHeight) return;

    el.classList.add('reveal', 'reveal--pending');
    const delay = this.revealDelay();
    if (delay > 0) el.style.transitionDelay = `${delay}ms`;

    this.observer = new win.IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        el.classList.replace('reveal--pending', 'reveal--visible');
        this.observer?.disconnect();
      },
      { rootMargin: '0px 0px -10% 0px' },
    );
    this.observer.observe(el);
  }
}
