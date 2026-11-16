#!/usr/bin/env node
// Screenshots and UI metrics for every page, at desktop and mobile widths, in light and dark.
// Usage: node scripts/ui-review.mjs [baseUrl] [outDir]
//   baseUrl  default https://mnmz81.github.io   (use http://localhost:4300 for a local dist/)
//   outDir   default test-results/ui-review     (PNG files + metrics.json)
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const base = (process.argv[2] ?? 'https://mnmz81.github.io').replace(/\/+$/, '');
const outDir = process.argv[3] ?? 'test-results/ui-review';
const PAGES = { home: '/', about: '/about/', projects: '/projects/', accessibility: '/accessibility/', 'not-found': '/no-such-page/' };
const VIEWPORTS = { desktop: { width: 1280, height: 800 }, mobile: { width: 375, height: 812 } };
const THEMES = ['light', 'dark'];
const MIN_TAP = 44;

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
const results = [];

for (const [vpName, viewport] of Object.entries(VIEWPORTS)) {
  for (const theme of THEMES) {
    const context = await browser.newContext({
      viewport,
      colorScheme: theme,
      isMobile: vpName === 'mobile',
      hasTouch: vpName === 'mobile',
      deviceScaleFactor: vpName === 'mobile' ? 2 : 1,
    });
    await context.addInitScript((t) => localStorage.setItem('theme', t), theme);
    for (const [name, path] of Object.entries(PAGES)) {
      const page = await context.newPage();
      const consoleErrors = [];
      const failedRequests = [];
      page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
      page.on('pageerror', (e) => consoleErrors.push(String(e)));
      page.on('requestfailed', (r) => failedRequests.push(`${r.url()} ${r.failure()?.errorText}`));
      page.on('response', (r) => {
        // The 404 page itself answers 404 by design.
        if (r.status() >= 400 && !(name === 'not-found' && r.url().endsWith(path))) failedRequests.push(`${r.url()} ${r.status()}`);
      });
      await page.goto(base + path, { waitUntil: 'networkidle' });
      const id = `${name}-${vpName}-${theme}`;
      await page.screenshot({ path: join(outDir, `${id}-fold.png`) });
      // Scroll through once so scroll-reveal content is visible in the full-page shot.
      await page.evaluate(async () => {
        for (let y = 0; y < document.documentElement.scrollHeight; y += 400) {
          window.scrollTo({ top: y, behavior: 'instant' });
          await new Promise((r) => setTimeout(r, 80));
        }
        window.scrollTo({ top: 0, behavior: 'instant' });
      });
      await page.waitForTimeout(900);
      await page.screenshot({ path: join(outDir, `${id}-full.png`), fullPage: true });
      const metrics = await page.evaluate((minTap) => {
        const doc = document.documentElement;
        const visible = (el) => {
          const r = el.getBoundingClientRect();
          const s = getComputedStyle(el);
          // 1px boxes are visually hidden until focused (skip link).
          return r.width > 1 && r.height > 1 && s.visibility !== 'hidden' && s.display !== 'none';
        };
        const targets = [...document.querySelectorAll('a, button, input, select, summary')].filter(visible);
        const small = targets
          .map((el) => ({ el, r: el.getBoundingClientRect() }))
          .filter(({ r }) => r.height < minTap || r.width < minTap)
          .map(({ el, r }) => ({
            text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 40),
            w: Math.round(r.width),
            h: Math.round(r.height),
            // Links inside a sentence are exempt from WCAG 2.5.8.
            inline: getComputedStyle(el).display === 'inline',
          }));
        const body = getComputedStyle(document.body);
        const h1 = document.querySelector('h1');
        return {
          lang: doc.lang,
          dir: doc.dir || getComputedStyle(doc).direction,
          title: document.title,
          pageHeight: doc.scrollHeight,
          horizontalScroll: doc.scrollWidth > doc.clientWidth,
          scrollWidth: doc.scrollWidth,
          h1Count: document.querySelectorAll('h1').length,
          h1: h1 && { text: h1.textContent.trim().slice(0, 80), size: getComputedStyle(h1).fontSize, weight: getComputedStyle(h1).fontWeight },
          headings: [...document.querySelectorAll('h1,h2,h3,h4')].map((h) => `${h.tagName} ${h.textContent.trim().slice(0, 50)}`),
          bodyFont: `${body.fontSize}/${body.lineHeight} ${body.fontFamily.slice(0, 40)}`,
          tapTargets: targets.length,
          smallTargets: small.filter((t) => !t.inline),
          smallInlineLinks: small.filter((t) => t.inline).length,
          imagesWithoutAlt: [...document.images].filter((i) => !i.hasAttribute('alt')).length,
          images: [...document.images].map((i) => ({ src: i.currentSrc.split('/').pop(), natural: `${i.naturalWidth}x${i.naturalHeight}`, shown: `${i.width}x${i.height}`, loading: i.loading })),
        };
      }, MIN_TAP);
      results.push({ id, url: base + path, consoleErrors, failedRequests, ...metrics });
      await page.close();
    }
    await context.close();
  }
}
await browser.close();
writeFileSync(join(outDir, 'metrics.json'), JSON.stringify(results, null, 2));

for (const r of results) {
  const flags = [
    r.consoleErrors.length && `console:${r.consoleErrors.length}`,
    r.failedRequests.length && `failed:${r.failedRequests.length}`,
    r.horizontalScroll && `hscroll:${r.scrollWidth}`,
    r.smallTargets.length && `small-targets:${r.smallTargets.length}/${r.tapTargets}`,
    r.h1Count !== 1 && `h1:${r.h1Count}`,
  ].filter(Boolean);
  console.log(`${r.id.padEnd(32)} ${String(r.pageHeight).padStart(5)}px  ${flags.join('  ') || 'ok'}`);
}
console.log(`\n${results.length} runs. Screenshots and metrics.json in ${outDir}`);
