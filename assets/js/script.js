/**
 * Maxwell Metzner Portfolio - Main JavaScript
 * Modern, performant JS with Intersection Observer animations,
 * smooth scrolling, and interactive features.
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // ===================================
  // DOM Elements
  // ===================================
  const navbar = document.getElementById('navbar');
  const navToggle = document.getElementById('nav-toggle');
  const navMenu = document.getElementById('nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');
  const themeToggle = document.getElementById('theme-toggle');
  const themeStatus = document.getElementById('theme-status');
  const scrollToTopBtn = document.getElementById('scroll-to-top');
  const toggleSchoolProjectsBtn = document.getElementById('toggle-school-projects');
  const schoolProjectsGrid = document.getElementById('school-projects-grid');
  const currentYearEl = document.getElementById('current-year');
  const revealElements = document.querySelectorAll('.reveal');

  // ===================================
  // Theme Management
  // ===================================
  const ThemeManager = {
    STORAGE_KEY: 'theme',
    DARK_CLASS: 'dark-mode',
    
    init() {
      // Check for saved preference or system preference
      const savedTheme = localStorage.getItem(this.STORAGE_KEY);
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.body.classList.add(this.DARK_CLASS);
        this.updateStatus(true);
      }
      
      // Listen for system theme changes
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem(this.STORAGE_KEY)) {
          this.setTheme(e.matches);
        }
      });
    },
    
    toggle() {
      const isDark = document.body.classList.toggle(this.DARK_CLASS);
      localStorage.setItem(this.STORAGE_KEY, isDark ? 'dark' : 'light');
      this.updateStatus(isDark);
      this.animateToggle();
    },
    
    setTheme(isDark) {
      document.body.classList.toggle(this.DARK_CLASS, isDark);
      this.updateStatus(isDark);
    },
    
    updateStatus(isDark) {
      if (themeStatus) {
        themeStatus.textContent = isDark ? 'Dark mode enabled' : 'Light mode enabled';
      }
    },
    
    animateToggle() {
      themeToggle.style.transform = 'scale(0.8)';
      setTimeout(() => {
        themeToggle.style.transform = '';
      }, 150);
    }
  };

  // ===================================
  // Navigation
  // ===================================
  const Navigation = {
    lastScrollY: 0,
    scrollThreshold: 50,
    
    init() {
      this.setupMobileMenu();
      this.setupSmoothScroll();
      this.setupScrollSpy();
      this.setupNavbarScroll();
    },
    
    setupMobileMenu() {
      if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => this.toggleMobileMenu());
        
        // Close menu when clicking a link
        navLinks.forEach(link => {
          link.addEventListener('click', () => this.closeMobileMenu());
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
          if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
            this.closeMobileMenu();
          }
        });
        
        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') {
            this.closeMobileMenu();
          }
        });
      }
    },
    
    toggleMobileMenu() {
      navToggle.classList.toggle('active');
      navMenu.classList.toggle('active');
      document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
    },
    
    closeMobileMenu() {
      navToggle.classList.remove('active');
      navMenu.classList.remove('active');
      document.body.style.overflow = '';
    },
    
    setupSmoothScroll() {
      navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          const href = link.getAttribute('href');
          if (href.startsWith('#')) {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
              target.scrollIntoView({ behavior: 'smooth' });
            }
          }
        });
      });
    },
    
    setupScrollSpy() {
      const sections = document.querySelectorAll('section[id]');
      
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            this.setActiveLink(id);
          }
        });
      }, {
        rootMargin: '-20% 0px -80% 0px',
        threshold: 0
      });
      
      sections.forEach(section => observer.observe(section));
    },
    
    setActiveLink(sectionId) {
      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${sectionId}`) {
          link.classList.add('active');
        }
      });
    },
    
    setupNavbarScroll() {
      let ticking = false;
      
      window.addEventListener('scroll', () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            this.handleNavbarScroll();
            ticking = false;
          });
          ticking = true;
        }
      });
    },
    
    handleNavbarScroll() {
      const currentScrollY = window.scrollY;
      
      // Add shadow when scrolled
      if (currentScrollY > this.scrollThreshold) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
      
      this.lastScrollY = currentScrollY;
    }
  };

  // ===================================
  // Scroll to Top
  // ===================================
  const ScrollToTop = {
    threshold: 400,
    
    init() {
      if (!scrollToTopBtn) return;
      
      // Throttled scroll listener
      let ticking = false;
      window.addEventListener('scroll', () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            this.toggleVisibility();
            ticking = false;
          });
          ticking = true;
        }
      });
      
      scrollToTopBtn.addEventListener('click', () => this.scrollToTop());
    },
    
    toggleVisibility() {
      if (window.scrollY > this.threshold) {
        scrollToTopBtn.classList.add('visible');
      } else {
        scrollToTopBtn.classList.remove('visible');
      }
    },
    
    scrollToTop() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ===================================
  // Reveal Animations
  // ===================================
  const RevealAnimations = {
    init() {
      if (!revealElements.length) return;
      
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
            // Optional: stop observing after reveal
            // observer.unobserve(entry.target);
          }
        });
      }, {
        root: null,
        rootMargin: '0px 0px -100px 0px',
        threshold: 0.1
      });
      
      revealElements.forEach(el => observer.observe(el));
    }
  };

  // ===================================
  // School Projects Toggle
  // ===================================
  const SchoolProjects = {
    init() {
      if (!toggleSchoolProjectsBtn || !schoolProjectsGrid) return;
      
      toggleSchoolProjectsBtn.addEventListener('click', () => this.toggle());
    },
    
    toggle() {
      const isActive = schoolProjectsGrid.classList.toggle('active');
      toggleSchoolProjectsBtn.classList.toggle('active');
      
      const btnText = toggleSchoolProjectsBtn.querySelector('span');
      if (btnText) {
        btnText.textContent = isActive ? 'Hide School Projects' : 'Show School Projects';
      }
      
      // Animate cards sequentially
      if (isActive) {
        const cards = schoolProjectsGrid.querySelectorAll('.project-card');
        cards.forEach((card, index) => {
          card.style.opacity = '0';
          card.style.transform = 'translateY(20px)';
          setTimeout(() => {
            card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, index * 50);
        });
      }
    }
  };

  // ===================================
  // Typed Effect for Hero (Optional Enhancement)
  // ===================================
  const TypedEffect = {
    element: null,
    strings: ['Software Developer', 'Problem Solver', 'Tech Enthusiast'],
    currentString: 0,
    currentChar: 0,
    isDeleting: false,
    typingSpeed: 100,
    deletingSpeed: 50,
    pauseTime: 2000,
    
    init() {
      this.element = document.querySelector('.hero-title');
      // Disabled by default - uncomment to enable
      // this.type();
    },
    
    type() {
      const current = this.strings[this.currentString];
      
      if (this.isDeleting) {
        this.element.textContent = current.substring(0, this.currentChar - 1);
        this.currentChar--;
      } else {
        this.element.textContent = current.substring(0, this.currentChar + 1);
        this.currentChar++;
      }
      
      let timeout = this.isDeleting ? this.deletingSpeed : this.typingSpeed;
      
      if (!this.isDeleting && this.currentChar === current.length) {
        timeout = this.pauseTime;
        this.isDeleting = true;
      } else if (this.isDeleting && this.currentChar === 0) {
        this.isDeleting = false;
        this.currentString = (this.currentString + 1) % this.strings.length;
        timeout = 500;
      }
      
      setTimeout(() => this.type(), timeout);
    }
  };

  // ===================================
  // Parallax Effect for Background (Subtle)
  // ===================================
  const ParallaxEffect = {
    init() {
      const bgGradient = document.querySelector('.bg-gradient');
      if (!bgGradient || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      
      let ticking = false;
      
      window.addEventListener('scroll', () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            const scrollY = window.scrollY;
            bgGradient.style.transform = `translateY(${scrollY * 0.3}px)`;
            ticking = false;
          });
          ticking = true;
        }
      });
    }
  };

  // ===================================
  // Copy Email to Clipboard
  // ===================================
  const CopyEmail = {
    init() {
      const copyBtn = document.getElementById('copy-email');
      const emailAddress = document.getElementById('email-address');
      
      if (!copyBtn || !emailAddress) return;
      
      copyBtn.addEventListener('click', () => this.copy(copyBtn, emailAddress));
    },
    
    async copy(btn, emailEl) {
      const email = emailEl.textContent;
      
      try {
        await navigator.clipboard.writeText(email);
        this.showSuccess(btn);
      } catch (err) {
        // Fallback for older browsers
        this.fallbackCopy(email, btn);
      }
    },
    
    fallbackCopy(text, btn) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      
      try {
        document.execCommand('copy');
        this.showSuccess(btn);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
      
      document.body.removeChild(textArea);
    },
    
    showSuccess(btn) {
      const textEl = btn.querySelector('.copy-text');
      const originalText = textEl.textContent;
      
      btn.classList.add('copied');
      textEl.textContent = 'Copied!';
      
      setTimeout(() => {
        btn.classList.remove('copied');
        textEl.textContent = originalText;
      }, 2000);
    }
  };

  // ===================================
  // Current Year
  // ===================================
  const setCurrentYear = () => {
    if (currentYearEl) {
      currentYearEl.textContent = new Date().getFullYear();
    }
  };

  // ===================================
  // Easter Egg - Console Message
  // ===================================
  const consoleEasterEgg = () => {
    console.log(
      '%c👋 Hey there, curious developer!',
      'font-size: 20px; font-weight: bold; color: #6366f1;'
    );
    console.log(
      '%cInterested in my work? Check out my GitHub: https://github.com/MaxwellMetzner',
      'font-size: 14px; color: #64748b;'
    );
  };

  // ===================================
  // Initialize Everything
  // ===================================
  const init = () => {
    ThemeManager.init();
    Navigation.init();
    ScrollToTop.init();
    RevealAnimations.init();
    SchoolProjects.init();
    CopyEmail.init();
    TypedEffect.init();
    ParallaxEffect.init();
    setCurrentYear();
    consoleEasterEgg();
    
    // Event listeners
    if (themeToggle) {
      themeToggle.addEventListener('click', () => ThemeManager.toggle());
    }
  };

  init();
});

// ===================================
// Service Worker Registration (Optional - for PWA)
// ===================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Uncomment to enable service worker
    // navigator.serviceWorker.register('/sw.js')
    //   .then(reg => console.log('SW registered'))
    //   .catch(err => console.log('SW registration failed'));
  });
}
