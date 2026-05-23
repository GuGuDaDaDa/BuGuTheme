/**
 * BuGuBlog — TOC scroll tracking + active heading highlighting.
 * The TOC uses CSS `position: sticky` for vertical positioning;
 * JS only handles Intersection Observer highlighting and smooth-scroll clicks.
 *
 * @module toc
 */

/**
 * Initialise TOC heading tracking and click handling.
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

  /**
   * Find the link corresponding to a heading ID and mark it active.
   * @param {string} id
   */
  function activateLink(id) {
    links.forEach(a => a.classList.remove('active'));
    const target = toc.querySelector(`a[href="#${CSS.escape(id)}"]`);
    if (target) target.classList.add('active');
  }

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
