import { Directive, input } from '@angular/core';

/** Fades the host in when it scrolls into view. Stub: no-op until Task 10. */
@Directive({ selector: '[appReveal]' })
export class RevealDirective {
  readonly revealDelay = input(0);
}
