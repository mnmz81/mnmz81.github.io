import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const angular = JSON.parse(readFileSync('angular.json', 'utf8'));
const production = angular.projects['moris-site'].architect.build.configurations.production;

describe('angular.json production build', () => {
  // Critical-CSS inlining (Beasties) evaluates selectors against the prerendered HTML, which has no
  // data-theme attribute, so it drops the dark-theme token rules and defers the full stylesheet.
  // Dark-mode visitors then see a light flash that fades to dark via the body background transition.
  it('does not inline critical CSS (keeps the theme stylesheet render-blocking)', () => {
    expect(production.optimization?.styles?.inlineCritical).toBe(false);
  });
});
