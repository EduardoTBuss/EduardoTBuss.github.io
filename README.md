# eduardotbuss.github.io

Personal site and portfolio of Eduardo Timm Buss. Static Astro build, no client-side
JavaScript, one column, under 100 KB per page.

Live at <https://eduardotbuss.github.io>.

## Running it

The content is **not** in this repository. The canonical JSON lives in
[EduardoTBuss/EduardoTBuss](https://github.com/EduardoTBuss/EduardoTBuss) under `data/`,
and is copied in at build time so there is exactly one writer per file. Clone that
repository next to this one:

```
repositorio/
  EduardoTBuss/            <- the data
  EduardoTBuss.github.io/  <- this repository
```

Then:

```bash
npm install
npm run dev       # syncs the data, then starts the dev server
npm run verify    # sync, validate, build, enforce the weight budget
```

Set `DATA_SOURCE` to override where the JSON is read from.

## Where do I change...

| I want to change | Edit |
|---|---|
| the accent colour, a font size, the column width, any spacing | `src/styles/tokens.css` — nothing else hardcodes a visual value |
| the order of the home page sections, or drop one | `src/pages/index.astro` — it is a list of components, one line each |
| the wording of a section | `src/components/sections/<Name>.astro` |
| the prose of a project page | `src/content/projects/<slug>.md` |
| a project's title, tagline, links, languages, order, or which papers it backs | `data/projects.json` **in the other repository** |
| a publication | `data/publications.json` **in the other repository** |
| the CV, the Now lines, the bio | `data/cv.json`, `data/now.json`, `data/profile.json` **in the other repository** |
| where the data is read from | `src/lib/content.ts` — no component imports JSON directly |
| the custom domain | `docs/DOMAIN.md` |

## Adding a project

1. Add an entry to `data/projects.json` in the other repository. Set `pinned` and
   `has_page` to `true`, give it an `order`, and list the ids of any papers it backs.
2. Create `src/content/projects/<slug>.md` here, with `project: <slug>` in the frontmatter
   and between two and four measured `metrics`.
3. The body must carry these seven headings, in this order: Problem, Approach, Architecture
   (exactly one paragraph), Measured results, Engineering decisions, Limitations, Links.

`npm run check` fails the build if any of that is wrong. That is the point: six pages that
share a shape read as a collection, six pages that each invent their own read as six loose
essays.

## Constraints this repository holds itself to

- Zero client-side JavaScript. `npm run budget` fails if a single `.js` file reaches `dist`.
- Under 100 KB per route, uncompressed, including assets. Enforced, not hoped for.
- One accent colour, one type family, no webfonts, no emoji, no badges, no cards, no
  animation.
- Light and dark through `prefers-color-scheme` only; a theme toggle would need JavaScript.
- Every number quoted on a project page is measured and appears in that project's own
  repository or notes.

## Layout

```
src/
  data/          synced from the other repository, gitignored
  lib/
    schemas.ts   the data contract, as Zod
    content.ts   the only door between the data and the pages
  styles/        tokens.css (every visual decision) and base.css
  layouts/       the page shell
  components/    primitives, plus one component per home page section
  content/       the prose of the six project pages
  pages/         index, 404, and the [slug] route for projects
scripts/         sync-data, check-project-pages, check-budget
```
