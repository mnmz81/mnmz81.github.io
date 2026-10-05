// Framework-free: imported by Angular and by Node scripts in scripts/.
export const SITE = {
  url: 'https://mnmz81.github.io',
  title: 'Moris Maor Zakay',
  description:
    'Software engineer building full-stack products and agentic AI applications. Notes on AI, Angular, and what I learn along the way.',
  author: 'Moris Maor Zakay',
  locale: 'en',
  profileImage: '/profile-placeholder.svg',
  defaultOgImage: '/og/default.png',
  social: {
    github: 'https://github.com/mnmz81',
    linkedin: 'https://www.linkedin.com/in/moris-maor-zakay',
    email: 'mailto:moriszakay42@gmail.com',
  },
  analytics: {
    goatcounterCode: '',
  },
} as const;

/**
 * Absolute URL of a page. GitHub Pages serves `about/index.html` and redirects `/about` to `/about/`,
 * so every non-root page URL gets exactly one trailing slash. Do not use for files (images, rss.xml).
 */
export function pageUrl(path: string, base: string = SITE.url): string {
  const trimmed = path.replace(/\/+$/, '');
  return trimmed === '' ? `${base}/` : `${base}${trimmed}/`;
}
