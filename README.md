# Moris Maor Zakay — personal site

Personal site and blog: a statically generated Angular app (SSG) with a Markdown content pipeline.

```bash
npm start       # content + dev server (includes drafts) on http://localhost:4200
npm run build   # content + OG images + production build (prerendered to dist/moris-site/browser)
npm test        # unit tests (Angular + Vitest)
```

Requires Node 24 (`.nvmrc`). Implementation plan and contracts: [docs/plan/README.md](docs/plan/README.md).
