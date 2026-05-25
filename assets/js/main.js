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
import { initFootnotes } from './footnotes.js';

// Detect iOS/Android devices and tag <html> for mobile layout
if (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) || /Android/.test(navigator.userAgent)) {
  document.documentElement.classList.add('ios');
}

start();

document.addEventListener('DOMContentLoaded', () => {
  initCarousel();
  initMasonry();
  initToc();
  initSearch();
  initLightbox();
  initFootnotes();
  document.querySelectorAll('.photo-stack').forEach(el => initPhotoStack(el));

  /* ---------- Theme (follow system preference) ---------- */
  /** @type {HTMLElement} */
  const html = document.documentElement;

  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

  /**
   * Apply system color scheme.
   */
  function applySystemTheme() {
    html.setAttribute('data-theme', systemDark.matches ? 'dark' : 'light');
  }

  applySystemTheme();
  systemDark.addEventListener('change', applySystemTheme);

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
