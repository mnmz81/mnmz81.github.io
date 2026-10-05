# Deploying

The site deploys to GitHub Pages on every push to `main` (`.github/workflows/deploy.yml`). Pull requests run tests and a full build (`.github/workflows/ci.yml`).

## First-time setup

1. Create a public GitHub repo named **`mnmz81.github.io`** (this exact name serves the site at the root URL `https://mnmz81.github.io`).
2. Push this project:

   ```bash
   git remote add origin git@github.com:mnmz81/mnmz81.github.io.git
   git push -u origin main
   ```

3. Repo → Settings → Pages → Build and deployment → Source: **GitHub Actions**.
4. Repo → Actions → "Deploy" should run and publish. Open https://mnmz81.github.io.

## Custom domain (any time later)

1. Buy a domain (e.g. `moriszakay.dev`).
2. Create `public/CNAME` containing just the domain, e.g. `moriszakay.dev`.
3. In `src/app/core/site.config.ts` set `url: 'https://moriszakay.dev'` (canonical URLs, sitemap, RSS and OG images use it).
4. DNS at your registrar:
   - Apex domain: `A` records → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` (and optionally `AAAA` → `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`).
   - `www` subdomain: `CNAME` → `mnmz81.github.io`.
5. Repo → Settings → Pages → Custom domain → enter the domain → wait for the DNS check → enable **Enforce HTTPS**.
6. Commit and push; the next deploy serves the site on the new domain.

## Notes

- Drafts (`draft: true`) are never deployed. Preview them locally with `npm start`.
- Unknown URLs show the site's 404 page (`404.html`, created by `scripts/postbuild.ts`).
