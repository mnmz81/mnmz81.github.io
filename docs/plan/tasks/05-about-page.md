# Task 05: About page (CV)

> Read first: `docs/plan/README.md` (Global Constraints), `docs/plan/contracts.md`, `docs/plan/spec.md`.

**Goal:** Present the CV: summary, experience timeline, skills grouped as chips, education, languages, and a Download CV button.

**Wave:** 1 (parallel).

**Files:**
- Modify (replace stubs): `src/app/pages/about/about-page.ts`, `about-page.html`, `about-page.scss`
- Test: `src/app/pages/about/about-page.spec.ts`

**Interfaces:**
- Consumes (from Task 00): `CV` and its types (`src/app/core/cv.data.ts`), `SITE.cvPdfPath`, `SeoService.set`, `RevealDirective` (`appReveal`), utility classes `.container .section .section__title .btn .btn--primary .chip`.
- Produces: nothing other tasks consume.

All copy comes from `CV`; never hard-code CV text in the template.

---

### Step 1: Write the failing test

- [ ] Create `src/app/pages/about/about-page.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { describe, expect, it } from 'vitest';
import { CV } from '../../core/cv.data';
import { AboutPage } from './about-page';

async function render() {
  const fixture = TestBed.createComponent(AboutPage);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('AboutPage', () => {
  it('renders the summary', async () => {
    expect((await render()).textContent).toContain(CV.summary);
  });

  it('renders every experience entry with its bullets', async () => {
    const el = await render();
    const items = el.querySelectorAll('.timeline__item');
    expect(items).toHaveLength(CV.experience.length);
    CV.experience.forEach((job, i) => {
      expect(items[i].textContent).toContain(job.role);
      expect(items[i].textContent).toContain(job.company);
      expect(items[i].querySelectorAll('li')).toHaveLength(job.bullets.length);
    });
  });

  it('renders all skill groups as chips', async () => {
    const el = await render();
    const groups = el.querySelectorAll('.skills__group');
    expect(groups).toHaveLength(CV.skills.length);
    expect(el.querySelectorAll('.skills .chip')).toHaveLength(CV.skills.flatMap((g) => g.items).length);
  });

  it('renders education and languages', async () => {
    const el = await render();
    for (const edu of CV.education) expect(el.textContent).toContain(edu.degree);
    for (const lang of CV.languages) expect(el.textContent).toContain(lang);
  });

  it('offers the CV download', async () => {
    const link = (await render()).querySelector('a[href="/cv.pdf"]');
    expect(link?.hasAttribute('download')).toBe(true);
  });

  it('uses a single h1 and sets the title', async () => {
    const el = await render();
    expect(el.querySelectorAll('h1')).toHaveLength(1);
    expect(TestBed.inject(Title).getTitle()).toBe('About · Moris Maor Zakay');
  });
});
```

- [ ] Run `npm test`. Expected: FAIL.

### Step 2: Implement

- [ ] Replace `src/app/pages/about/about-page.ts`:

```ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CV } from '../../core/cv.data';
import { SeoService } from '../../core/seo.service';
import { SITE } from '../../core/site.config';
import { RevealDirective } from '../../shared/reveal/reveal.directive';

@Component({
  selector: 'app-about-page',
  imports: [RevealDirective],
  templateUrl: './about-page.html',
  styleUrl: './about-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutPage {
  protected readonly cv = CV;
  protected readonly cvPdfPath = SITE.cvPdfPath;

  constructor() {
    inject(SeoService).set({ title: 'About', description: CV.summary, path: '/about' });
  }
}
```

- [ ] Replace `about-page.html`:

```html
<div class="container about">
  <header class="about__intro section" appReveal>
    <h1>About <span class="text-gradient">me</span></h1>
    <p class="about__summary">{{ cv.summary }}</p>
    <p class="about__location">{{ cv.location }}</p>
    <a class="btn btn--primary" [href]="cvPdfPath" download="Moris-Maor-Zakay-CV.pdf">Download CV (PDF)</a>
  </header>

  <section class="section" aria-labelledby="experience-title">
    <h2 id="experience-title" class="section__title" appReveal>Experience</h2>
    <ol class="timeline">
      @for (job of cv.experience; track job.company + job.start) {
        <li class="timeline__item" appReveal>
          <div class="timeline__head">
            <h3 class="timeline__role">{{ job.role }}</h3>
            <p class="timeline__meta">
              {{ job.company }} · {{ job.location }} · <span class="timeline__dates">{{ job.start }} – {{ job.end }}</span>
            </p>
          </div>
          <ul class="timeline__bullets">
            @for (bullet of job.bullets; track bullet) {
              <li>{{ bullet }}</li>
            }
          </ul>
        </li>
      }
    </ol>
  </section>

  <section class="section" aria-labelledby="skills-title">
    <h2 id="skills-title" class="section__title" appReveal>Skills</h2>
    <div class="skills">
      @for (group of cv.skills; track group.name; let i = $index) {
        <div class="skills__group" appReveal [revealDelay]="i * 80">
          <h3 class="skills__name">{{ group.name }}</h3>
          <ul class="skills__items">
            @for (item of group.items; track item) {
              <li class="chip">{{ item }}</li>
            }
          </ul>
        </div>
      }
    </div>
  </section>

  <section class="section" aria-labelledby="education-title">
    <h2 id="education-title" class="section__title" appReveal>Education</h2>
    <div class="education">
      @for (edu of cv.education; track edu.degree) {
        <article class="education__card" appReveal>
          <h3>{{ edu.degree }}</h3>
          <p class="education__meta">{{ edu.school }} · {{ edu.start }} – {{ edu.end }}</p>
          <p class="education__details">{{ edu.details }}</p>
        </article>
      }
    </div>
  </section>

  <section class="section" aria-labelledby="languages-title" appReveal>
    <h2 id="languages-title" class="section__title">Languages</h2>
    <ul class="languages">
      @for (lang of cv.languages; track lang) {
        <li class="chip">{{ lang }}</li>
      }
    </ul>
  </section>
</div>
```

- [ ] Run `npm test`. Expected: PASS.

### Step 3: Styles

- [ ] Replace `about-page.scss`:

```scss
.about__summary {
  max-width: var(--prose-max);
  font-size: 1.125rem;
}

.about__location {
  color: var(--color-muted);
}

.timeline {
  position: relative;
  display: grid;
  gap: var(--space-6);
  margin: 0;
  padding: 0 0 0 var(--space-6);
  list-style: none;

  &::before {
    content: '';
    position: absolute;
    top: var(--space-2);
    bottom: var(--space-2);
    left: 7px;
    width: 2px;
    background: linear-gradient(var(--color-accent), var(--color-accent-2));
    border-radius: var(--radius-full);
  }
}

.timeline__item {
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0.45rem;
    left: calc(-1 * var(--space-6) + 1px);
    width: 14px;
    height: 14px;
    border: 3px solid var(--color-bg);
    border-radius: 50%;
    background: var(--color-accent);
    box-shadow: 0 0 0 2px var(--color-accent);
  }
}

.timeline__role {
  margin-bottom: var(--space-1);
}

.timeline__meta {
  color: var(--color-muted);
}

.timeline__dates {
  font-family: var(--font-mono);
  font-size: 0.875rem;
}

.timeline__bullets {
  display: grid;
  gap: var(--space-2);
  max-width: var(--prose-max);
  padding-left: var(--space-5);
}

.skills {
  display: grid;
  gap: var(--space-5);
}

.skills__name {
  margin-bottom: var(--space-3);
  font-size: 1rem;
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.skills__items,
.languages {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.education {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
  gap: var(--space-5);
}

.education__card {
  padding: var(--space-5);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}

.education__meta {
  color: var(--color-muted);
}

.education__details {
  margin: 0;
}
```

### Step 4: Verify and commit

- [ ] Run `npm test` and `npm run build`. Expected: PASS; build succeeds; `dist/moris-site/browser/about/index.html` contains "BMC Software".
- [ ] Commit:

```bash
git add src/app/pages/about
git commit -m "feat(about): CV page with timeline, skills, education and download"
```
