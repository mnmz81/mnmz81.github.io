import { describe, expect, it } from 'vitest';
import { renderOgPng } from './render';

function pngSize(buf: Buffer): { width: number; height: number } {
  // PNG IHDR: width at byte 16, height at byte 20 (big-endian).
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

describe('renderOgPng', () => {
  it('renders a 1200x630 PNG', async () => {
    const png = await renderOgPng({ title: 'Angular Signals in practice', eyebrow: 'Blog', tags: ['angular', 'frontend'] });
    expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    expect(pngSize(png)).toEqual({ width: 1200, height: 630 });
  });

  it('handles long titles and no tags', async () => {
    const png = await renderOgPng({ title: 'A very long title '.repeat(10), eyebrow: 'Blog', tags: [] });
    expect(pngSize(png)).toEqual({ width: 1200, height: 630 });
  });
});
