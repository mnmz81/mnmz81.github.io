import { Component, PLATFORM_ID, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RevealDirective } from './reveal.directive';

@Component({
  imports: [RevealDirective],
  template: `<div appReveal [revealDelay]="delay()">content</div>`,
})
class Host {
  readonly delay = signal(0);
}

let ioCallback: IntersectionObserverCallback | undefined;
const observe = vi.fn();
const disconnect = vi.fn();

class FakeIntersectionObserver {
  constructor(cb: IntersectionObserverCallback) {
    ioCallback = cb;
  }
  observe = observe;
  disconnect = disconnect;
  unobserve = vi.fn();
}

function stubEnvironment({ top, reducedMotion = false }: { top: number; reducedMotion?: boolean }) {
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: reducedMotion }));
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ top } as DOMRect);
}

async function render(delay = 0, platform = 'browser') {
  TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: platform }] });
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.delay.set(delay);
  await fixture.whenStable();
  return { fixture, el: fixture.nativeElement.querySelector('div') as HTMLElement };
}

describe('RevealDirective', () => {
  beforeEach(() => {
    ioCallback = undefined;
    observe.mockClear();
    disconnect.mockClear();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('hides below-the-fold elements and reveals them on intersection', async () => {
    stubEnvironment({ top: 5000 });
    const { el } = await render();
    expect(el.classList).toContain('reveal--pending');
    expect(observe).toHaveBeenCalledWith(el);

    ioCallback!([{ isIntersecting: true, target: el } as unknown as IntersectionObserverEntry], {} as IntersectionObserver);
    expect(el.classList).not.toContain('reveal--pending');
    expect(el.classList).toContain('reveal--visible');
    expect(disconnect).toHaveBeenCalled();
  });

  it('applies the delay as a transition delay', async () => {
    stubEnvironment({ top: 5000 });
    const { el } = await render(200);
    expect(el.style.transitionDelay).toBe('200ms');
  });

  it('never hides elements already in the viewport', async () => {
    stubEnvironment({ top: 100 });
    const { el } = await render();
    expect(el.classList).not.toContain('reveal--pending');
    expect(observe).not.toHaveBeenCalled();
  });

  it('does nothing with reduced motion', async () => {
    stubEnvironment({ top: 5000, reducedMotion: true });
    const { el } = await render();
    expect(el.classList).not.toContain('reveal--pending');
  });

  it('does nothing on the server', async () => {
    stubEnvironment({ top: 5000 });
    const { el } = await render(0, 'server');
    expect(el.classList).not.toContain('reveal--pending');
  });

  it('disconnects the observer on destroy', async () => {
    stubEnvironment({ top: 5000 });
    const { fixture } = await render();
    fixture.destroy();
    expect(disconnect).toHaveBeenCalled();
  });
});
