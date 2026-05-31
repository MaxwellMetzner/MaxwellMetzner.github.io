import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const projectDataPath = resolve(root, 'assets/data/projects.json');
const indexPath = resolve(root, 'index.html');

const data = JSON.parse(await readFile(projectDataPath, 'utf8'));
const projects = [...data.projects].sort((a, b) => a.order - b.order);
const categories = data.categories ?? deriveCategories(projects);

validateProjects(projects, categories);

let html = await readFile(indexPath, 'utf8');
html = replaceBlock(html, 'FEATURED_PROJECTS', renderProjectExplorer(projects, categories));
html = replaceBlock(html, 'PROJECT_STRUCTURED_DATA', renderProjectJsonLd(projects));

await writeFile(indexPath, html, 'utf8');
console.log(`Rendered ${projects.length} projects across ${categories.length} categories into index.html`);

function validateProjects(projects, categories) {
  const requiredProjectFields = ['id', 'order', 'name', 'category', 'type', 'status', 'accent', 'headline', 'description', 'tech', 'links', 'preview'];
  const requiredCategoryFields = ['id', 'name', 'label', 'summary', 'accent'];
  const ids = new Set();
  const categoryNames = new Set();

  for (const category of categories) {
    for (const key of requiredCategoryFields) {
      if (category[key] === undefined || category[key] === null || category[key] === '') {
        throw new Error(`Category "${category.name ?? category.id}" is missing required field "${key}".`);
      }
    }

    categoryNames.add(category.name);
  }

  for (const project of projects) {
    for (const key of requiredProjectFields) {
      if (project[key] === undefined || project[key] === null || project[key] === '') {
        throw new Error(`Project "${project.name ?? project.id}" is missing required field "${key}".`);
      }
    }

    if (ids.has(project.id)) {
      throw new Error(`Duplicate project id: ${project.id}`);
    }

    ids.add(project.id);

    if (!categoryNames.has(project.category)) {
      throw new Error(`Project "${project.name}" references unknown category "${project.category}".`);
    }

    if (!project.updated && !project.updatedLabel) {
      throw new Error(`Project "${project.name}" needs either "updated" or "updatedLabel".`);
    }

    if (!Array.isArray(project.tech) || project.tech.length === 0) {
      throw new Error(`Project "${project.name}" needs at least one tech item.`);
    }

    if (typeof project.links !== 'object' || Array.isArray(project.links)) {
      throw new Error(`Project "${project.name}" needs a links object.`);
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

function renderProjectExplorer(projects, categories) {
  const totalLabel = `${projects.length} projects`;

  return `          <div class="project-console" data-project-controls>
            <div class="project-console__header">
              <div>
                <p class="eyebrow">Project explorer</p>
                <h3>Focused project explorer.</h3>
              </div>
              <div class="project-console__meta" aria-label="Project catalog summary">
                <span>${escapeHtml(totalLabel)}</span>
                <span>Curated order</span>
              </div>
            </div>

            <div class="project-browser">
              <div class="category-rail" role="group" aria-label="Project categories">
${renderCategoryButtons(categories, projects)}
              </div>

              <div class="project-stage">
                <div class="project-stage__tools">
                  <div class="project-stage__copy">
                    <p class="eyebrow" data-project-kicker>Awaiting category</p>
                    <h3 data-project-title>No project group selected.</h3>
                    <p data-project-copy>The showcase stays focused until a category is selected.</p>
                  </div>
                  <label class="search-box project-search">
                    <span class="sr-only">Search selected projects</span>
                    ${iconSearch()}
                    <input id="project-search" type="search" placeholder="Search selected category" disabled>
                  </label>
                </div>

                <div class="project-empty" data-project-empty hidden>
                  <div class="project-empty__signal" aria-hidden="true">
                    <span></span><span></span><span></span><span></span>
                  </div>
                  <div>
                    <p class="eyebrow" data-project-empty-kicker>Ready</p>
                    <h3 data-project-empty-title>Pick a category.</h3>
                    <p data-project-empty-copy>Category cards on the left control which projects are rendered here.</p>
                  </div>
                </div>

                <div class="project-grid" id="project-grid" data-project-list>
${renderProjectCards(projects)}
                </div>
              </div>
            </div>
          </div>`;
}

function renderCategoryButtons(categories, projects) {
  const counts = new Map();
  for (const project of projects) {
    counts.set(project.category, (counts.get(project.category) ?? 0) + 1);
  }

  return categories
    .map((category, index) => `                <button class="category-button" type="button" data-category-filter="${attr(category.name)}" data-category-label="${attr(category.label)}" data-category-summary="${attr(category.summary)}" aria-pressed="false" style="--category-accent: ${attr(category.accent)}">
                  <span class="category-button__index">${String(index + 1).padStart(2, '0')}</span>
                  <span class="category-button__copy">
                    <strong>${escapeHtml(category.name)}</strong>
                    <span>${escapeHtml(category.summary)}</span>
                  </span>
                  <span class="category-button__count">${String(counts.get(category.name) ?? 0).padStart(2, '0')}</span>
                </button>`)
    .join('\n');
}

function renderProjectCards(projects) {
  const categoryRanks = new Map();

  return projects
    .map((project) => {
      const rank = (categoryRanks.get(project.category) ?? 0) + 1;
      categoryRanks.set(project.category, rank);
      return renderProjectCard(project, rank);
    })
    .join('\n');
}

function renderProjectCard(project, categoryRank) {
  const metrics = renderMetrics(project.metrics);

  return `                  <article class="project-card reveal" data-project-card data-category="${attr(project.category)}" data-status="${attr(project.status)}" data-order="${project.order}" data-updated="${attr(project.updated ?? '')}" data-category-rank="${categoryRank}" data-name="${attr(project.name)}" data-search="${attr(projectSearchText(project))}" style="--project-accent: ${attr(project.accent)}">
                    <div class="project-card__content">
                      <div class="project-card__top">
                        <span class="project-card__number">${String(project.order).padStart(2, '0')}</span>
                        <span>${escapeHtml(project.status)}</span>
                      </div>
                      <h3>${escapeHtml(project.name)}</h3>
                      <p class="project-headline">${escapeHtml(project.headline)}</p>
                      <p>${escapeHtml(project.description)}</p>
                      ${metrics}
                      <div class="project-card__meta">
                        <span>${escapeHtml(project.type)}</span>
                        <span>${escapeHtml(displayDate(project))}</span>
                      </div>
                      <ul class="tag-list" aria-label="Technologies used">
                        ${project.tech.slice(0, 5).map((item) => `<li>${escapeHtml(item)}</li>`).join('\n                        ')}
                      </ul>
                      <div class="project-actions project-actions--compact">
                        ${renderLinks(project)}
                      </div>
                    </div>
                    <div class="project-card__visual" aria-hidden="true">
                      ${renderPreview(project)}
                    </div>
                  </article>`;
}

function renderMetrics(metrics = []) {
  if (!metrics.length) return '';

  return `<dl class="project-card__metrics">
                        ${metrics.slice(0, 3).map((metric) => `<div><dt>${escapeHtml(metric.label)}</dt><dd>${escapeHtml(metric.value)}</dd></div>`).join('\n                        ')}
                      </dl>`;
}

function renderLinks(project) {
  const links = [];

  if (project.links.demo) {
    links.push(`<a class="project-link project-link--primary" href="${attr(project.links.demo)}" target="_blank" rel="noopener noreferrer" aria-label="Open live demo for ${attr(project.name)}">
                          ${iconExternal()}<span>Demo</span>
                        </a>`);
  }

  if (project.links.docker) {
    links.push(`<a class="project-link project-link--primary" href="${attr(project.links.docker)}" target="_blank" rel="noopener noreferrer" aria-label="Open Docker image for ${attr(project.name)}">
                          ${iconPackage()}<span>Image</span>
                        </a>`);
  }

  if (project.links.repo) {
    links.push(`<a class="project-link" href="${attr(project.links.repo)}" target="_blank" rel="noopener noreferrer" aria-label="Open GitHub repository for ${attr(project.name)}">
                          ${iconGitHub()}<span>Code</span>
                        </a>`);
  }

  if (!links.length) {
    links.push(`<span class="project-link project-link--disabled" aria-label="No public link currently listed for ${attr(project.name)}">
                          ${iconLock()}<span>Unlisted</span>
                        </span>`);
  }

  return links.join('\n                        ');
}

function renderPreview(project) {
  switch (project.preview) {
    case 'casino':
      return `<div class="preview preview--casino">
                <div class="mini-casino-dashboard">
                  <header>
                    <strong>Choose a tool</strong>
                    <span>Open the game, enter the current hand or table state, and run the calculator.</span>
                  </header>
                  <section>
                    <article>
                      <div><b>Tables</b><em>Click the table state</em></div>
                      <span><b>Roulette</b><small>Open</small></span>
                      <span><b>Baccarat</b><small>Open</small></span>
                      <span><b>Craps</b><small>Open</small></span>
                    </article>
                    <article>
                      <div><b>Hands</b><em>Pick cards, get the decision</em></div>
                      <span><b>Blackjack</b><small>Open</small></span>
                      <span><b>Video Poker</b><small>Open</small></span>
                      <span><b>Pai Gow Poker</b><small>Open</small></span>
                    </article>
                    <article>
                      <div><b>Poker Equity</b><em>Run compact simulations</em></div>
                      <span><b>Texas Hold'em</b><small>Open</small></span>
                      <span><b>Omaha</b><small>Open</small></span>
                      <span><b>Seven-card stud</b><small>Open</small></span>
                    </article>
                  </section>
                </div>
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
    case 'wordle':
      return `<div class="preview preview--wordle">
                <div class="mini-wordle-header"><strong>Wordle Solver</strong><span>42 candidates</span></div>
                <div class="mini-wordle-board">
                  ${['C', 'R', 'A', 'N', 'E', 'S', 'L', 'A', 'T', 'E', 'P', 'O', 'I', 'N', 'T'].map((letter, index) => `<span class="${index === 1 || index === 8 ? 'hit' : index === 2 || index === 10 ? 'present' : index < 10 ? 'miss' : ''}">${letter}</span>`).join('')}
                </div>
                <div class="mini-wordle-rank">
                  <b>Recommended</b>
                  <span>SOARE</span>
                  <em>2.91 expected bits / hard-mode legal</em>
                </div>
              </div>`;
    case 'monitor':
      return `<div class="preview preview--monitor">
                <div class="mini-monitor-shell">
                  <header>
                    <div><b>Change Monitor</b><span>Self-hosted availability watcher</span></div>
                    <nav><span>Dashboard</span><span>New</span><span>Settings</span></nav>
                  </header>
                  <div class="mini-monitor-kpis">
                    <span><em>Enabled</em><b>0</b></span>
                    <span><em>Alerts</em><b>3</b></span>
                    <span><em>Failed</em><b>0</b></span>
                  </div>
                  <section class="mini-monitor-card">
                    <div><b>Monitors</b><span>1 configured</span></div>
                    <article>
                      <strong>store.steampowered.com watch</strong>
                      <span>Paused</span>
                      <em>bad state / 5 minutes interval / 1.5s wait</em>
                    </article>
                  </section>
                  <section class="mini-monitor-card mini-monitor-alert">
                    <div><b>Recent Alerts</b></div>
                    <article>
                      <strong>store.steampowered.com watch</strong>
                      <span>Suppressed</span>
                      <em>Visual area changed: Out of stock</em>
                    </article>
                  </section>
                </div>
              </div>`;
    case 'regex':
      return `<div class="preview preview--regex">
                <div class="mini-regex-shell">
                  <header><strong>Regex Isolator</strong><span>Found 527 matches in editor-backed text.</span><button>Regex help</button></header>
                  <section class="mini-regex-controls">
                    <div>
                      <b>Pattern and scan options</b>
                      <span class="mini-regex-input">#(?:[0-9a-fA-F]{3}){1,2}\\b</span>
                      <em>0 capture groups / line-scan friendly</em>
                    </div>
                    <aside>
                      <b>Presets</b>
                      <span>Hex Color</span>
                      <button>Save preset</button>
                    </aside>
                  </section>
                  <section class="mini-regex-workspace">
                    <div class="mini-regex-editor">
                      <b>Editor source</b>
                      <code>&lt;style&gt; color: <mark>#c58af9</mark>; background: <mark>#0b57d0</mark>; border: <mark>#444746</mark>; &lt;/style&gt;</code>
                    </div>
                    <div class="mini-regex-results">
                      <b>527 matches</b>
                      <span>#c58af9</span><span>#444746</span><span>#0b57d0</span><span>#ffffff</span>
                    </div>
                  </section>
                </div>
              </div>`;
    case 'ocr':
      return `<div class="preview preview--ocr">
                <div class="mini-ocr-window">
                  <div class="mini-ocr-page"><span></span><span></span><span></span><b>OCR</b></div>
                  <div class="mini-ocr-output">
                    <strong>Text Recognition Studio</strong>
                    <span>confidence review</span>
                    <span>table export</span>
                    <span>batch ZIP</span>
                  </div>
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
    case 'image-inspector':
      return `<div class="preview preview--image-inspector">
                <div class="mini-inspector-page">
                  <span class="image-a"></span><span class="image-b"></span><span class="image-c"></span>
                  <div class="mini-inspector-outline"></div>
                </div>
                <div class="mini-inspector-toolbar"><i></i><b>Image Inspector</b><span>Scan</span><span>Close</span></div>
                <div class="mini-inspector-hover">
                  <strong>hero-image.webp</strong>
                  <em>cdn.example.com</em>
                  <div><span>FHD</span><span>WEBP</span><span>312 KB</span></div>
                </div>
                <div class="mini-inspector-panel">
                  <header><strong>Image Inspector</strong><span>Close</span></header>
                  <div class="mini-inspector-preview"></div>
                  <section>
                    <b>Source candidates</b>
                    <span>2400w srcset</span>
                    <span>current source</span>
                  </section>
                  <div class="mini-inspector-actions"><span>PNG</span><span>JPG</span><span>Source</span></div>
                </div>
              </div>`;
    case 'coursework':
      return `<div class="preview preview--coursework">
                <div class="mini-course-shell">
                  <header><strong>School-Projects</strong><span>Stevens Institute of Technology / 2019-2023</span></header>
                  <div class="mini-course-grid">
                    <article><b>Algorithms CS 385</b><span>waterjugpuzzle.cpp</span><span>rbtree.h</span><span>powergrid.cpp</span></article>
                    <article><b>Systems CS 392</b><span>chatclient.c</span><span>mtsumarray.c</span><span>findserver.c</span></article>
                    <article><b>Programming Language CS 496</b><span>checker.ml</span><span>parser.mly</span><span>interp.ml</span></article>
                    <article><b>Data Structures CS 284</b><span>Treap.java</span><span>PhoneBook.java</span><span>BinaryNumber.java</span></article>
                  </div>
                </div>
              </div>`;
    case 'extension':
      return `<div class="preview preview--extension">
                <div class="mini-browser-bar"><span></span><span></span><span></span><b>chrome://extension</b></div>
                <div class="mini-extension-popup">
                  <strong>${escapeHtml(project.name)}</strong>
                  <span>content script</span>
                  <span>service worker</span>
                  <span>focused popup UI</span>
                </div>
              </div>`;
    case 'sync':
      return `<div class="preview preview--sync">
                <div class="mini-sync-column"><strong>Steam</strong><span>local notes</span><span>sidecar state</span></div>
                <div class="mini-sync-arrows"><i></i><i></i><i></i></div>
                <div class="mini-sync-column"><strong>OneNote</strong><span>Graph API</span><span>rich pages</span></div>
              </div>`;
    case 'desktop':
      return `<div class="preview preview--desktop">
                <div class="mini-desktop-window">
                  <div class="mini-window-chrome"><span></span><span></span><span></span></div>
                  <div class="mini-desktop-list">
                    <b>${escapeHtml(project.name)}</b>
                    <span>local workflow</span>
                    <span>diagnostics</span>
                    <span>export controls</span>
                  </div>
                </div>
              </div>`;
    default:
      return `<div class="preview preview--terminal">
                <div class="preview-header"><span>${escapeHtml(project.repo ?? project.id)}</span><strong>${escapeHtml(project.type)}</strong></div>
                <code>&gt; load ${escapeHtml(project.id)}<br>&gt; inspect workflow<br>&gt; ship</code>
              </div>`;
  }
}

function renderProjectJsonLd(projects) {
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Maxwell Metzner software projects',
    itemListElement: projects.map((project, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'SoftwareSourceCode',
        name: project.name,
        description: project.headline,
        codeRepository: project.links.repo,
        url: project.links.demo ?? project.links.repo ?? project.links.docker ?? 'https://maxwellmetzner.github.io/',
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
    project.repo ?? '',
    project.category,
    project.type,
    project.status,
    project.headline,
    project.description,
    ...(project.tech ?? [])
  ].join(' ').toLowerCase();
}

function displayDate(project) {
  return project.updated ? formatDate(project.updated) : project.updatedLabel;
}

function formatDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric' }).format(date);
}

function deriveCategories(projects) {
  const seen = new Set();
  return projects
    .map((project) => project.category)
    .filter((category) => {
      if (seen.has(category)) return false;
      seen.add(category);
      return true;
    })
    .map((category) => ({
      id: category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      name: category,
      label: category,
      summary: `${category} projects`,
      accent: '#64748b'
    }));
}

function iconExternal() {
  return `<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M7 17 17 7M9 7h8v8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function iconGitHub() {
  return `<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3.1-.3 6-1.5 6-6.7a5.2 5.2 0 0 0-1.4-3.6 4.8 4.8 0 0 0-.1-3.5s-1.1-.3-3.6 1.4a12.4 12.4 0 0 0-6.6 0C5.8-.1 4.7.2 4.7.2a4.8 4.8 0 0 0-.1 3.5A5.2 5.2 0 0 0 3.2 7.8c0 5.2 3 6.4 6 6.7a4.3 4.3 0 0 0-.8 2.6v4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function iconPackage() {
  return `<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M4.5 7.8 12 12l7.5-4.2M12 21v-9" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`;
}

function iconLock() {
  return `<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6v-9Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`;
}

function iconSearch() {
  return `<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="m21 21-4.3-4.3M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
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
