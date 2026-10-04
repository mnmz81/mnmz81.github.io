import { beforeAll, describe, expect, it } from 'vitest';
import { createRenderer, type Renderer } from './markdown';

let render: Renderer;
beforeAll(async () => {
  render = await createRenderer();
});

describe('markdown renderer', () => {
  it('adds ids to h2/h3 and builds a toc', () => {
    const { html, toc } = render('## Why signals\n\ntext\n\n### Computed values\n\n#### Deep\n');
    expect(html).toContain('<h2 id="why-signals">');
    expect(html).toContain('<h3 id="computed-values">');
    expect(toc).toEqual([
      { id: 'why-signals', text: 'Why signals', depth: 2 },
      { id: 'computed-values', text: 'Computed values', depth: 3 },
    ]);
  });

  it('builds plain-text toc entries from inline markdown', () => {
    const { toc } = render('## Using `signal()` and *more*\n\n### Don\'t [link](http://x.y)\n');
    expect(toc).toEqual([
      { id: 'using-signal-and-more', text: 'Using signal() and more', depth: 2 },
      { id: 'dont-link', text: 'Don\u2019t link', depth: 3 },
    ]);
  });

  it('de-duplicates heading ids within a document', () => {
    const { toc } = render('## Setup\n\n## Setup\n');
    expect(toc.map((t) => t.id)).toEqual(['setup', 'setup-1']);
  });

  it('resets heading ids between documents', () => {
    render('## Setup\n');
    expect(render('## Setup\n').toc[0].id).toBe('setup');
  });

  it('highlights code with shiki dual themes', () => {
    const { html } = render('```ts\nconst a = 1;\n```\n');
    expect(html).toContain('class="shiki shiki-themes github-light github-dark');
    expect(html).toContain('--shiki-dark:');
  });

  it('falls back to plain text for unknown languages', () => {
    const { html } = render('```nope\nhello\n```\n');
    expect(html).toContain('<pre class="shiki');
    expect(html).toContain('hello');
  });

  it('escapes raw HTML', () => {
    const { html } = render('<script>alert(1)</script>\n');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('lazy-loads images', () => {
    expect(render('![alt](/images/x/1.png)\n').html).toContain('loading="lazy"');
  });

  it('computes reading time with a minimum of 1 minute', () => {
    expect(render('short').readingMinutes).toBe(1);
    expect(render('word '.repeat(1000)).readingMinutes).toBe(5);
  });
});
