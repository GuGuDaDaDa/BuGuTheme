/**
 * BuGuBlog — PJAX navigation engine.
 *
 * Intercepts same-origin link clicks, fetches the target page,
 * swaps only the <main> content, and updates the browser URL
 * via History API. Falls back to hard navigation on error.
 *
 * @module pjax
 */

import { start, done } from './progress.js';

/**
 * Start intercepting clicks for PJAX navigation.
 * Exported for main.js.
 */
export function initPjax() {
  if (!window.history.pushState) return;

  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
  }

  // Expose for programmatic navigation (card clicks, carousel, etc.)
  window.pjaxNavigate = (url) => navigate(url, true);

  document.addEventListener('click', handleClick);
  window.addEventListener('popstate', handlePopState);
}

/**
 * @param {MouseEvent} e
 */
function handleClick(e) {
  if (e.defaultPrevented) return;

  const link = /** @type {HTMLElement|null} */ (e.target.closest('a'));
  if (!link) return;

  const href = link.getAttribute('href');
  if (!href || href === '#') return;

  // Resolve relative URLs against the current page so "#id" stays in-page.
  const url = new URL(href, location.href);

  // Only same-origin
  if (url.origin !== location.origin) return;

  // Skip: downloads, new tab/window, hash-only navigation
  if (link.download || link.target === '_blank') return;
  if (link.dataset.pjax === 'false') return;
  if (url.pathname === location.pathname && url.hash && url.search === location.search) return;

  // Don't intercept modified clicks (ctrl/cmd/shift for new tab)
  if (e.ctrlKey || e.metaKey || e.shiftKey) return;

  e.preventDefault();
  navigate(url.href, true);
}

/**
 * Fetch a page and swap <main> content.
 * @param {string} url
 * @param {boolean} push - whether to pushState (false for popstate)
 */
async function navigate(url, push) {
  if (navigate._pending) return;
  navigate._pending = true;
  start();

  try {
    // Save current scroll position to the current history entry before leaving
    if (push) {
      history.replaceState({ scrollY: window.scrollY }, '', location.href);
    }

    const resp = await fetch(url);
    if (!resp.ok) throw new Error('HTTP ' + resp.status);

    const html = await resp.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');

    const newMain = doc.querySelector('main');
    const newTitle = doc.title;

    if (!newMain) throw new Error('No <main> in response');

    // Swap content
    document.title = newTitle;
    const currentMain = document.querySelector('main');
    currentMain.innerHTML = newMain.innerHTML;

    // Update URL
    if (push) {
      history.pushState({}, '', url);
    }

    // Re-init page-specific components
    if (typeof window.reinit === 'function') {
      window.reinit();
    }

    syncNavActive();

    // Reset header visibility
    const header = document.querySelector('.site-header');
    if (header) header.classList.remove('headroom-hidden');

    // Restore scroll position for back/forward, otherwise scroll to top.
    if (push) {
      restoreScrollPosition(0);
    } else {
      const state = history.state;
      restoreScrollPosition(state && typeof state.scrollY === 'number' ? state.scrollY : 0);
    }

    done();
    navigate._pending = false;

  } catch (_err) {
    navigate._pending = false;
    // Fallback to hard navigation
    window.location.href = url;
  }
}

/**
 * Handle browser back/forward buttons.
 */
function handlePopState() {
  navigate(location.href, false);
}

/**
 * Set the page scroll position after PJAX swaps content.
 * Re-apply on the next frame so browser scroll anchoring cannot leave
 * article prev/next navigation at the original click position.
 * @param {number} top - Vertical scroll offset to restore.
 */
function restoreScrollPosition(top) {
  window.scrollTo(0, top);
  requestAnimationFrame(() => window.scrollTo(0, top));
}

/**
 * Update desktop .site-nav and mobile .menu-nav active states to reflect current URL.
 */
function syncNavActive() {
  const currentPath = location.pathname.replace(/\/$/, '') || '/';
  document.querySelectorAll('.site-nav a, .menu-nav a').forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    const linkPath = new URL(href, location.origin).pathname.replace(/\/$/, '') || '/';
    if (linkPath === currentPath) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}
