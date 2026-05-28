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

// Detect iOS/Android devices and tag <html> for mobile layout
if (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) || /Android/.test(navigator.userAgent)) {
  document.documentElement.classList.add('ios');
}

start();

let _giscusIntObserver = null;
let _giscusThemeObserver = null;

/**
 * Giscus comment system — lazy-load via IntersectionObserver.
 * Reads config from data attributes on .giscus container.
 * Safe to call multiple times (e.g. after PJAX content swaps) —
 * old observers are disconnected before new ones are created.
 */
function initGiscus() {
  const container = document.querySelector('.giscus');
  if (!container || container.dataset.giscusReady) return;

  // Disconnect observers from a previous Giscus instance before re-initializing
  if (_giscusIntObserver) {
    _giscusIntObserver.disconnect();
    _giscusIntObserver = null;
  }
  if (_giscusThemeObserver) {
    _giscusThemeObserver.disconnect();
    _giscusThemeObserver = null;
  }

  function giscusTheme() {
    const t = document.documentElement.getAttribute('data-theme');
    return t === 'dark' ? 'dark' : 'light';
  }

  let loaded = false;
  _giscusIntObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting && !loaded) {
        loaded = true;
        _giscusIntObserver.disconnect();
        const script = document.createElement('script');
        script.src = 'https://giscus.app/client.js';
        script.setAttribute('data-repo', container.dataset.repo);
        script.setAttribute('data-repo-id', container.dataset.repoId);
        script.setAttribute('data-category', container.dataset.category);
        script.setAttribute('data-category-id', container.dataset.categoryId);
        script.setAttribute('data-mapping', container.dataset.mapping);
        script.setAttribute('data-strict', '0');
        script.setAttribute('data-reactions-enabled', container.dataset.reactionsEnabled);
        script.setAttribute('data-emit-metadata', '0');
        script.setAttribute('data-input-position', container.dataset.inputPosition);
        script.setAttribute('data-loading', 'lazy');
        script.setAttribute('data-theme', giscusTheme());
        script.setAttribute('data-lang', container.dataset.lang);
        script.setAttribute('crossorigin', 'anonymous');
        script.async = true;
        container.appendChild(script);
      }
    });
  }, { rootMargin: '200px' });
  _giscusIntObserver.observe(container);

  // Theme sync via MutationObserver — queries the live DOM so it
  // always targets the current .giscus iframe, not a stale one.
  _giscusThemeObserver = new MutationObserver(function () {
    const iframe = document.querySelector('.giscus iframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({
        giscus: { setConfig: { theme: giscusTheme() } }
      }, 'https://giscus.app');
    }
  });
  _giscusThemeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  container.dataset.giscusReady = 'true';
}

/**
 * Re-initialise page-specific components after a PJAX content swap.
 * Each init function no-ops if its target element is absent.
 * Giscus is handled separately via updateGiscus() — it lives outside <main>.
 */
function reinit() {
  initCarousel();
  initMasonry();
  initToc();
  initLazyLoader();
  document.querySelectorAll('.photo-stack').forEach(el => initPhotoStack(el));
  bindFootnoteRefs();
}

/**
 * Show/hide the Giscus container and update the discussion term.
 * Call after PJAX navigations (the .giscus div lives outside <main> in baseof.html).
 * @param {boolean} hasComments - whether the current page should show comments.
 */
function updateGiscus(hasComments) {
  const container = document.querySelector('.giscus');
  if (!container) return;

  if (hasComments) {
    container.hidden = false;
    const iframe = container.querySelector('iframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({
        giscus: { setConfig: { term: location.pathname } }
      }, 'https://giscus.app');
    } else {
      initGiscus();
    }
  } else {
    container.hidden = true;
  }
}

// Expose for pjax.js to call after content swap
window.reinit = reinit;
window.updateGiscus = updateGiscus;

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

  // Hamburger menu
  const hamburger = document.getElementById('hamburger');
  const siteNav = document.getElementById('site-nav');
  if (hamburger && siteNav) {
    hamburger.addEventListener('click', () => {
      const expanded = hamburger.getAttribute('aria-expanded') === 'true';
      hamburger.setAttribute('aria-expanded', String(!expanded));
      hamburger.classList.toggle('active');
      siteNav.classList.toggle('open');
    });
    siteNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.classList.remove('active');
        siteNav.classList.remove('open');
      });
    });
    document.addEventListener('click', (e) => {
      if (!hamburger.contains(/** @type {Node} */ (e.target)) && !siteNav.contains(/** @type {Node} */ (e.target))) {
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.classList.remove('active');
        siteNav.classList.remove('open');
      }
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

    let lastY = window.scrollY;
    let upDelta = 0;
    let hidden = false;

    window.addEventListener('scroll', () => {
      const y = window.scrollY;
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
  updateGiscus(document.body.dataset.pageKind === 'page');

  /* ---------- Fold header keyboard (document delegation) ---------- */
  document.addEventListener('keydown', (e) => {
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
