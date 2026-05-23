/**
 * BuGuBlog — TOC scroll tracking + sticky positioning.
 * Highlights the active TOC link and keeps the TOC visible while
 * scrolling through the article content area.
 *
 * @module toc
 */

/**
 * Initialise TOC scroll tracking, smooth-scroll clicks, and sticky positioning.
 * No-op if the TOC element is not present on the page.
 */
export function initToc() {
  const toc = document.getElementById('toc');
  if (!toc) return;

  const links = toc.querySelectorAll('a');
  if (links.length === 0) return;

  /** @type {Map<string, HTMLElement>} */
  const headingMap = new Map();
  links.forEach(a => {
    const href = a.getAttribute('href');
    if (!href) return;
    const id = href.replace('#', '');
    const heading = document.getElementById(id);
    if (heading) headingMap.set(id, heading);
  });

  if (headingMap.size === 0) return;

  const articlePage = document.querySelector('.article-page');
  const content = document.querySelector('.article-content');
  if (!articlePage || !content) return;

  /**
   * Find the link corresponding to a heading ID and mark it active.
   * @param {string} id
   */
  function activateLink(id) {
    links.forEach(a => a.classList.remove('active'));
    const target = toc.querySelector(`a[href="#${CSS.escape(id)}"]`);
    if (target) target.classList.add('active');
  }

  /* ---------- Sticky positioning ---------- */

  /** @type {number} */
  let ticking = false;

  /**
   * Update TOC position so it follows the article content area.
   * Switches to `position: fixed` with calculated top/left so it remains
   * visible during scrolling and stops at the content bottom.
   */
  function positionToc() {
    if (toc.offsetHeight === 0) return; // hidden via CSS media query

    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const gap = 4 * rootFontSize;
    const minTop = 2 * rootFontSize;

    const articleRect = articlePage.getBoundingClientRect();
    const contentRect = content.getBoundingClientRect();
    const tocHeight = toc.offsetHeight;
    const viewportH = window.innerHeight;

    // Horizontal: right edge of article + gap, but not off-screen
    const left = Math.min(articleRect.right + gap, window.innerWidth - toc.offsetWidth - rootFontSize);

    // Vertical: track content area, clamped between minTop and content bottom
    let top;
    if (contentRect.top > minTop) {
      top = contentRect.top;
    } else if (contentRect.bottom - tocHeight > minTop) {
      top = minTop;
    } else {
      top = contentRect.bottom - tocHeight;
    }

    top = Math.max(minTop, Math.min(top, viewportH - tocHeight));

    toc.style.position = 'fixed';
    toc.style.left = left + 'px';
    toc.style.top = top + 'px';
    toc.style.right = 'auto';
  }

  /**
   * Throttled scroll/resize handler.
   */
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        positionToc();
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  positionToc();

  /* ---------- Intersection Observer ---------- */
  const observer = new IntersectionObserver(
    (entries) => {
      /** @type {IntersectionObserverEntry|null} */
      let topEntry = null;
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (!topEntry || entry.boundingClientRect.top < topEntry.boundingClientRect.top) {
            topEntry = entry;
          }
        }
      });
      if (topEntry) {
        activateLink(topEntry.target.id);
      }
    },
    { rootMargin: '-60px 0px -70% 0px', threshold: 0 }
  );

  headingMap.forEach(heading => observer.observe(heading));

  /* ---------- Smooth scroll on click ---------- */
  toc.addEventListener('click', (e) => {
    const a = /** @type {HTMLElement} */ (e.target).closest('a');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || !href.startsWith('#')) return;
    e.preventDefault();
    const id = href.slice(1);
    const heading = document.getElementById(id);
    if (heading) {
      heading.scrollIntoView({ behavior: 'smooth' });
      activateLink(id);
    }
  });
}
