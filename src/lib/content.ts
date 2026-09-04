/**
 * The only door between the data files and the pages.
 *
 * No .astro component imports JSON directly. Everything goes through the
 * functions below, so changing where the data comes from -- or how the
 * publication/project cross-reference is computed -- is a change in this file
 * and nowhere else.
 */
import profileRaw from '../data/profile.json';
import researchRaw from '../data/research.json';
import publicationsRaw from '../data/publications.json';
import projectsRaw from '../data/projects.json';
import nowRaw from '../data/now.json';
import cvRaw from '../data/cv.json';
import githubRaw from '../data/github.json';

import {
  profileSchema, researchSchema, publicationsSchema, projectsSchema,
  nowSchema, cvSchema, githubSchema,
  type Project, type Publication, type ResearchItem, type Profile, type Now, type Cv,
} from './schemas';

function parse<T>(schema: { parse: (v: unknown) => T }, raw: unknown, name: string): T {
  try {
    return schema.parse(raw);
  } catch (error) {
    throw new Error(`data/${name} does not match the contract:\n${error}`);
  }
}

const profile = parse(profileSchema, profileRaw, 'profile.json');
const research = parse(researchSchema, researchRaw, 'research.json');
const publications = parse(publicationsSchema, publicationsRaw, 'publications.json');
const projects = parse(projectsSchema, projectsRaw, 'projects.json');
const now = parse(nowSchema, nowRaw, 'now.json');
const cv = parse(cvSchema, cvRaw, 'cv.json');
const github = parse(githubSchema, githubRaw, 'github.json');

// Referential integrity. A project may only point at a publication that exists,
// otherwise the cross-link would render a dead anchor.
const publicationIds = new Set(publications.items.map((p) => p.id));
for (const project of projects.items) {
  for (const id of project.publications) {
    if (!publicationIds.has(id)) {
      throw new Error(
        `projects.json: "${project.slug}" references publication "${id}", ` +
        `which does not exist in publications.json`
      );
    }
  }
}

/** A project as seen from a publication: internal link when it has a page, external otherwise. */
export interface ProjectRef {
  slug: string;
  title: string;
  href: string | null;
  externalUrl: string;
}

export const projectHref = (project: Project): string | null =>
  project.has_page ? `/projects/${project.slug}/` : null;

const toRef = (project: Project): ProjectRef => ({
  slug: project.slug,
  title: project.title,
  href: projectHref(project),
  externalUrl: project.links.repo,
});

// The relation is declared in exactly one place -- projects[].publications --
// and inverted here for the publication side. Declaring it on both sides always
// ends up asymmetric.
const projectsByPublication = new Map<string, ProjectRef[]>();
for (const project of projects.items) {
  for (const id of project.publications) {
    const list = projectsByPublication.get(id) ?? [];
    list.push(toRef(project));
    projectsByPublication.set(id, list);
  }
}

const publicationById = new Map(publications.items.map((p) => [p.id, p]));

export const getProfile = (): Profile => profile;

export const getResearch = (): ResearchItem[] => research.items;

/** Publications, newest first, each carrying the projects that implement it. */
export const getPublications = (): (Publication & { relatedProjects: ProjectRef[] })[] =>
  [...publications.items]
    .sort((a, b) => b.year - a.year)
    .map((p) => ({ ...p, relatedProjects: projectsByPublication.get(p.id) ?? [] }));

/** The pinned projects, in manual order, each carrying the papers it backs. */
export const getSelectedWork = (): (Project & {
  relatedPublications: Publication[];
  href: string | null;
})[] =>
  projects.items
    .filter((p) => p.pinned)
    .sort((a, b) => a.order - b.order)
    .map((p) => ({
      ...p,
      relatedPublications: p.publications
        .map((id) => publicationById.get(id))
        .filter((x): x is Publication => Boolean(x)),
      href: projectHref(p),
    }));

/** Every project that owns a page. Drives the [slug] route. */
export const getProjectsWithPages = (): Project[] =>
  projects.items.filter((p) => p.has_page).sort((a, b) => a.order - b.order);

export const getProject = (slug: string): Project | undefined =>
  projects.items.find((p) => p.slug === slug);

export const getPublicationsFor = (slugs: string[]): Publication[] =>
  slugs.map((id) => publicationById.get(id)).filter((x): x is Publication => Boolean(x));

export const getNow = (): Now | null => (now.lines.length ? now : null);

export const getCv = (): Cv => cv;

export const getGitHub = () => github;

/** A publication rendered as one line of text, used in lists and on project pages. */
export const publicationMeta = (p: Publication): string =>
  p.status === 'published' ? `${p.venue}` : `${p.venue} (${p.status})`;

/** DOI is preferred over a bare URL; either may be absent. */
export const publicationLink = (p: Publication): { label: string; url: string } | null => {
  if (p.doi) return { label: `DOI ${p.doi}`, url: `https://doi.org/${p.doi}` };
  if (p.url) return { label: 'Proceedings', url: p.url };
  return null;
};
