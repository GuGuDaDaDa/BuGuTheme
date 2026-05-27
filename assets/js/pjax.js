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

  // Expose for programmatic navigation (card clicks, carousel, etc.)
  window.pjaxNavigate = navigate;

  document.addEventListener('click', handleClick);
  window.addEventListener('popstate', handlePopState);
}

/**
 * @param {MouseEvent} e
 */
function handleClick(e) {
  const link = /** @type {HTMLElement|null} */ (e.target.closest('a'));
  if (!link) return;

  const href = link.getAttribute('href');
  if (!href || href === '#') return;

  // Resolve relative URLs
  const url = new URL(href, location.origin);

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
  start();

  try {
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

    window.scrollTo(0, 0);
    done();

  } catch (_err) {
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
 * Update .site-nav active dot indicator to reflect current URL.
 */
function syncNavActive() {
  const currentPath = location.pathname.replace(/\/$/, '') || '/';
  document.querySelectorAll('.site-nav a').forEach(link => {
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
