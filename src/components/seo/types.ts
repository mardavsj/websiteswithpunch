/** Shape of the long-form copy on tool and feature pages (kept in src/content). */
export type ArticleSection = {
  h: string;
  p?: string[];
  list?: string[];
  /** Ordered steps, shown as a numbered list. */
  steps?: string[];
  /** Optional shell commands, shown in a code block. */
  code?: string;
};
export type Faq = { q: string; a: string };
export type RelatedLink = { href: string; title: string; body: string };
