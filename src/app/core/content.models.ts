export interface PostMeta {
  slug: string;            // kebab-case, = markdown filename without .md
  title: string;
  summary: string;         // ≤ 200 chars
  date: string;            // 'YYYY-MM-DD'
  updated?: string;        // 'YYYY-MM-DD'
  tags: string[];          // lowercase kebab-case, ≥ 1
  readingMinutes: number;  // ≥ 1
  cover?: string;          // '/images/...'
}

export interface TocItem {
  id: string;              // heading id attribute in Post.html
  text: string;
  depth: 2 | 3;
}

export interface Post extends PostMeta {
  html: string;            // rendered article body (no <h1>)
  toc: TocItem[];
}

export interface TagCount {
  tag: string;
  count: number;
}

export interface ContentIndex {
  generatedAt: string;     // ISO timestamp
  posts: PostMeta[];       // sorted by date desc, then slug asc; drafts excluded unless INCLUDE_DRAFTS=1
  tags: TagCount[];        // sorted by count desc, then tag asc
}

export interface Project {
  slug: string;
  title: string;
  summary: string;
  tech: string[];
  repo?: string;           // absolute URL
  url?: string;            // absolute URL
  image?: string;          // '/images/...'
  featured: boolean;
  order: number;           // ascending sort key
  date: string;            // 'YYYY-MM-DD'
}
