# Writing posts in Notion

Markdown in `content/` is the source of truth. Notion is optional: write there, sync, review the PR, merge.

## One-time setup

1. **Create an integration:** https://www.notion.so/profile/integrations → New integration (internal) → copy the secret (`ntn_...`).
2. **Create a database** (full page) named "Site content" with these properties (names are case-sensitive):

   | Property | Type | Notes |
   |---|---|---|
   | Title | Title | Post or project title |
   | Slug | Text | Optional; defaults to the title in kebab-case |
   | Type | Select | Options: `Blog`, `Project` |
   | Status | Status | Options include `Draft` and `Published`; only `Published` syncs |
   | Tags | Multi-select | Blog tags (converted to kebab-case) |
   | Date | Date | Publish date (required) |
   | Summary | Text | ≤ 200 chars for posts, ≤ 240 for projects |
   | Tech | Multi-select | Projects only |
   | Repo | URL | Projects only |
   | URL | URL | Projects only (live link) |
   | Featured | Checkbox | Projects only |
   | Order | Number | Projects only (sort order) |

3. **Connect the integration:** open the database → `•••` → Connections → add your integration.
4. **Copy the data source ID:** database `•••` → Manage data sources → copy the data source ID.
5. **Local:** `cp .env.example .env` and fill both values.
6. **GitHub:** repo → Settings → Secrets and variables → Actions → add `NOTION_TOKEN` and `NOTION_DATA_SOURCE_ID`. Then Settings → Actions → General → enable "Allow GitHub Actions to create and approve pull requests".

## Publishing a post

- Locally: set Status = Published → `npm run sync:notion` → `npm start` to preview → commit and push.
- From GitHub: Actions → "Notion sync" → Run workflow → review and merge the PR.

The page body becomes the post body; images are downloaded into `public/images/<slug>/`. The sync never deletes files: to unpublish, delete `content/blog/<slug>.md` (and its images) in the repo.
