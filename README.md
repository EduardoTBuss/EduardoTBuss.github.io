# Eduardo Timm Buss: personal site

A modular Astro portfolio for research and engineering, with an immersive dark visual direction, a responsive project deck, and a lightweight interactive background. Pages render as static HTML for GitHub Pages; client JavaScript adds motion and interaction progressively.

Live: <https://eduardotbuss.github.io>.

## Run locally

Use Node 22.12 or newer. Canonical profile, publication, CV, and project JSON lives in the sibling [EduardoTBuss repository](https://github.com/EduardoTBuss/EduardoTBuss), under `data/`:

```text
repositorio/
  EduardoTBuss/
  EduardoTBuss.github.io/
```

```bash
npm install
npm run dev       # synchronizes canonical data, then starts Astro
npm run verify    # sync + content validation + Astro checks + build + budget + links
npm run preview   # previews the built site
```

Set `DATA_SOURCE` to use another canonical data directory. `npm run build` alone does not synchronize data; use `verify` for a complete validation.

## Change the site

| Change | Location |
|---|---|
| Palette, type scale, spacing | `src/styles/tokens.css` |
| Shared layout and typography | `src/styles/base.css`, `src/layouts/Base.astro` |
| Shared motion rules | `src/styles/animations.css` |
| Background rendering and pointer response | `src/components/InteractiveBackground.astro`, `src/scripts/interactive-background.ts` |
| Hero copy and calls to action | `src/components/sections/Hero.astro` |
| Horizontal project deck | `src/components/HorizontalProjectDeck.astro`, `src/scripts/project-deck.ts` |
| Pointer card illumination | `src/scripts/card-spotlight.ts` |
| Home composition | `src/pages/index.astro` |
| Individual home sections | `src/components/sections/` |
| Publication disclosure and topic notes | `src/components/PublicationCard.astro` |
| Project prose | `src/content/projects/<slug>.md` |
| Order Forge card screenshot | `public/images/order-forge-reconciliation.png` (copied from `Order-forge/docs/assets/`) |
| Profile, project metadata, publication status, CV | `data/*.json` in the canonical sibling repository |
| Homepage featured projects | `featuredSlugs` in `src/lib/content.ts` |
| Validated content gateway | `src/lib/content.ts`, `src/lib/schemas.ts` |
| Domain configuration | `docs/DOMAIN.md` |

Components access canonical data through the content gateway. Synced files under `src/data/` are ignored by Git; edit their source, not the generated copies. Publication topic notes are editorial descriptions based on canonical titles, clearly labeled as such; they must not invent experimental results or stand in for a paper abstract.

The three homepage features are selected in `featuredSlugs` in `src/lib/content.ts`. This site selection is independent of `pinned`, which controls the stable project list in the GitHub profile README.

## Motion and accessibility

The canvas is decorative and does not carry page content. Motion respects `prefers-reduced-motion`; the background controller pauses work when the document is hidden. Native links and publication `<details>` disclosures work without JavaScript and are usable by keyboard and touch. The project deck retains native scrolling. Keep visible focus states, touch targets, and reduced-motion behavior when adding interactions.

## Build budgets

`npm run budget` checks the existing `dist/` output:

- At most **150 KB uncompressed per route**, including HTML and recursively referenced local assets.
- At most **30 KB uncompressed JavaScript across all of `dist/`**, including deduplicated executable inline scripts.
- Local stylesheet URLs, ESM imports, dynamic imports, and `new URL()` asset references are traversed and deduplicated per route.
- Missing referenced assets fail the check. External URLs and embedded data URLs are excluded; embedded bytes already count in the parent file.

The dependency scanner covers literal references emitted by the build. If an interaction computes an asset URL at runtime, extend the checker or use a literal import so the asset is accounted for. Keep this check dependency-free.

## Add a project

1. Add canonical metadata to `data/projects.json` in the sibling repository. Set `pinned`, `has_page`, `order`, and related publication IDs as appropriate. A project with `has_page: false` appears in the repository catalog and links directly to GitHub.
2. For a detailed case study, set `has_page: true` and create `src/content/projects/<slug>.md` with `project: <slug>` in its frontmatter and sourced numerical facts. Label configuration values as such; never present them as performance results.
3. Use the required headings, in order: Problem, Approach, Architecture, Measured results, Engineering decisions, Limitations, Links. Architecture contains exactly one paragraph.
4. Run `npm run verify`. Numerical claims must be traceable to that project's repository or research notes.

## Structure

```text
src/
  data/          generated canonical JSON copies
  lib/           schema validation and content gateway
  styles/        design tokens, layout, and motion
  scripts/       small browser interaction modules
  layouts/       shared document shell
  components/    reusable primitives and home sections
  content/       project prose
  pages/         home, projects, publications, CV, and 404
scripts/         data sync, project validation, and build budget checks
```

Project decisions and debugging checkpoints are recorded in Eduardo's Brain (`site-pessoal-portfolio`); keep that record current when changing architecture or interaction behavior.

## Browser verification

`scripts/browser-smoke.mjs` checks a running production preview at `http://127.0.0.1:4321`. It uses Playwright with an isolated headless Chrome, never your personal Chrome profile. Install Playwright in a test environment or point `PORTFOLIO_PLAYWRIGHT_MODULE` at its module entry, then run `node scripts/browser-smoke.mjs`. `PORTFOLIO_PREVIEW_URL` overrides the preview URL. Screenshots and the JSON report are written to gitignored `artifacts/qa/`.

Coverage: all 15 routes, mobile widths 320/390/768, desktop 1440, project controls and keyboard, publication radio filters and disclosures, pause persistence, reduced motion, and JavaScript-disabled reading.
