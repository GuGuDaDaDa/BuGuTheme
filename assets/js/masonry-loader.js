/**
 * BuGuBlog — Masonry Infinite Scroll Loader
 *
 * Fetches /posts.json, renders cards client-side,
 * and loads more via Intersection Observer.
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
  article.addEventListener('click', () => { window.location.href = d.permalink; });

  if (d.cover) {
    const img = document.createElement('img');
    img.className = 'card-cover';
    img.src = d.cover;
    img.alt = d.title;
    img.loading = 'lazy';
    article.appendChild(img);
  } else {
    const fb = document.createElement('div');
    fb.className = 'card-cover card-cover-fallback';
    article.appendChild(fb);
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
  /** @type {HTMLButtonElement|null} */
  const loadBtn = document.getElementById('btn-load-more');

  // Extract carousel slugs to exclude
  const excludeRaw = grid.getAttribute('data-exclude') || '';
  const excludeSlugs = excludeRaw ? excludeRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

  /** @type {object[]|null} */
  let cachedPosts = null;

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
    // Filter out carousel slugs
    cachedPosts = data.filter(p => !excludeSlugs.includes(p.slug));
    return cachedPosts;
  }

  /**
   * Load the next batch and append to the grid.
   * @param {number} count — how many to load
   */
  async function loadMore(count = 6) {
    if (loadedCount >= totalCount) return;

    let posts;
    try {
      posts = await fetchPosts();
    } catch (_) {
      return; // silent fail
    }

    const next = posts.slice(loadedCount, loadedCount + count);
    if (next.length === 0) return;

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

    // Animate new cards
    requestAnimationFrame(() => {
      const newCards = grid.querySelectorAll('.card-appear:not(.visible)');
      newCards.forEach(c => c.classList.add('visible'));
    });

    // Clean up when all loaded
    if (loadedCount >= totalCount) {
      if (sentinel) sentinel.remove();
      if (loadBtn) {
        loadBtn.textContent = '已经看完啦';
        loadBtn.disabled = true;
        loadBtn.style.opacity = '0.35';
        loadBtn.style.pointerEvents = 'none';
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

  /* ---------- Fallback: load more button ---------- */
  if (loadBtn) {
    loadBtn.addEventListener('click', () => loadMore(6));
  }
}
