// Framework-free: imported by Angular and by Node scripts in scripts/.
export const SITE = {
  url: 'https://mnmz81.github.io',
  title: 'Moris Maor Zakay',
  description:
    'Software engineer building enterprise product features in Angular and production LLM agents in Python.',
  author: 'Moris Maor Zakay',
  locale: 'en',
  profileImage: '/profile.jpg',
  defaultOgImage: '/og/default.png',
  features: {
    // Off: no /blog routes, nav link, home posts, RSS or blog sitemap entries. Flip to true to publish the blog.
    blog: false as boolean,
  },
  social: {
    github: 'https://github.com/mnmz81',
    linkedin: 'https://www.linkedin.com/in/moris-maor-zakay-0974189b',
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
