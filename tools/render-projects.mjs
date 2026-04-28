import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const projectDataPath = resolve(root, 'assets/data/projects.json');
const indexPath = resolve(root, 'index.html');

const data = JSON.parse(await readFile(projectDataPath, 'utf8'));
const projects = [...data.projects].sort((a, b) => a.order - b.order);

validateProjects(projects);

let html = await readFile(indexPath, 'utf8');
html = replaceBlock(html, 'FEATURED_PROJECTS', renderFeaturedProjects(projects));
html = replaceBlock(html, 'PROJECT_INDEX', renderProjectIndex(projects));
html = replaceBlock(html, 'PROJECT_STRUCTURED_DATA', renderProjectJsonLd(projects));

await writeFile(indexPath, html, 'utf8');
console.log(`Rendered ${projects.length} projects into index.html`);

function validateProjects(projects) {
  const required = ['id', 'order', 'name', 'repo', 'category', 'type', 'status', 'accent', 'updated', 'headline', 'description', 'tech', 'links', 'preview'];
  const ids = new Set();

  for (const project of projects) {
    for (const key of required) {
      if (project[key] === undefined || project[key] === null || project[key] === '') {
        throw new Error(`Project "${project.name ?? project.id}" is missing required field "${key}".`);
      }
    }

    if (ids.has(project.id)) {
      throw new Error(`Duplicate project id: ${project.id}`);
    }

    ids.add(project.id);

    if (!Array.isArray(project.tech) || project.tech.length === 0) {
      throw new Error(`Project "${project.name}" needs at least one tech item.`);
    }

    if (!project.links.repo) {
      throw new Error(`Project "${project.name}" needs a repo link.`);
    }
  }
}

function replaceBlock(source, blockName, replacement) {
  const start = `<!-- ${blockName}_START -->`;
  const end = `<!-- ${blockName}_END -->`;
  const pattern = new RegExp(`${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}`);

  if (!pattern.test(source)) {
    throw new Error(`Missing ${blockName} block in index.html`);
  }

  return source.replace(pattern, `${start}\n${replacement}\n${end}`);
}

function renderFeaturedProjects(projects) {
  return projects
    .filter((project) => project.featured)
    .map((project, index) => renderFeaturedProject(project, index))
    .join('\n');
}

function renderFeaturedProject(project, index) {
  const metrics = project.metrics ?? [];
  const metricMarkup = metrics
    .map((metric) => `
              <div>
                <dt>${escapeHtml(metric.label)}</dt>
                <dd>${escapeHtml(metric.value)}</dd>
              </div>`)
    .join('');

  return `          <article class="project-panel reveal" data-project-card data-featured="true" data-category="${attr(project.category)}" data-status="${attr(project.status)}" data-order="${project.order}" data-updated="${attr(project.updated)}" data-name="${attr(project.name)}" data-search="${attr(projectSearchText(project))}" style="--project-accent: ${attr(project.accent)}">
            <div class="project-panel__body">
              <p class="eyebrow">${String(index + 1).padStart(2, '0')} / ${escapeHtml(project.category)}</p>
              <h3>${escapeHtml(project.name)}</h3>
              <p class="project-headline">${escapeHtml(project.headline)}</p>
              <p>${escapeHtml(project.description)}</p>
              ${project.whyFeatured ? `<p class="project-why">${escapeHtml(project.whyFeatured)}</p>` : ''}
              ${metricMarkup ? `<dl class="project-metrics">${metricMarkup}
              </dl>` : ''}
              <ul class="tag-list" aria-label="Technologies used">
                ${project.tech.map((item) => `<li>${escapeHtml(item)}</li>`).join('\n                ')}
              </ul>
              <div class="project-actions">
                ${renderLinks(project)}
              </div>
            </div>
            <div class="project-panel__visual" aria-hidden="true">
              ${renderPreview(project)}
            </div>
          </article>`;
}

function renderProjectIndex(projects) {
  return projects
    .filter((project) => !project.featured)
    .map((project) => renderCompactProject(project))
    .join('\n');
}

function renderCompactProject(project) {
  return `          <article class="project-card reveal" data-project-card data-featured="false" data-category="${attr(project.category)}" data-status="${attr(project.status)}" data-order="${project.order}" data-updated="${attr(project.updated)}" data-name="${attr(project.name)}" data-search="${attr(projectSearchText(project))}" style="--project-accent: ${attr(project.accent)}">
            <div class="project-card__top">
              <p class="eyebrow">${escapeHtml(project.category)}</p>
              <span>${escapeHtml(project.status)}</span>
            </div>
            <h3>${escapeHtml(project.name)}</h3>
            <p>${escapeHtml(project.headline)}</p>
            <div class="project-card__meta">
              <span>${escapeHtml(project.type)}</span>
              <span>${formatDate(project.updated)}</span>
            </div>
            <ul class="tag-list" aria-label="Technologies used">
              ${project.tech.slice(0, 5).map((item) => `<li>${escapeHtml(item)}</li>`).join('\n              ')}
            </ul>
            <div class="project-actions project-actions--compact">
              ${renderLinks(project)}
            </div>
          </article>`;
}

function renderLinks(project) {
  const links = [];

  if (project.links.demo) {
    links.push(`<a class="project-link project-link--primary" href="${attr(project.links.demo)}" target="_blank" rel="noopener noreferrer" aria-label="Open live demo for ${attr(project.name)}">
                  ${iconExternal()}<span>Demo</span>
                </a>`);
  }

  links.push(`<a class="project-link" href="${attr(project.links.repo)}" target="_blank" rel="noopener noreferrer" aria-label="Open GitHub repository for ${attr(project.name)}">
                ${iconGitHub()}<span>Code</span>
              </a>`);

  return links.join('\n                ');
}

function renderPreview(project) {
  switch (project.preview) {
    case 'casino':
      return `<div class="preview preview--casino">
                <div class="preview-header"><span>edge.engine.ts</span><strong>EV</strong></div>
                <div class="odds-board">
                  <span>Blackjack</span><b>+0.42</b>
                  <span>Video poker</span><b>Hold 3</b>
                  <span>Hold'em</span><b>67%</b>
                  <span>Craps</span><b>-1.41</b>
                </div>
                <div class="worker-line"><i></i><i></i><i></i><span>worker queue</span></div>
              </div>`;
    case 'puzzle':
      return `<div class="preview preview--puzzle">
                <div class="preview-header"><span>constraint map</span><strong>SOLVED</strong></div>
                <div class="puzzle-board">
                  ${['', 'Q', '', '', '', '', '', 'Q', '', 'Q', '', '', '', '', 'Q', '', '', '', '', 'Q', '', '', '', '', ''].map((cell) => `<span>${cell}</span>`).join('')}
                </div>
              </div>`;
    case 'dice':
      return `<div class="preview preview--dice">
                <div class="preview-header"><span>turn advisor</span><strong>EV +148</strong></div>
                <div class="dice-row"><span>1</span><span>5</span><span>5</span><span>2</span><span>6</span><span>1</span></div>
                <div class="ev-bars"><i style="--h: 78%"></i><i style="--h: 48%"></i><i style="--h: 62%"></i><i style="--h: 34%"></i><i style="--h: 88%"></i></div>
              </div>`;
    case 'playlist':
      return `<div class="preview preview--playlist">
                <div class="preview-header"><span>mix assist</span><strong>PKCE</strong></div>
                <div class="track-list">
                  <span><b></b>Energy 0.82</span>
                  <span><b></b>Tempo 124</span>
                  <span><b></b>Valence 0.68</span>
                  <span><b></b>Outlier low</span>
                </div>
              </div>`;
    case 'video':
      return `<div class="preview preview--video">
                <div class="preview-header"><span>motion field</span><strong>RAFT</strong></div>
                <div class="frame-stack"><i></i><i></i><i></i></div>
                <div class="motion-lines"><span></span><span></span><span></span><span></span></div>
              </div>`;
    case 'route':
      return `<div class="preview preview--route">
                <div class="preview-header"><span>route scorer</span><strong>STATIC</strong></div>
                <div class="route-line"><i></i><i></i><i></i><i></i></div>
                <div class="route-stops"><span>Coffee</span><span>Lunch</span><span>Scenic</span></div>
              </div>`;
    default:
      return `<div class="preview preview--terminal">
                <div class="preview-header"><span>${escapeHtml(project.repo)}</span><strong>${escapeHtml(project.type)}</strong></div>
                <code>&gt; load ${escapeHtml(project.id)}<br>&gt; inspect workflow<br>&gt; ship</code>
              </div>`;
  }
}

function renderProjectJsonLd(projects) {
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Maxwell Metzner featured software projects',
    itemListElement: projects.map((project, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'SoftwareSourceCode',
        name: project.name,
        description: project.headline,
        codeRepository: project.links.repo,
        url: project.links.demo ?? project.links.repo,
        programmingLanguage: project.tech[0],
        applicationCategory: project.category
      }
    }))
  };

  return `<script type="application/ld+json">
${JSON.stringify(itemList, null, 2)}
  </script>`;
}

function projectSearchText(project) {
  return [
    project.name,
    project.repo,
    project.category,
    project.type,
    project.status,
    project.headline,
    project.description,
    ...(project.tech ?? [])
  ].join(' ').toLowerCase();
}

function formatDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric' }).format(date);
}

function iconExternal() {
  return `<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M7 17 17 7M9 7h8v8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function iconGitHub() {
  return `<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3.1-.3 6-1.5 6-6.7a5.2 5.2 0 0 0-1.4-3.6 4.8 4.8 0 0 0-.1-3.5s-1.1-.3-3.6 1.4a12.4 12.4 0 0 0-6.6 0C5.8-.1 4.7.2 4.7.2a4.8 4.8 0 0 0-.1 3.5A5.2 5.2 0 0 0 3.2 7.8c0 5.2 3 6.4 6 6.7a4.3 4.3 0 0 0-.8 2.6v4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function attr(value) {
  return escapeHtml(value);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
