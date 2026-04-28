# MaxwellMetzner.github.io

Static portfolio site for Maxwell Metzner, deployed with GitHub Pages.

The site is designed as a fast, distinctive, no-backend portfolio for technical project work: algorithmic solvers, browser extensions, desktop utilities, automation systems, and static web apps.

## Architecture

- `index.html` is committed static HTML for SEO, social previews, accessibility, and no-JS browsing.
- `assets/data/projects.json` is the canonical project database.
- `tools/render-projects.mjs` regenerates the project sections and project JSON-LD from that data.
- `assets/css/style.css` owns the visual system, responsive layout, reduced-motion behavior, and performance-minded containment.
- `assets/js/script.js` progressively enhances the page with filtering, sorting, theme persistence, scroll state, reveal motion, copy-email behavior, and the canvas signal field.

## Site Structure

- `Home`: first-viewport personal signal, primary CTAs, and core technical positioning.
- `Projects`: featured project panels, selection criteria, filters, search, sorting, and a scalable project index.
- `System`: explains the static architecture and data-driven project workflow.
- `About`: professional background and core technologies.
- `Contact`: email, resume, GitHub, and LinkedIn links.

## Project Selection Criteria

Feature projects when they score well on:

- **Technical depth**: algorithms, worker pipelines, platform APIs, sync engines, media processing, or real architecture.
- **Portfolio signal**: complete products that show ownership, polish, and engineering judgment.
- **User value**: specific workflow value rather than a generic sample app.
- **Demo quality**: live static demos and inspectable visual previews where possible.

The current flagship set is Casino Cheat Sheet, LinkedIn Puzzle Solver, Farkle Lab, Spotify Manager, Video Stabbot, and Trip Planner.

## Project Showcase System

Project cards are generated from `assets/data/projects.json`.

Important fields:

- `order`: curated display order.
- `featured`: `true` for large flagship panels, `false` for compact index cards.
- `category`, `type`, `status`: used for labels and filters.
- `headline`, `description`, `whyFeatured`: used for project copy.
- `tech`: shown as compact tags.
- `metrics`: optional, used only by featured panels.
- `links.repo` and optional `links.demo`: rendered as card actions.
- `preview`: chooses the visual preview template in `tools/render-projects.mjs`.

After changing project data, run:

```powershell
npm run build:projects
```

## Performance Strategy

- No frontend framework or runtime build output.
- No external fonts; system fonts avoid render-blocking font downloads.
- Static HTML keeps content indexable and visible without JavaScript.
- JavaScript is deferred and only enhances an already usable page.
- Canvas animation respects `prefers-reduced-motion`, pauses when the tab is hidden, and caps device pixel ratio.
- WebP variants are used for the main images with PNG/JPG fallbacks.
- Below-the-fold images are lazy-loaded.
- CSS avoids layout-heavy animation and uses containment on repeated project surfaces.

## Local Preview

```powershell
npm run serve
```

Then open `http://localhost:4173/`.

Opening `index.html` directly also works for the static content, but a local server better matches GitHub Pages behavior.

