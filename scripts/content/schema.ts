import { basename } from 'node:path';
import { z } from 'zod';

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const dateField = z.preprocess(
  (value) => (value instanceof Date ? value.toISOString().slice(0, 10) : value),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD'),
);

const imagePath = z.string().startsWith('/images/');

export const postFrontmatter = z
  .object({
    title: z.string().min(1),
    summary: z.string().min(1).max(200),
    date: dateField,
    updated: dateField.optional(),
    tags: z.array(z.string().regex(KEBAB, 'tags must be lowercase kebab-case')).min(1),
    draft: z.boolean().default(false),
    cover: imagePath.optional(),
  })
  .strict();

export const projectFrontmatter = z
  .object({
    title: z.string().min(1),
    summary: z.string().min(1).max(240),
    tech: z.array(z.string().min(1)).min(1),
    repo: z.string().url().optional(),
    url: z.string().url().optional(),
    image: imagePath.optional(),
    featured: z.boolean().default(false),
    order: z.number().int(),
    date: dateField,
  })
  .strict();

export type PostFrontmatter = z.infer<typeof postFrontmatter>;
export type ProjectFrontmatter = z.infer<typeof projectFrontmatter>;

export function slugFromFile(file: string): string {
  const slug = basename(file, '.md');
  if (!KEBAB.test(slug)) throw new Error(`${file}: filename must be kebab-case (e.g. my-first-post.md)`);
  return slug;
}
