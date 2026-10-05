import GithubSlugger from 'github-slugger';
import MarkdownIt from 'markdown-it';
import type Token from 'markdown-it/lib/token.mjs';
import anchor from 'markdown-it-anchor';
import { createHighlighter } from 'shiki';
import type { TocItem } from '../../src/app/core/content.models';

export interface RenderedMarkdown {
  html: string;
  toc: TocItem[];
  readingMinutes: number;
}

export type Renderer = (markdown: string) => RenderedMarkdown;

const LANGS = ['ts', 'js', 'json', 'html', 'css', 'scss', 'bash', 'shell', 'python', 'yaml', 'markdown', 'diff', 'sql', 'java', 'tsx', 'jsx', 'sh', 'zsh'];
const THEMES = { light: 'github-light', dark: 'github-dark' } as const;
const WORDS_PER_MINUTE = 200;

// Plain heading text from the inline token's children (same text markdown-it-anchor slugs from).
function plainText(inline: Token | undefined): string {
  return (inline?.children ?? [])
    .filter((child) => child.type === 'text' || child.type === 'code_inline')
    .map((child) => child.content)
    .join('');
}

export async function createRenderer(): Promise<Renderer> {
  const highlighter = await createHighlighter({ themes: Object.values(THEMES), langs: LANGS });
  const loaded = new Set(highlighter.getLoadedLanguages());
  let slugger = new GithubSlugger();

  const md: MarkdownIt = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: true,
    highlight: (code, lang) => {
      const normalized = lang.trim().toLowerCase();
      return highlighter.codeToHtml(code, {
        lang: loaded.has(normalized) ? normalized : 'text',
        themes: THEMES,
        defaultColor: false,
      });
    },
  });

  md.use(anchor, { level: [2, 3], slugify: (s: string) => slugger.slug(s), tabIndex: false });

  const defaultImage = md.renderer.rules.image!;
  md.renderer.rules.image = (tokens, idx, options, env, self) => {
    tokens[idx].attrSet('loading', 'lazy');
    return defaultImage(tokens, idx, options, env, self);
  };

  return (markdown) => {
    slugger = new GithubSlugger();
    const env = {};
    const tokens = md.parse(markdown, env);
    const toc: TocItem[] = [];
    tokens.forEach((token, i) => {
      if (token.type !== 'heading_open' || (token.tag !== 'h2' && token.tag !== 'h3')) return;
      toc.push({
        id: token.attrGet('id') ?? '',
        text: plainText(tokens[i + 1]),
        depth: token.tag === 'h2' ? 2 : 3,
      });
    });
    const words = markdown.split(/\s+/).filter(Boolean).length;
    return {
      html: md.renderer.render(tokens, md.options, env),
      toc,
      readingMinutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
    };
  };
}
