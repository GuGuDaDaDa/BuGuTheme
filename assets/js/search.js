/**
 * BuGuBlog — Client-side search powered by Fuse.js.
 *
 * Opens a modal on search-trigger click, fetches /posts.json,
 * indexes with Fuse, and renders highlighted results.
 *
 * @module search
 */

import Fuse from './vendor/fuse.js';

/**
 * Manages the search modal, Fuse index, input handling, and result display.
 */
class SearchController {
  /** @type {HTMLElement} */
  modal;
  /** @type {HTMLInputElement} */
  input;
  /** @type {HTMLElement} */
  results;
  /** @type {HTMLElement} */
  hint;
  /** @type {HTMLElement} */
  loading;
  /** @type {HTMLElement} */
  backdrop;
  /** @type {HTMLButtonElement} */
  closeBtn;

  /** @type {Fuse|null} */
  fuse = null;
  /** @type {object[]} */
  posts = [];
  /** @type {boolean} */
  loadingIndex = false;
  /** @type {number|null} */
  debounceTimer = null;

  constructor() {
    this.modal = document.getElementById('search-modal');
    this.input = /** @type {HTMLInputElement} */ (document.getElementById('search-input'));
    this.results = document.getElementById('search-results');
    this.hint = document.getElementById('search-hint');
    this.loading = document.getElementById('search-loading');
    this.backdrop = document.getElementById('search-backdrop');
    this.closeBtn = document.getElementById('search-close');

    if (!this.modal || !this.input || !this.results) return;

    this.bindEvents();
  }

  /* ---------- Event binding ---------- */

  bindEvents() {
    // Open via header search trigger
    const trigger = document.getElementById('search-trigger');
    if (trigger) {
      trigger.addEventListener('click', () => this.open());
    }

    // Close via backdrop, close button, Escape
    if (this.backdrop) {
      this.backdrop.addEventListener('click', () => this.close());
    }
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.classList.contains('active')) {
        this.close();
      }
    });

    // Search input with debounce
    this.input.addEventListener('input', () => {
      const query = this.input.value.trim();
      if (!query) {
        this.showHint('请输入搜索关键词');
        return;
      }
      this.debounceSearch(query);
    });
  }

  /* ---------- Open / Close ---------- */

  /** Open the modal, focus input, load index if needed. */
  open() {
    this.modal.classList.add('active');
    this.modal.setAttribute('aria-hidden', 'false');
    this.input.value = '';
    this.input.focus();
    this.showHint('输入关键词开始搜索');

    if (!this.fuse && !this.loadingIndex) {
      this.loadIndex();
    }
  }

  /** Close the modal and reset state. */
  close() {
    this.modal.classList.remove('active');
    this.modal.setAttribute('aria-hidden', 'true');
    this.input.value = '';
    this.results.style.display = 'none';
    this.results.innerHTML = '';
  }

  /* ---------- Index loading ---------- */

  /** Fetch /posts.json and initialise Fuse. */
  async loadIndex() {
    this.loadingIndex = true;
    this.loading.style.display = 'flex';
    this.hint.style.display = 'none';

    try {
      const resp = await fetch('/posts.json');
      if (!resp.ok) throw new Error('Failed to load index');
      this.posts = await resp.json();
      this.fuse = new Fuse(this.posts, {
        keys: [
          { name: 'title', weight: 0.4 },
          { name: 'description', weight: 0.2 },
          { name: 'content', weight: 0.3 },
          { name: 'categories', weight: 0.1 }
        ],
        includeMatches: true,
        threshold: 0.4,
        minMatchCharLength: 2
      });
    } catch (_) {
      this.hint.textContent = '搜索索引加载失败，请刷新后重试';
      this.hint.style.display = 'flex';
    } finally {
      this.loadingIndex = false;
      this.loading.style.display = 'none';
    }
  }

  /* ---------- Search ---------- */

  /**
   * Debounced search.
   * @param {string} query
   */
  debounceSearch(query) {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = window.setTimeout(() => {
      this.search(query);
    }, 200);
  }

  /**
   * Execute Fuse search and render results.
   * @param {string} query
   */
  search(query) {
    if (!this.fuse) {
      this.showHint('索引加载中，请稍候...');
      return;
    }

    const fuseResults = this.fuse.search(query).slice(0, 10);

    if (fuseResults.length === 0) {
      this.showHint('未找到相关内容');
      return;
    }

    this.hint.style.display = 'none';
    this.results.style.display = 'block';
    this.results.innerHTML = fuseResults.map(r => this.buildResultHTML(r)).join('');
  }

  /* ---------- Rendering ---------- */

  /**
   * Build a single result item DOM string with highlights.
   * @param {Fuse.FuseResult<object>} result
   * @returns {string}
   */
  buildResultHTML(result) {
    const { item, matches } = result;

    // Build highlighted title
    const titleHTML = this.highlightText(item.title, this.getMatchesFor('title', matches));

    // Build snippet from content or description
    const contentText = item.content || item.description || '';
    const snippet = this.extractSnippet(contentText, matches, 120);
    const snippetHTML = this.highlightText(snippet, this.getMatchesFor('content', matches));

    const date = item.date || '';

    return `
      <a href="${item.permalink}" class="search-result-item">
        <div class="search-result-title">${titleHTML}</div>
        <div class="search-result-snippet">${snippetHTML}</div>
        <time class="search-result-date">${date}</time>
      </a>`;
  }

  /**
   * Extract match indices for a given key from Fuse matches.
   * @param {string} key
   * @param {readonly Fuse.FuseResultMatch[]|undefined} matches
   * @returns {readonly Fuse.Range[]} array of {start, end} indices
   */
  getMatchesFor(key, matches) {
    if (!matches) return [];
    const m = matches.find(m => m.key === key);
    return m ? m.indices : [];
  }

  /**
   * Wrap match ranges in <mark> tags.
   * @param {string} text
   * @param {readonly Fuse.Range[]} indices
   * @returns {string}
   */
  highlightText(text, indices) {
    if (!indices || indices.length === 0) return this.escapeHTML(text);

    let result = '';
    let lastEnd = 0;
    // Merge overlapping ranges
    const sorted = [...indices].sort((a, b) => a[0] - b[0]);

    for (const [start, end] of sorted) {
      if (start < lastEnd) continue; // skip overlapping
      result += this.escapeHTML(text.slice(lastEnd, start));
      result += `<mark class="search-highlight">${this.escapeHTML(text.slice(start, end + 1))}</mark>`;
      lastEnd = end + 1;
    }
    result += this.escapeHTML(text.slice(lastEnd));
    return result;
  }

  /**
   * Extract a relevant snippet around the first match.
   * @param {string} text
   * @param {readonly Fuse.FuseResultMatch[]|undefined} matches
   * @param {number} maxLen
   * @returns {string}
   */
  extractSnippet(text, matches, maxLen) {
    if (!matches || matches.length === 0) return text.substring(0, maxLen) + (text.length > maxLen ? '...' : '');

    const firstMatch = matches[0];
    const indices = firstMatch.indices;
    if (!indices || indices.length === 0) return text.substring(0, maxLen) + '...';

    const matchStart = indices[0][0];
    const context = Math.floor((maxLen - 10) / 2);
    const start = Math.max(0, matchStart - context);
    const end = Math.min(text.length, start + maxLen);
    const prefix = start > 0 ? '...' : '';
    const suffix = end < text.length ? '...' : '';

    return prefix + text.slice(start, end) + suffix;
  }

  /**
   * Escape HTML special characters.
   * @param {string} str
   * @returns {string}
   */
  escapeHTML(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  /* ---------- State helpers ---------- */

  /**
   * Show a hint message in the results area.
   * @param {string} msg
   */
  showHint(msg) {
    this.results.style.display = 'none';
    this.results.innerHTML = '';
    this.hint.textContent = msg;
    this.hint.style.display = 'flex';
    this.loading.style.display = 'none';
  }
}

/**
 * Initialise the search controller.
 * Exported for main.js to call on DOMContentLoaded.
 */
export function initSearch() {
  new SearchController();
}

/* ---------- Inline search (404 page) ---------- */

/**
 * Lightweight inline search for the 404 page.
 * Fetches /posts.json, builds a Fuse index, and renders results
 * into a dedicated container as the user types.
 *
 * @param {string} inputId — CSS selector for the search input
 * @param {string} resultsId — CSS selector for the results container
 */
export function initInlineSearch(inputId, resultsId) {
  const input = document.getElementById(inputId);
  const results = document.getElementById(resultsId);
  if (!input || !results) return;

  let fuse = null;
  let posts = [];
  let loading = false;
  let debounceTimer = null;

  /** Fetch index and initialise Fuse. */
  async function loadIndex() {
    if (loading || fuse) return;
    loading = true;
    try {
      const resp = await fetch('/posts.json');
      if (!resp.ok) throw new Error('Failed to load index');
      posts = await resp.json();
      fuse = new Fuse(posts, {
        keys: [
          { name: 'title', weight: 0.4 },
          { name: 'description', weight: 0.2 },
          { name: 'content', weight: 0.3 },
          { name: 'categories', weight: 0.1 }
        ],
        includeMatches: true,
        threshold: 0.4,
        minMatchCharLength: 2
      });
    } catch (_) {
      results.innerHTML = '<p class="search-empty">搜索索引加载失败</p>';
      results.classList.add('has-results');
    } finally {
      loading = false;
    }
  }

  input.addEventListener('input', () => {
    const query = input.value.trim();
    if (!query) {
      results.classList.remove('has-results');
      results.innerHTML = '';
      return;
    }

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => {
      if (!fuse) {
        loadIndex().then(() => { if (fuse) doSearch(query); });
        return;
      }
      doSearch(query);
    }, 200);
  });

  input.addEventListener('focus', () => {
    if (!fuse) loadIndex();
  });

  function doSearch(query) {
    const fuseResults = fuse.search(query).slice(0, 8);
    if (fuseResults.length === 0) {
      results.innerHTML = '<p class="search-empty">未找到相关内容</p>';
      results.classList.add('has-results');
      return;
    }

    results.classList.add('has-results');
    results.innerHTML = fuseResults.map(r => {
      const { item, matches } = r;
      const titleHTML = highlightText(item.title, getMatchesFor('title', matches));
      const contentText = item.content || item.description || '';
      const snippet = extractSnippet(contentText, matches, 100);
      const snippetHTML = highlightText(snippet, getMatchesFor('content', matches));
      return `<a href="${escapeHTML(item.permalink)}" class="search-result-item">
        <div class="search-result-title">${titleHTML}</div>
        <div class="search-result-snippet">${snippetHTML}</div>
      </a>`;
    }).join('');
  }

  function getMatchesFor(key, matches) {
    if (!matches) return [];
    const m = matches.find(m => m.key === key);
    return m ? m.indices : [];
  }

  function highlightText(text, indices) {
    if (!indices || indices.length === 0) return escapeHTML(text);
    let result = '';
    let lastEnd = 0;
    const sorted = [...indices].sort((a, b) => a[0] - b[0]);
    for (const [start, end] of sorted) {
      if (start < lastEnd) continue;
      result += escapeHTML(text.slice(lastEnd, start));
      result += `<mark class="search-highlight">${escapeHTML(text.slice(start, end + 1))}</mark>`;
      lastEnd = end + 1;
    }
    result += escapeHTML(text.slice(lastEnd));
    return result;
  }

  function extractSnippet(text, matches, maxLen) {
    if (!matches || matches.length === 0) return text.substring(0, maxLen) + (text.length > maxLen ? '...' : '');
    const firstMatch = matches[0];
    const indices = firstMatch.indices;
    if (!indices || indices.length === 0) return text.substring(0, maxLen) + '...';
    const matchStart = indices[0][0];
    const context = Math.floor((maxLen - 10) / 2);
    const start = Math.max(0, matchStart - context);
    const end = Math.min(text.length, start + maxLen);
    const prefix = start > 0 ? '...' : '';
    const suffix = end < text.length ? '...' : '';
    return prefix + text.slice(start, end) + suffix;
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }
}
