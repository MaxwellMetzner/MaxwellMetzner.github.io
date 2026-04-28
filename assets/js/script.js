(() => {
  'use strict';

  const root = document.documentElement;
  root.classList.add('js');

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  const statusMessage = document.getElementById('status-message');

  const announce = (message) => {
    if (statusMessage) statusMessage.textContent = message;
  };

  const initTheme = () => {
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;

    const getTheme = () => root.dataset.theme || (prefersDark.matches ? 'dark' : 'light');
    const setTheme = (theme, persist = true) => {
      root.dataset.theme = theme;
      toggle.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
      if (persist) localStorage.setItem('theme', theme);
    };

    setTheme(getTheme(), Boolean(localStorage.getItem('theme')));

    toggle.addEventListener('click', () => {
      const nextTheme = getTheme() === 'dark' ? 'light' : 'dark';
      setTheme(nextTheme);
      announce(`${nextTheme} theme enabled`);
    });

    prefersDark.addEventListener('change', (event) => {
      if (!localStorage.getItem('theme')) {
        setTheme(event.matches ? 'dark' : 'light', false);
      }
    });
  };

  const initNavigation = () => {
    const header = document.getElementById('site-header');
    const navToggle = document.getElementById('nav-toggle');
    const nav = document.getElementById('primary-nav');
    const links = [...document.querySelectorAll('.primary-nav a')];

    const closeNav = () => {
      document.body.classList.remove('nav-open');
      nav?.classList.remove('is-open');
      navToggle?.setAttribute('aria-expanded', 'false');
    };

    navToggle?.addEventListener('click', () => {
      const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!isOpen));
      nav?.classList.toggle('is-open', !isOpen);
      document.body.classList.toggle('nav-open', !isOpen);
    });

    links.forEach((link) => {
      link.addEventListener('click', closeNav);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeNav();
    });

    let scrollTicking = false;
    const updateHeader = () => {
      header?.classList.toggle('is-scrolled', window.scrollY > 12);
      scrollTicking = false;
    };

    window.addEventListener('scroll', () => {
      if (!scrollTicking) {
        requestAnimationFrame(updateHeader);
        scrollTicking = true;
      }
    }, { passive: true });

    const sections = [...document.querySelectorAll('main section[id]')];
    if (!sections.length || !links.length) return;

    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) return;

      links.forEach((link) => {
        link.classList.toggle('active', link.getAttribute('href') === `#${visible.target.id}`);
      });
    }, {
      rootMargin: '-22% 0px -66% 0px',
      threshold: [0, 0.2, 0.6]
    });

    sections.forEach((section) => observer.observe(section));
    updateHeader();
  };

  const initProjectTools = () => {
    const controls = document.querySelector('[data-project-controls]');
    const cards = [...document.querySelectorAll('[data-project-card]')];
    const lists = [...document.querySelectorAll('[data-project-list]')];
    const filterButtons = [...document.querySelectorAll('[data-filter]')];
    const searchInput = document.getElementById('project-search');
    const sortSelect = document.getElementById('project-sort');

    if (!controls || !cards.length) return;

    let activeFilter = 'all';
    let searchTerm = '';

    const matchesFilter = (card) => {
      if (activeFilter === 'all') return true;
      return card.dataset.status === activeFilter || card.dataset.category === activeFilter;
    };

    const matchesSearch = (card) => {
      if (!searchTerm) return true;
      return card.dataset.search?.includes(searchTerm);
    };

    const updateProjects = () => {
      let visibleCount = 0;

      cards.forEach((card) => {
        const isVisible = matchesFilter(card) && matchesSearch(card);
        card.hidden = !isVisible;
        if (isVisible) visibleCount += 1;
      });

      announce(`${visibleCount} projects shown`);
    };

    const sortCards = () => {
      const mode = sortSelect?.value ?? 'curated';

      lists.forEach((list) => {
        const listCards = [...list.querySelectorAll('[data-project-card]')];
        listCards.sort((a, b) => {
          if (mode === 'recent') {
            return new Date(b.dataset.updated) - new Date(a.dataset.updated);
          }

          if (mode === 'name') {
            return a.dataset.name.localeCompare(b.dataset.name);
          }

          return Number(a.dataset.order) - Number(b.dataset.order);
        });

        listCards.forEach((card) => list.append(card));
      });
    };

    filterButtons.forEach((button) => {
      button.addEventListener('click', () => {
        activeFilter = button.dataset.filter;
        filterButtons.forEach((candidate) => candidate.classList.toggle('active', candidate === button));
        updateProjects();
      });
    });

    searchInput?.addEventListener('input', () => {
      searchTerm = searchInput.value.trim().toLowerCase();
      updateProjects();
    });

    sortSelect?.addEventListener('change', () => {
      sortCards();
      updateProjects();
    });

    const setSpotlight = (event) => {
      const card = event.currentTarget;
      const rect = card.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--mx', `${x}%`);
      card.style.setProperty('--my', `${y}%`);
    };

    cards.forEach((card) => {
      card.addEventListener('pointermove', setSpotlight, { passive: true });
    });

    sortCards();
    updateProjects();
  };

  const initReveal = () => {
    const revealItems = [...document.querySelectorAll('.reveal')];
    if (!revealItems.length) return;

    if (prefersReducedMotion.matches || !('IntersectionObserver' in window)) {
      revealItems.forEach((item) => item.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '0px 0px -10% 0px',
      threshold: 0.08
    });

    revealItems.forEach((item) => observer.observe(item));
  };

  const initCopyEmail = () => {
    const button = document.getElementById('copy-email');
    if (!button) return;

    const label = button.querySelector('span');
    const originalLabel = label?.textContent ?? 'Copy Email';

    button.addEventListener('click', async () => {
      const email = button.dataset.email;
      if (!email) return;

      try {
        await navigator.clipboard.writeText(email);
      } catch (error) {
        const textarea = document.createElement('textarea');
        textarea.value = email;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.append(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
      }

      if (label) label.textContent = 'Copied';
      announce('Email address copied');

      window.setTimeout(() => {
        if (label) label.textContent = originalLabel;
      }, 1800);
    });
  };

  const initCurrentYear = () => {
    const year = document.getElementById('current-year');
    if (year) year.textContent = String(new Date().getFullYear());
  };

  const initSignalCanvas = () => {
    const canvas = document.getElementById('signal-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let nodes = [];
    let animationId = 0;
    let isVisible = true;

    const colors = ['#0f766e', '#2563eb', '#f59e0b', '#dc2626', '#16a34a'];

    const reset = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

      const count = width < 720 ? 34 : 64;
      nodes = Array.from({ length: count }, (_, index) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        radius: 1.4 + Math.random() * 2.8,
        color: colors[index % colors.length]
      }));

      draw();
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.globalAlpha = root.dataset.theme === 'dark' || (!root.dataset.theme && prefersDark.matches) ? 0.58 : 0.38;

      for (let i = 0; i < nodes.length; i += 1) {
        const a = nodes[i];

        if (!prefersReducedMotion.matches) {
          a.x += a.vx;
          a.y += a.vy;

          if (a.x < -20) a.x = width + 20;
          if (a.x > width + 20) a.x = -20;
          if (a.y < -20) a.y = height + 20;
          if (a.y > height + 20) a.y = -20;
        }

        for (let j = i + 1; j < nodes.length; j += 1) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const maxDistance = width < 720 ? 110 : 145;

          if (distance < maxDistance) {
            ctx.strokeStyle = a.color;
            ctx.globalAlpha = (1 - distance / maxDistance) * 0.18;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }

        ctx.globalAlpha = 0.5;
        ctx.fillStyle = a.color;
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const tick = () => {
      draw();
      if (!prefersReducedMotion.matches && isVisible) {
        animationId = requestAnimationFrame(tick);
      }
    };

    const start = () => {
      cancelAnimationFrame(animationId);
      if (prefersReducedMotion.matches) {
        draw();
      } else if (isVisible) {
        animationId = requestAnimationFrame(tick);
      }
    };

    const handleVisibility = () => {
      isVisible = document.visibilityState === 'visible';
      if (isVisible) {
        start();
      } else {
        cancelAnimationFrame(animationId);
      }
    };

    let resizeTimer = 0;
    window.addEventListener('resize', () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        reset();
        start();
      }, 120);
    });

    document.addEventListener('visibilitychange', handleVisibility);
    prefersReducedMotion.addEventListener('change', start);
    prefersDark.addEventListener('change', draw);

    reset();
    start();
  };

  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initNavigation();
    initProjectTools();
    initReveal();
    initCopyEmail();
    initCurrentYear();
    initSignalCanvas();
  });
})();
