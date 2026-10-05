import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { REQUIRED_FILES, finalizeDist } from './verify';

function makeDist(files: string[], posts: string[] = []): string {
  const dist = mkdtempSync(join(tmpdir(), 'dist-'));
  for (const file of files) {
    mkdirSync(dirname(join(dist, file)), { recursive: true });
    writeFileSync(join(dist, file), file === 'content/index.json' ? JSON.stringify({ posts: posts.map((slug) => ({ slug })) }) : 'x');
  }
  return dist;
}

const complete = [...REQUIRED_FILES.filter((f) => f !== '404.html'), '404/index.html'];

describe('finalizeDist', () => {
  it('copies 404/index.html to 404.html and reports nothing missing', () => {
    const dist = makeDist(complete);
    expect(finalizeDist(dist)).toEqual([]);
    expect(readFileSync(join(dist, '404.html'), 'utf8')).toBe('x');
  });

  it('reports missing required files', () => {
    const dist = makeDist(complete.filter((f) => f !== 'rss.xml'));
    expect(finalizeDist(dist)).toEqual(['rss.xml']);
  });

  it('reports posts without a prerendered page', () => {
    const dist = makeDist([...complete, 'blog/ok/index.html'], ['ok', 'missing']);
    expect(finalizeDist(dist)).toEqual(['blog/missing/index.html']);
  });

  it('reports a missing 404 page', () => {
    const dist = makeDist(complete.filter((f) => f !== '404/index.html'));
    expect(finalizeDist(dist)).toContain('404.html');
    expect(existsSync(join(dist, '404.html'))).toBe(false);
  });
});
