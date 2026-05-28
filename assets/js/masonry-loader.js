/**
 * BuGuBlog — Masonry Infinite Scroll Loader
 *
 * Fetches /posts.json, renders cards client-side,
 * and auto-loads via Intersection Observer on scroll.
 *
 * @module masonry-loader
 */

/**
 * Render a single card DOM node from article data.
 * Mirrors the structure in layouts/_partials/card.html.
 * @param {object} d — article data
 * @returns {HTMLElement}
 */
function renderCard(d) {
  const article = document.createElement('article');
  article.className = 'card card-appear';
  article.setAttribute('data-article-slug', d.slug);
  article.addEventListener('click', (e) => {
    if (e.target.closest('a')) return;
    if (window.pjaxNavigate) { window.pjaxNavigate(d.permalink); } else { window.location.href = d.permalink; }
  });

  if (d.cover) {
    const img = document.createElement('img');
    img.className = 'card-cover';
    img.src = d.cover;
    img.alt = d.title;
    img.loading = 'lazy';
    img.addEventListener('error', () => img.remove());
    article.appendChild(img);
  }

  const body = document.createElement('div');
  body.className = 'card-body';

  (d.categories || []).forEach(cat => {
    const span = document.createElement('span');
    span.className = 'card-category';
    span.textContent = cat;
    body.appendChild(span);
  });

  const h2 = document.createElement('h2');
  h2.className = 'card-title';
  const a = document.createElement('a');
  a.href = d.permalink;
  a.textContent = d.title;
  h2.appendChild(a);
  body.appendChild(h2);

  if (d.subtitle) {
    const sub = document.createElement('p');
    sub.className = 'card-subtitle';
    sub.textContent = d.subtitle;
    body.appendChild(sub);
  }

  const meta = document.createElement('div');
  meta.className = 'card-meta';
  const dateSpan = document.createElement('span');
  dateSpan.textContent = d.date;
  const dot = document.createElement('span');
  dot.className = 'dot';
  const readSpan = document.createElement('span');
  readSpan.textContent = (d.readingTime || 1) + ' 分钟';
  meta.appendChild(dateSpan);
  meta.appendChild(dot);
  meta.appendChild(readSpan);
  body.appendChild(meta);

  article.appendChild(body);
  return article;
}

/**
 * Initialise infinite-scroll masonry on the current page.
 * No-op if the masonry grid is not present.
 */
export function initMasonry() {
  /** @type {HTMLElement|null} */
  const grid = document.getElementById('masonry-grid');
  if (!grid) return;

  const totalCount = parseInt(grid.getAttribute('data-total-count') || '0', 10);
  let loadedCount = parseInt(grid.getAttribute('data-loaded-count') || '0', 10);

  /** @type {HTMLElement|null} */
  const sentinel = document.getElementById('masonry-sentinel');
  /** @type {HTMLElement|null} */
  const loadingEl = document.getElementById('masonry-loading');

  // Homepage: exclude carousel slugs. Term pages: filter by taxonomy.
  const excludeRaw = grid.getAttribute('data-exclude') || '';
  const excludeSlugs = excludeRaw ? excludeRaw.split(',').map(s => s.trim()).filter(Boolean) : [];
  const taxonomy = grid.getAttribute('data-taxonomy') || '';
  const term = grid.getAttribute('data-term') || '';

  /** @type {object[]|null} */
  let cachedPosts = null;
  let isLoading = false;

  /**
   * Fetch and cache the JSON article feed.
   * @returns {Promise<object[]>}
   */
  async function fetchPosts() {
    if (cachedPosts) return cachedPosts;
    const resp = await fetch('/posts.json');
    if (!resp.ok) throw new Error('Failed to fetch /posts.json');
    /** @type {object[]} */
    const data = await resp.json();
    if (taxonomy && term) {
      // Term page: filter by category or tag
      const key = taxonomy === 'tags' ? 'tags' : 'categories';
      cachedPosts = data.filter(p => (p[key] || []).includes(term));
    } else {
      // Homepage: filter out carousel slugs
      cachedPosts = data.filter(p => !excludeSlugs.includes(p.slug));
    }
    return cachedPosts;
  }

  /**
   * Load the next batch and append to the grid.
   * @param {number} count — how many to load
   */
  async function loadMore(count = 6) {
    if (loadedCount >= totalCount || isLoading) return;

    isLoading = true;
    if (loadingEl) loadingEl.classList.add('visible');

    let posts;
    try {
      posts = await fetchPosts();
    } catch (_) {
      if (loadingEl) loadingEl.classList.remove('visible');
      isLoading = false;
      return;
    }

    const next = posts.slice(loadedCount, loadedCount + count);
    if (next.length === 0) {
      if (loadingEl) loadingEl.classList.remove('visible');
      isLoading = false;
      return;
    }

    const fragment = document.createDocumentFragment();
    next.forEach(d => fragment.appendChild(renderCard(d)));

    // Insert before sentinel if present, otherwise append
    if (sentinel && sentinel.parentNode === grid) {
      grid.insertBefore(fragment, sentinel);
    } else {
      grid.appendChild(fragment);
    }

    loadedCount += next.length;
    grid.setAttribute('data-loaded-count', String(loadedCount));

    // Staggered entrance animation — double rAF ensures browser
    // paints the initial hidden state before transitions begin.
    const newCards = grid.querySelectorAll('.card-appear:not(.visible)');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        newCards.forEach((c, i) => {
          setTimeout(() => c.classList.add('visible'), i * 60);
        });
      });
    });

    if (loadingEl) loadingEl.classList.remove('visible');
    isLoading = false;

    // Clean up when all loaded
    if (loadedCount >= totalCount) {
      if (sentinel) sentinel.remove();
      if (loadingEl) {
        const textEl = loadingEl.querySelector('.masonry-loading-text');
        if (textEl) textEl.textContent = '已经看完啦';
        loadingEl.classList.remove('visible');
        loadingEl.classList.add('done');
      }
    }
  }

  /* ---------- Intersection Observer ---------- */
  if (sentinel) {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadMore(6);
      }
    }, { rootMargin: '200px' });
    observer.observe(sentinel);
  }
}
