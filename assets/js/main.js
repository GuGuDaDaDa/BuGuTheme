/**
 * BuGuBlog — Main JavaScript
 * Theme toggle + hamburger menu + cross-tab sync + carousel.
 */

import { initCarousel } from './carousel.js';
import { initMasonry } from './masonry-loader.js';
import { initToc } from './toc.js';
import { initSearch } from './search.js';
import { initLightbox } from './lightbox.js';
import { initPhotoStack } from './photo-stack.js';
import { start, done } from './progress.js';

start();

document.addEventListener('DOMContentLoaded', () => {
  initCarousel();
  initMasonry();
  initToc();
  initSearch();
  initLightbox();
  document.querySelectorAll('.photo-stack').forEach(el => initPhotoStack(el));

  /* ---------- Theme toggle ---------- */
  /** @type {HTMLButtonElement|null} */
  const themeToggle = document.getElementById('theme-toggle');
  /** @type {HTMLElement} */
  const html = document.documentElement;

  /**
   * Apply a theme to the document and persist.
   * @param {'light'|'dark'} theme
   */
  function setTheme(theme) {
    html.setAttribute('data-theme', theme);
    try { localStorage.setItem('bugublog-theme', theme); } catch (_) {}
    if (themeToggle) {
      const icon = themeToggle.querySelector('.theme-icon');
      if (icon) icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  }

  if (themeToggle) {
    const current = html.getAttribute('data-theme') || 'light';
    const icon = themeToggle.querySelector('.theme-icon');
    if (icon) icon.textContent = current === 'dark' ? '☀️' : '🌙';

    themeToggle.addEventListener('click', () => {
      const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      setTheme(next);
    });
  }

  // Cross-tab sync
  window.addEventListener('storage', (e) => {
    if (e.key === 'bugublog-theme' && (e.newValue === 'dark' || e.newValue === 'light')) {
      setTheme(e.newValue);
    }
  });

  /* ---------- Hamburger menu ---------- */
  /** @type {HTMLButtonElement|null} */
  const hamburger = document.getElementById('hamburger');
  /** @type {HTMLElement|null} */
  const siteNav = document.getElementById('site-nav');

  if (hamburger && siteNav) {
    hamburger.addEventListener('click', () => {
      const expanded = hamburger.getAttribute('aria-expanded') === 'true';
      hamburger.setAttribute('aria-expanded', String(!expanded));
      hamburger.classList.toggle('active');
      siteNav.classList.toggle('open');
    });

    // Close menu when clicking a nav link
    siteNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.classList.remove('active');
        siteNav.classList.remove('open');
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!hamburger.contains(/** @type {Node} */ (e.target)) && !siteNav.contains(/** @type {Node} */ (e.target))) {
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.classList.remove('active');
        siteNav.classList.remove('open');
      }
    });
  }

  /* ---------- Card click delegation ---------- */
  document.addEventListener('click', (e) => {
    const card = /** @type {HTMLElement|null} */ (e.target.closest('.card'));
    if (!card) return;
    // Don't intercept clicks on links inside the card
    if (e.target.closest('a')) return;
    const link = card.getAttribute('data-article-link');
    if (link) window.location.href = link;
  });
});

window.addEventListener('load', done);
