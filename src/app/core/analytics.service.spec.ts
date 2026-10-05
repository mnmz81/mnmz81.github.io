import { Component, PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AnalyticsService, GOATCOUNTER_CODE } from './analytics.service';

@Component({ template: '' })
class Blank {}

const script = () => document.head.querySelector<HTMLScriptElement>('script[data-goatcounter]');

function setup(code: string, platform = 'browser') {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: '**', component: Blank }]),
      { provide: GOATCOUNTER_CODE, useValue: code },
      { provide: PLATFORM_ID, useValue: platform },
    ],
  });
  TestBed.inject(AnalyticsService).init();
  return TestBed.inject(Router);
}

describe('AnalyticsService', () => {
  beforeEach(() => script()?.remove());
  afterEach(() => {
    delete (window as { goatcounter?: unknown }).goatcounter;
  });

  it('does nothing without a code', () => {
    setup('');
    expect(script()).toBeNull();
  });

  it('does nothing on the server', () => {
    setup('moris', 'server');
    expect(script()).toBeNull();
  });

  it('loads the GoatCounter script with SPA settings', () => {
    setup('moris');
    expect(script()?.src).toBe('https://gc.zgo.at/count.js');
    expect(script()?.dataset['goatcounter']).toBe('https://moris.goatcounter.com/count');
    expect(JSON.parse(script()?.dataset['goatcounterSettings'] ?? '{}')).toEqual({ no_onload: true });
  });

  it('queues page views until the script loads, then counts every navigation', async () => {
    const router = setup('moris');
    await router.navigateByUrl('/blog');

    const count = vi.fn();
    (window as { goatcounter?: unknown }).goatcounter = { count };
    script()!.dispatchEvent(new Event('load'));
    expect(count).toHaveBeenCalledWith({ path: '/blog' });

    await router.navigateByUrl('/about');
    expect(count).toHaveBeenLastCalledWith({ path: '/about' });
  });
});
