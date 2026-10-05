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

  it('does not offer a CV download', async () => {
    expect((await render()).querySelector('a[download]')).toBeNull();
  });

  it('uses a single h1 and sets the title', async () => {
    const el = await render();
    expect(el.querySelectorAll('h1')).toHaveLength(1);
    expect(TestBed.inject(Title).getTitle()).toBe('About · Moris Maor Zakay');
  });
});
