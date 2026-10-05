import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import { SITE } from '../../src/app/core/site.config';

export interface OgInput {
  title: string;
  eyebrow: string;   // small label above the title, e.g. 'Blog' or the site headline
  tags: string[];
}

const WIDTH = 1200;
const HEIGHT = 630;
const MAX_TITLE = 90;

const fontFile = (weight: 400 | 700) =>
  readFileSync(join(process.cwd(), 'node_modules', '@fontsource', 'inter', 'files', `inter-latin-${weight}-normal.woff`));

let fonts: { name: string; data: Buffer; weight: 400 | 700; style: 'normal' }[] | undefined;
function loadFonts() {
  fonts ??= [
    { name: 'Inter', data: fontFile(400), weight: 400, style: 'normal' },
    { name: 'Inter', data: fontFile(700), weight: 700, style: 'normal' },
  ];
  return fonts;
}

type Node = { type: string; props: Record<string, unknown> & { children?: unknown } };
const el = (type: string, style: Record<string, unknown>, children?: unknown): Node => ({ type, props: { style, children } });

function template({ title, eyebrow, tags }: OgInput): Node {
  const shortTitle = title.length > MAX_TITLE ? `${title.slice(0, MAX_TITLE - 1).trimEnd()}…` : title;
  return el(
    'div',
    {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '72px',
      background: 'linear-gradient(135deg, #0b0f19 0%, #1e1b4b 55%, #083344 100%)',
      color: '#e5e7eb',
      fontFamily: 'Inter',
    },
    [
      el('div', { display: 'flex', fontSize: 28, color: '#22d3ee', fontWeight: 700, letterSpacing: 2 }, eyebrow.toUpperCase()),
      el('div', { display: 'flex', fontSize: 68, fontWeight: 700, lineHeight: 1.15, color: '#ffffff' }, shortTitle),
      el('div', { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 28 }, [
        el('div', { display: 'flex', gap: '16px', color: '#a5b4fc' }, tags.slice(0, 4).map((t) => el('div', { display: 'flex' }, `#${t}`))),
        el('div', { display: 'flex', fontWeight: 700 }, SITE.author),
      ]),
    ],
  );
}

export async function renderOgPng(input: OgInput): Promise<Buffer> {
  const svg = await satori(template(input) as unknown as Parameters<typeof satori>[0], {
    width: WIDTH,
    height: HEIGHT,
    fonts: loadFonts(),
  });
  return new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } }).render().asPng();
}
