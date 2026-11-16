# CV site — UI/UX review and action plan

Reviewed 2026-11-16 on the live site (`https://mnmz81.github.io/`): home, about, projects, accessibility, 404. Desktop 1280×800 and mobile 375×812, light and dark. The site is English only (`lang="en"`, no Hebrew pages), so there was no RTL pass.

Method: `node scripts/ui-review.mjs` (Playwright, headless Chromium) takes a first-screen and a full-page screenshot of each page in each mode and writes `test-results/ui-review/metrics.json`. Run it again after each phase.

This document is the brief for the implementation. Each item says what is wrong, what to do, and how to know it is done.

## Measured

| Check | Result |
|---|---|
| Console errors | 0 (the 404 page logs the expected 404 of its own document) |
| Failed requests | 0 |
| Horizontal scroll | none, all pages, both widths |
| `h1` per page | exactly 1 |
| Images without `alt` | 0 |
| Tap targets under 44px | 1 of 7–24 per page: the skip link is 42px tall |
| Page height, desktop | home 2079, about 2728, projects 1754, accessibility 1638, 404 800 |
| Page height, mobile | home 3942, about 4397, projects 3787, accessibility 1966, 404 812 |

## Verdict

Nothing is broken. The code is clean: tokens, logical CSS, a skip link, 44px targets, reduced-motion handling, axe in e2e. The site is weak for three reasons:

1. **It reads as a template.** Indigo-to-cyan gradient text on every page title, two blurred gradient blobs behind the hero, "Hi, I'm", and one card style repeated for every kind of content. Nothing on the page is specific to this person.
2. **It does not do the job of a CV.** The first screen does not say where he works, for how long, or where he is based. There is no résumé download and no contact section. A recruiter has to open About and scroll to find the employer.
3. **It wastes the space it has.** About is one 46rem column inside a 72rem container, so a third of the desktop screen is empty while the page runs 2,700px. Short pages are padded with large section gaps.

## What works — keep

- Token file `src/styles/_tokens.scss`, light and dark mixins, theme toggle with no flash.
- Header: brand, active state, 44px targets.
- Content model: `cv.data.ts` for the CV, Markdown files for projects.
- Experience timeline on About: clear and readable.
- Project cards have specific accessible names on the "Code" and "Live" links.
- e2e suite with axe in both themes.

## Findings

### P0 — content and structure

**1. The home hero does not introduce a candidate.**
First screen: "Hi, I'm", name, "Software Engineer · Angular & AI Agents", one sentence, three buttons, three text links, photo. Missing: current employer and years of experience (both are in `cv.summary`), location, and a way to get the résumé or make contact.
- Replace "Hi, I'm" and the tagline with a short facts line under the headline: role at BMC Software (Control-M), 5+ years, location, M.Sc. in progress.
- Two actions only: one primary ("Contact" or "Résumé", see open questions) and one secondary ("Projects"). "About me" and "My blog" are already navigation; move the blog link into the header nav as an external link.
- The GitHub / LinkedIn / Email text links repeat the footer icons. Keep one set in the hero as labelled icon links.
- Done when: the first screen at 1280×800 and at 375×812 answers who, what, where, and how to reach him.

**2. "What I do" repeats the tagline in three cards.**
Three text-only cards restate "Angular + LLM agents". They carry no proof.
- Replace with a compact "Now" block taken from the current job: three or four concrete lines (what he builds, with what, at what scale), or drop the section and let the experience summary do it.
- Done when: no sentence on the home page says the same thing twice.

**3. Featured projects: five cards in a three-column grid.**
The second row has two cards and an empty slot. All five cards weigh the same; descriptions run 3–7 lines, so the chip rows and buttons do not line up.
- Feature three projects, not five (the page already links to "All projects"). Or one large lead project and two small ones.
- Clamp the summary to three lines on cards; keep the full text on the projects page.
- Done when: the grid has no orphan row at 1280px and card actions align on one baseline.

**4. About wastes a third of the desktop screen and buries the facts.**
One column, 46rem wide, left aligned in a 72rem container. Order: summary, experience, skills, education, languages. Education and spoken languages are at 2,000px and below.
- Two columns from 60rem up: the main column holds the summary and experience; a side column holds the facts (location, contact, résumé link, education, spoken languages). One column on mobile, facts first.
- Skills: 34 chips in five groups, all the same weight, styled like buttons but not clickable. Show them as plain comma-separated lists per group, or keep chips for the top 8–10 skills only and list the rest as text.
- Done when: About is under about 1,900px at 1280px, and education is visible without scrolling past the whole experience list.

**5. Projects page: eight equal cards, no order a visitor can read.**
Work on Claude Code tooling, this website, university projects and Telegram bots sit in one grid with the same weight. Heading order jumps from `h1` to `h3`.
- Group under two `h2` headings: "Tools and libraries" and "University and experiments" (or by the `featured` flag: featured first as large cards, the rest as compact rows).
- This also fixes the heading order.
- Done when: the page has `h2` groups and the first group is the work he wants seen first.

**6. No contact section.**
The only contact route is three unlabelled icons in the footer.
- Add a closing block on home and About: one sentence, the email as visible text, LinkedIn and GitHub as labelled links.
- Footer: add text labels next to the icons, and a link to the blog.

### P1 — visual identity

**7. Gradient text and blobs.**
Gradient fill on the name, on "me" in "About me", on "Projects", on "404", and on the logo; two blurred blobs behind the hero. On mobile the hero background fills the whole first screen with purple fading to cyan.
- One accent color. Headings in the text color. Remove the blobs; if the hero needs a background, use a flat surface tint.
- Pick an accent that is not the default indigo. Proposal below.
- Done when: `text-gradient` and `hero__blob` are gone from the code.

**8. Dark theme surfaces blur together.**
`--color-border` equals `--color-surface-2` (`#1f2937`), and cards are `#111827` on `#0b0f19`. Ghost buttons in the dark hero have a border that is nearly invisible. Same problem the blog had.
- Raise the border one step above the surface in dark, and check ghost buttons on the hero.

**9. One card style for everything.**
Highlights, project cards and education cards are the same rounded, bordered, shadowed box with hover lift. Cards that are not links should not lift on hover.
- Keep the card for projects only. Use plain text blocks with a top rule for highlights and education.

**10. Vertical rhythm.**
Every section has `--space-7` (3rem) block padding plus margins, so the accessibility page spends 1,638px on about 150 words, with roughly 130px between a paragraph and the next heading.
- Halve the section spacing on text pages; keep the larger gap only between major home sections.

**11. Scroll-reveal on every block.**
Each heading, card and chip group fades in when scrolled into view. It delays reading, and content below the first screen has `opacity: 0` until scrolled, so a full-page capture or a fast scroll shows blank areas.
- Remove the reveal from text pages. Keep, at most, the hero entrance.

### P1 — mobile

**12. Hero order on mobile.**
The photo comes first and takes about 300px; the name starts at y≈350 of 812, and the third button wraps to its own row.
- Small photo (72–96px) inline with the name, or text first. With two actions instead of three the buttons fit one row.
- Done when: name, role line and both actions are visible at 375×812 without scrolling.

**13. Mobile menu.**
The menu opens as a panel under the header. The page behind stays scrollable and focusable, there is no backdrop, and the theme toggle sits alone on a row with no label.
- Phase 2 replaces it with the library's `mui-site-header` menu. Until then: add a backdrop and make the rest of the page inert while open.

**14. Long pages.**
Home 3,942px, projects 3,787px, About 4,397px at 375px. Items 2–5 and 10 cut most of it. On mobile, show non-featured projects as compact rows (title, one line, links).

**15. Skip link is 42px tall.** Bring it to 44px.

### P2 — polish

- 404: content is left aligned with the right two thirds empty. Center it and add links to About and Projects.
- `profile.jpg` is one 560×560 JPEG shown at 312px (desktop) and 152px (mobile). Add a smaller source or WebP.
- Accessibility statement: update "Last updated" after the redesign.
- The blog pages (`blog-list`, `blog-post`, `tag`, `post-card`) are off behind `SITE.features.blog` and the real blog is Loom. They are not part of this redesign beyond inheriting the tokens. See open questions.

## Proposed direction

A document, not a landing page: quiet, dense, typographic. It should look like the CV of an engineer who cares about detail.

- **Color.** Neutral background and text, one accent used for links, the primary button, active nav and focus. To sit next to the blog without copying it, keep the hue family and drop the gradient: a single deep blue-violet (about `#4338ca` on light, `#a5b4fc` on dark), or the blog's accent exactly so both sites read as one identity. Decide in the go-ahead.
- **Type.** Inter stays for text. Headings heavier (750–800) with tighter tracking and smaller steps: `h1` 2.75rem desktop / 2rem mobile instead of 3.75rem / 2.25rem. JetBrains Mono for dates and small labels only.
- **Surfaces.** Flat. Borders and space instead of shadows. Cards only for projects.
- **Layout.** Home: facts hero, "Now", three featured projects, contact. About: two columns. Projects: grouped.
- **Motion.** Theme and hover transitions only.

## Implementation phases

Each phase is one PR. Build, unit tests, e2e with axe, and `node scripts/ui-review.mjs http://localhost:4300` pass before each PR.

**Phase 1 — redesign with the site's own components** (findings 1–12, 14, 15 and P2)
1. Tokens: accent, dark borders, type scale, section spacing. Remove gradient and blobs.
2. Home: hero, "Now", featured projects, contact block.
3. About: two-column layout, skills as lists.
4. Projects: groups with `h2`, compact rows for the rest on mobile.
5. 404, footer, accessibility date, remove scroll-reveal.
6. Update unit specs, e2e, `COMPLIANCE.md` (`il-web-compliance`).

**Phase 2 — move general UI to `@mushilu-san/ui`**
Needs: `.npmrc` for GitHub Packages, `@mushilu-san/ui` and `@angular/cdk` in `package.json`, a `PACKAGES_READ_TOKEN` secret for Actions and Dependabot, `NODE_AUTH_TOKEN` in the workflows, and one token bridge file `src/styles/_mui-map.scss`.

| Site piece | Library component | Fit |
|---|---|---|
| `.btn` links (hero, project cards, 404) | `a[muiButton]` | Good |
| Header nav links | `a[muiNavLink]` with `[active]` | Good |
| Header with mobile menu | `mui-site-header` | Good; fixes finding 13 |
| Theme toggle, menu button | `button[muiButton]` + `mui-icon` | Good |
| `.chip` (project tech, top skills) | `mui-badge` (not interactive) | Good; `a[muiChip]` only where it is a link |
| Skip link | `a[muiSkipLink]` | Good |
| Footer and hero social icons | `mui-icon` | Only if the set has GitHub, LinkedIn and mail; else an issue in the library and the inline SVG stays |
| Project card | `mui-card` | Check; the site's card is 56 lines of CSS, move only if the result is equal |
| Experience timeline | none | Stays local |
| Two-column About, hero, footer layout | none | Stays local |
| Dialog, accordion, pagination, form controls | — | The site has none of these today |

**Phase 3 — dependency updates as one issue**
`open-pull-requests-limit: 0` on both entries in `.github/dependabot.yml`, a `registries` block for GitHub Packages, `scripts/outdated-issue.sh` and `.github/workflows/outdated.yml`. Twelve Dependabot PRs are open today (#13, #22–#29, #31–#33); closing them is the owner's decision.

## Open questions for the owner

1. Accent: a new single color, or the blog's accent so both sites match?
2. Résumé download: `resume/Moris-Maor-Zakay-Resume.pdf` exists in the repo but is not published. Publishing it puts its contact details on a public URL. Publish it, or use "Contact" as the primary action?
3. Blog pages behind the `blog` flag: leave as they are, or delete them now that Loom is the blog?
4. Hebrew: the site has no Hebrew version. Out of scope unless asked for.

## Status

### Phase 1 — redesign (2026-11-16, branch `feat/redesign`)

Owner decisions: redesign first and library second; the blog's accent and palette; "Contact" as the primary action with no résumé PDF; blog pages left as they are.

Done:

| Finding | Change |
|---|---|
| 1, 12 | Hero: name, headline, tagline, facts line (`CV.facts`), two actions (Contact, Projects), small photo. Blog moved to the header nav as an external link. At 375×812 everything through both actions is on the first screen. |
| 2, 9 | "What I do" kept its three items but as flat text blocks with a top rule, not cards. The wording was not rewritten: that is the owner's text. |
| 3 | Home shows three featured projects, summaries clamped to four lines. |
| 4 | About: two columns from 60rem (experience and skills; a sticky side column with location, education, languages). Skills are plain lists per group. 2,728px → 1,903px at 1280px. On mobile the side column comes after the main column, not before it. |
| 5 | Projects: "Main projects" and "More projects" under `h2`. |
| 6 | Contact block in the footer of every page: email as visible text, labelled GitHub / LinkedIn / Email / Blog links. The hero's Contact button jumps to it. |
| 7, 8 | Blog palette, one accent, no gradient text, no blobs; dark border is a step above the surfaces. Favicon and OG image use the new colors. |
| 10 | Section spacing halved. Accessibility page 1,638px → 1,443px. |
| 11 | Scroll-reveal directive deleted. |
| 15 | Skip link is 44px. |
| P2 | 404 centered with links to About and Projects. Accessibility statement date updated. |

Page height after, desktop / mobile: home 1,364 / 2,616, about 1,903 / 3,727, projects 1,830 / 3,933, accessibility 1,443 / 1,901.

Not done:

- 13 (mobile menu backdrop and inert page): left for phase 2, where `mui-site-header` replaces the menu.
- 14 on the projects page: mobile is 3,933px, slightly longer than before because of the two group headings. Compact rows for "More projects" were not built.
- P2 smaller profile image source: dropped. The photo is now shown at 176px at most, so the 560px file is the right size for 3× screens.

### Phase 2 — `@mushilu-san/ui` 2026.46.3 (2026-11-16, branch `feat/mushilu-ui`)

Token bridge: `src/styles/_mui-map.scss` maps `--mui-color-*` and `--mui-font-*` onto the site's `--color-*` and `--font-*`. No library component is restyled.

| Site piece | Now | Notes |
|---|---|---|
| Header, mobile menu | `mui-site-header` | Menu button, Escape, focus return and close-on-navigate are the library's. Closes finding 13. The theme toggle sits in the bar on mobile, not inside the menu. |
| Nav links | `a[muiNavLink]` | `[active]` from the router's `isActive()` signal. |
| Theme toggle | `button[muiButton]` + `mui-icon` (`sun`, `moon`) | |
| Hero, 404, project card and footer links | `a[muiButton]` (`primary`, `secondary`) | The site's `.btn` CSS is deleted. |
| Project tech labels | `mui-chip` | |
| Skip link | `a[muiSkipLink]` | The site's `skipToMain` handler and `.skip-link` CSS are deleted. |
| Footer icons | `mui-icon` (`github`, `mail`, `link`, `rss`) | `linkedin` is not in the library: registered with `provideMuiIcons()` in `app.config.ts`. Issue opened in the library. |

Stays local: hero, experience timeline, About layout, project card box, footer layout, 404 layout. The blog pages (off) still use the site's `.chip` class.

Not used, because the site has no such piece: dialog, accordion, pagination, form controls, badge.
