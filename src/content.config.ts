import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * The long prose of a project page. Everything that is also needed by the
 * README -- title, tagline, links, languages, publications -- deliberately does
 * NOT live here: it comes from projects.json through the `project` foreign key,
 * so no fact exists in two places.
 */
const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      project: z.string(),
      updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      metrics: z
        .array(z.object({ label: z.string(), value: z.string() }))
        .min(2, 'a project page must carry at least two measured numbers')
        .max(4),
      figure: z
        .object({ src: image(), alt: z.string(), caption: z.string() })
        .optional(),
    }),
});

export const collections = { projects };
