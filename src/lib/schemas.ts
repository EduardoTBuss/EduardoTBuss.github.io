/**
 * The shape of the canonical data, enforced at build time.
 *
 * These schemas are the contract between this site and the EduardoTBuss
 * repository. If that repository changes a field, the build fails here with a
 * readable error instead of rendering a half-empty page.
 */
import { z } from 'astro/zod';

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be kebab-case');
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD');
const urlOrEmpty = z.union([z.string().url(), z.literal('')]);

export const profileSchema = z.object({
  name: z.string(),
  username: z.string(),
  role: z.string(),
  subtitle: z.string(),
  bio: z.string(),
  location: z.string(),
  interests: z.array(z.string()),
  links: z.object({
    github: z.string().url(),
    linkedin: z.string().url(),
    orcid: z.string().url(),
    academic_email: z.string(),
  }),
});

export const researchSchema = z.object({
  updated: isoDate.optional(),
  items: z.array(z.object({
    title: z.string(),
    detail: z.string(),
    status: z.enum(['active', 'paused']),
  })),
});

export const publicationsSchema = z.object({
  updated: isoDate.optional(),
  items: z.array(z.object({
    id: slug,
    year: z.number().int(),
    title: z.string(),
    venue: z.string(),
    status: z.enum(['published', 'accepted', 'submitted', 'in preparation']),
    url: urlOrEmpty,
    doi: z.string().nullable(),
  })),
});

export const projectsSchema = z.object({
  updated: isoDate.optional(),
  items: z.array(z.object({
    slug,
    title: z.string(),
    tagline: z.string().max(110, 'tagline must fit on one line (<= 110 chars)'),
    summary: z.string(),
    category: z.string(),
    languages: z.array(z.string()).min(1).max(4),
    year: z.number().int(),
    order: z.number().int(),
    pinned: z.boolean(),
    has_page: z.boolean(),
    headline_metric: z.string().nullable(),
    publications: z.array(slug),
    links: z.object({
      repo: z.string().url(),
      demo: z.string().url().nullable(),
      docs: z.string().url().nullable(),
      dataset: z.string().url().nullable(),
    }),
  })),
});

export const nowSchema = z.object({
  updated: isoDate,
  lines: z.array(z.string().max(140)).max(3),
});

export const cvSchema = z.object({
  updated: isoDate,
  review_status: z.string().optional(),
  education: z.array(z.object({
    period: z.string(), degree: z.string(), institution: z.string(), detail: z.string(),
  })),
  experience: z.array(z.object({
    period: z.string(), role: z.string(), org: z.string(), detail: z.string(),
  })),
  skills: z.array(z.object({ group: z.string(), items: z.array(z.string()) })),
  awards: z.array(z.object({ year: z.number().int(), title: z.string() })),
  pdf: z.string().nullable(),
});

export const githubSchema = z.object({
  username: z.string(),
  public_repos: z.number().int(),
  followers: z.number().int(),
  following: z.number().int(),
  stars_received: z.number().int(),
  forks_received: z.number().int(),
  top_languages: z.array(z.object({ name: z.string(), repositories: z.number().int() })),
  refreshed_at: z.string(),
  created_at: z.string().optional(),
});

export type Profile = z.infer<typeof profileSchema>;
export type ResearchItem = z.infer<typeof researchSchema>['items'][number];
export type Publication = z.infer<typeof publicationsSchema>['items'][number];
export type Project = z.infer<typeof projectsSchema>['items'][number];
export type Now = z.infer<typeof nowSchema>;
export type Cv = z.infer<typeof cvSchema>;
