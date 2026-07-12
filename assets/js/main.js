/**
 * BuGuBlog — Main JavaScript
 * Theme toggle + hamburger menu + cross-tab sync + carousel + PJAX.
 */

import { initCarousel } from './carousel.js';
import { initMasonry } from './masonry-loader.js';
import { initToc } from './toc.js';
import { initSearch } from './search.js';
import { initLightbox, initLazyLoader } from './lightbox.js';
import { initPhotoStack } from './photo-stack.js';
import { start, done } from './progress.js';
import { initFootnotes, setupFootnoteEvents, bindFootnoteRefs } from './footnotes.js';
import { initPjax } from './pjax.js';
import { initGiscus } from './giscus.js';
import { getScrollEventTarget, getScrollTop } from './scroll-container.js';

const isIpadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;

// Detect touch devices and tag <html> for mobile/tablet layout overrides.
if (/iPhone|iPod|iPad/.test(navigator.userAgent) || isIpadOS || /Android/.test(navigator.userAgent)) {
  document.documentElement.classList.add('ios');
}

start();

/**
 * Re-initialise page-specific components after a PJAX content swap.
 * Each init function no-ops if its target element is absent.
 */
function reinit() {
  initCarousel();
  initMasonry();
  initToc();
  initLazyLoader();
  document.querySelectorAll('.photo-stack').forEach(el => initPhotoStack(el));
  bindFootnoteRefs();
  initGiscus();
}

// Expose for pjax.js to call after content swap
window.reinit = reinit;

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Once-only inits (persistent DOM, no re-init needed) ---------- */

  // Theme (follow system preference)
  const html = document.documentElement;
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
  function applySystemTheme() {
    html.setAttribute('data-theme', systemDark.matches ? 'dark' : 'light');
  }
  applySystemTheme();
  systemDark.addEventListener('change', applySystemTheme);

  // Hamburger menu — overlay + slide-in panel
  const hamburger = document.getElementById('hamburger');
  const menuOverlay = document.getElementById('menuOverlay');
  const menuPanel = document.getElementById('menuPanel');
  const menuClose = document.getElementById('menuClose');

  function openMenu() {
    hamburger.classList.add('active');
    hamburger.setAttribute('aria-expanded', 'true');
    menuOverlay.classList.add('open');
    menuPanel.classList.add('open');
    document.documentElement.classList.add('nav-open');
    document.body.classList.add('nav-open');
  }

  function closeMenu() {
    hamburger.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
    menuOverlay.classList.remove('open');
    menuPanel.classList.remove('open');
    document.documentElement.classList.remove('nav-open');
    document.body.classList.remove('nav-open');
  }

  if (hamburger && menuOverlay && menuPanel) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.contains('active') ? closeMenu() : openMenu();
    });
    menuOverlay.addEventListener('click', closeMenu);
    if (menuClose) {
      menuClose.addEventListener('click', closeMenu);
    }
    menuPanel.querySelectorAll('.menu-nav a').forEach(link => {
      link.addEventListener('click', closeMenu);
    });
  }

  // Search (singleton, persistent modal)
  initSearch();

  // Lightbox (persistent overlay, binds document events once)
  initLightbox();

  // Footnotes document-level events (scroll, escape, resize — once)
  setupFootnoteEvents();

  // PJAX navigation
  initPjax();

  /* ---------- Scroll-aware header ---------- */
  (function () {
    const header = document.querySelector('.site-header');
    if (!header) return;

    const scrollTarget = getScrollEventTarget();
    let lastY = getScrollTop();
    let upDelta = 0;
    let hidden = false;

    scrollTarget.addEventListener('scroll', () => {
      const y = getScrollTop();
      const diff = y - lastY;

      if (diff > 0) {
        // Scrolling down — hide after 150px from top
        upDelta = 0;
        if (!hidden && y > 150) {
          header.classList.add('headroom-hidden');
          hidden = true;
        }
      } else if (diff < 0) {
        // Scrolling up — show after 50px accumulated upward scroll
        upDelta += Math.abs(diff);
        if (hidden && upDelta >= 50) {
          header.classList.remove('headroom-hidden');
          hidden = false;
          upDelta = 0;
        }
      }

      lastY = y;
    }, { passive: true });
  })();

  /* ---------- Per-page inits (first load) ---------- */
  reinit();

  /* ---------- Fold header keyboard (document delegation) ---------- */
  document.addEventListener('keydown', (e) => {
    // Close mobile menu on Escape
    if (e.key === 'Escape' && hamburger && hamburger.classList.contains('active')) {
      closeMenu();
      hamburger.focus();
      return;
    }
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const header = /** @type {HTMLElement|null} */ (e.target.closest('.fold-header'));
    if (!header) return;
    e.preventDefault();
    header.click();
  });

  /* ---------- Spoiler click toggle (touch devices only) ---------- */
  if (window.matchMedia('(hover: none)').matches) {
    document.addEventListener('click', (e) => {
      const spoiler = /** @type {HTMLElement|null} */ (e.target.closest('.spoiler'));
      if (!spoiler) return;
      spoiler.classList.toggle('revealed');
      spoiler.setAttribute('aria-expanded', spoiler.classList.contains('revealed') ? 'true' : 'false');
    });
  }

  /* ---------- Card click delegation ---------- */
  document.addEventListener('click', (e) => {
    const card = /** @type {HTMLElement|null} */ (e.target.closest('.card'));
    if (!card) return;
    if (e.target.closest('a')) return;
    const link = card.getAttribute('data-article-link');
    if (link) {
      if (window.pjaxNavigate) {
        window.pjaxNavigate(link);
      } else {
        window.location.href = link;
      }
    }
  });
});

// Complete initial progress bar on full page load.
// PJAX navigations call done() directly from pjax.js.
window.addEventListener('load', done);
