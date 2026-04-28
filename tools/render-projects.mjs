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
                <div class="mini-casino-hero">
                  <span>Casino Cheat Sheet</span>
                  <strong>Exact analyzers</strong>
                  <p>Finite-shoe blackjack, poker equity, and rule-driven table games.</p>
                </div>
                <div class="mini-casino-grid">
                  <span><b>Blackjack</b><em>EV solve</em></span>
                  <span><b>Video poker</b><em>Hold rank</em></span>
                  <span><b>Hold'em</b><em>Equity</em></span>
                  <span><b>Craps</b><em>Table state</em></span>
                </div>
                <div class="mini-worker"><i></i><i></i><i></i><span>browser worker queue</span></div>
              </div>`;
    case 'puzzle':
      return `<div class="preview preview--puzzle">
                <div class="mini-linkedin-bar"><b>in</b><span>LinkedIn Puzzle Solver</span></div>
                <div class="mini-tabs"><span class="active">Queens</span><span>Tango</span><span>Zip</span></div>
                <div class="mini-puzzle-layout">
                  <div class="mini-puzzle-board">
                    ${['', 'Q', '', '', '', '', '', '', 'Q', '', 'Q', '', '', '', '', '', '', '', 'Q', '', '', 'Q', '', '', ''].map((cell, cellIndex) => `<span class="${cell ? 'queen' : cellIndex % 4 === 0 ? 'region-a' : cellIndex % 3 === 0 ? 'region-b' : ''}">${cell}</span>`).join('')}
                  </div>
                  <div class="mini-solver-panel">
                    <strong>Solve</strong>
                    <span>valid board</span>
                    <span>5 queens</span>
                    <span>no conflicts</span>
                  </div>
                </div>
              </div>`;
    case 'dice':
      return `<div class="preview preview--dice">
                <div class="mini-farkle-header"><strong>Farkle Lab</strong><span>Turn total 750</span></div>
                <div class="mini-score-grid">
                  <span><b>You</b><em>6,450</em></span>
                  <span><b>CPU</b><em>5,900</em></span>
                  <span><b>Target</b><em>10,000</em></span>
                </div>
                <div class="mini-dice-tray"><span>1</span><span>5</span><span>5</span><span>2</span><span>6</span><span>1</span></div>
                <div class="mini-advisor"><b>Recommended action</b><span>ROLL</span><em>Roll EV 948.2 / Bank EV 750.0</em></div>
              </div>`;
    case 'playlist':
      return `<div class="preview preview--playlist">
                <div class="mini-spotify-app">
                  <aside>
                    <strong>Spotify Manager</strong>
                    <span class="mini-spotify-button">Connect Spotify</span>
                    <span class="active">Road Trip Mix</span>
                    <span>Workout</span>
                  </aside>
                  <main>
                    <div class="mini-spotify-toolbar"><span>Columns</span><span>Shuffle</span><b>Export</b></div>
                    <div class="mini-table">
                      <span>Title</span><span>BPM</span><span>Energy</span>
                      <span>Night Drive</span><span>124</span><span>0.82</span>
                      <span>Arcade Bloom</span><span>118</span><span>0.74</span>
                      <span>Static Heart</span><span>132</span><span>0.89</span>
                    </div>
                    <div class="mini-ribbon"><b>Mix Assist</b><span>Transition diagnostics</span></div>
                  </main>
                </div>
              </div>`;
    case 'video':
      return `<div class="preview preview--video">
                <div class="mini-stabbot-header"><strong>Video Stabbot</strong><span>NVENC ready</span></div>
                <div class="mini-drop-zone">
                  <b>Drop video file here</b>
                  <span>MP4, AVI, MOV, MKV, WEBM</span>
                </div>
                <div class="mini-stabbot-modes">
                  <span><b>OpenCV</b><em>SIFT/ORB/AKAZE</em></span>
                  <span><b>RAFT</b><em>Dense optical flow</em></span>
                </div>
                <div class="mini-progress"><i></i><span>Stabilizing 62%</span></div>
              </div>`;
    case 'route':
      return `<div class="preview preview--route">
                <div class="mini-trip-steps">
                  <span class="complete"><b>1</b>Locations</span>
                  <span class="active"><b>2</b>Travel</span>
                  <span><b>3</b>Stops</span>
                </div>
                <div class="mini-route-map"><i></i><i></i><i></i><i></i></div>
                <div class="mini-timeline">
                  <span><b>10:20</b>Coffee / score 0.84</span>
                  <span><b>12:45</b>Lunch / 8 min detour</span>
                  <span><b>15:10</b>Scenic stop / daylight fit</span>
                </div>
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
