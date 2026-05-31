# MaxwellMetzner.github.io

Static portfolio site for Maxwell Metzner, deployed with GitHub Pages.

The site is designed as a fast, distinctive, no-backend portfolio for technical project work: algorithmic solvers, browser extensions, desktop utilities, automation systems, and static web apps.

## Architecture

- `index.html` is committed static HTML for SEO, social previews, accessibility, and no-JS browsing.
- `assets/data/projects.json` is the canonical project and category database.
- `tools/render-projects.mjs` regenerates the project sections and project JSON-LD from that data.
- `assets/css/style.css` owns the visual system, responsive layout, reduced-motion behavior, and performance-minded containment.
- `assets/js/script.js` progressively enhances the page with filtering, sorting, theme persistence, scroll state, reveal motion, copy-email behavior, and the canvas signal field.

## Site Structure

- `Home`: first-viewport personal signal, primary CTAs, and core technical positioning.
- `Projects`: a category-driven project explorer with focused search and spotlight previews.
- `System`: explains the static architecture and data-driven project workflow.
- `About`: professional background and core technologies.
- `Contact`: email, resume, GitHub, and LinkedIn links.

## Project Organization

Projects are grouped by the portfolio surfaces that visitors can evaluate:

- **Websites with live demos**: static apps, solver engines, and browser-first tools.
- **Docker images**: self-hosted services with repeatable deployment paths.
- **Standalone Apps**: desktop, local, and CLI utilities.
- **Chrome Extensions**: Manifest V3 browser workflow tools.
- **Other**: archive or supporting repositories.

## Project Showcase System

Project cards are generated from `assets/data/projects.json`.

Important fields:

- `categories`: controls category labels, descriptions, accents, and display order.
- `order`: curated display order.
- `category`, `type`, `status`: used for labels and filters.
- `headline`, `description`: used for project copy.
- `tech`: shown as compact tags.
- `metrics`: optional, shown when a card has extra technical signals.
- `links.repo`, optional `links.demo`, and optional `links.docker`: rendered as card actions.
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
