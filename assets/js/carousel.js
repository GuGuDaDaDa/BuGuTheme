/**
 * BuGuBlog — Featured Layout (large card + side grid)
 *
 * Click side items to switch the main display.
 * Click main card or title to navigate to the article.
 *
 * @module carousel
 */

/**
 * Initialise the featured layout on the current page.
 * No-op if the featured-layout element is not present.
 */
export function initCarousel() {
  /** @type {HTMLElement|null} */
  const layout = document.getElementById('featured-layout');
  if (!layout) return;

  /** @type {HTMLElement} */
  const main = document.getElementById('featured-main');
  /** @type {HTMLImageElement|HTMLElement} */
  const mainBg = document.getElementById('featured-main-bg');
  /** @type {HTMLElement} */
  const infoTitle = document.getElementById('featured-info-title');
  /** @type {HTMLElement} */
  const infoCategory = document.getElementById('featured-info-category');
  /** @type {HTMLElement} */
  const infoExcerpt = document.getElementById('featured-info-excerpt');
  /** @type {HTMLElement} */
  const infoMeta = document.getElementById('featured-info-meta');
  /** @type {HTMLElement} */
  const side = document.getElementById('featured-side');

  if (!main || !side) return;

  /** @type {NodeListOf<HTMLElement>} */
  const sideItems = side.querySelectorAll('.featured-side-item');
  if (sideItems.length === 0) return;

  let currentIndex = 0;

  /* ---------- Build data cache from side items ---------- */
  /** @type {Array<{url:string, cover:string, category:string, title:string, date:string, readtime:string, excerpt:string}>} */
  const data = [];
  sideItems.forEach(function (item) {
    data.push({
      url: item.getAttribute('data-article-url') || '',
      cover: item.getAttribute('data-cover') || '',
      category: item.getAttribute('data-category') || '',
      title: item.getAttribute('data-title') || '',
      date: item.getAttribute('data-date') || '',
      readtime: item.getAttribute('data-readtime') || '',
      excerpt: item.getAttribute('data-excerpt') || ''
    });
  });

  /* ---------- Update main display ---------- */
  /**
   * @param {number} index
   */
  function updateFeaturedMain(index) {
    if (index < 0 || index >= data.length) return;
    currentIndex = index;
    var d = data[index];

    // Update main background image
    if (mainBg.tagName === 'IMG' && d.cover) {
      mainBg.src = d.cover;
    }

    // Update info panel
    infoCategory.textContent = d.category;
    infoTitle.textContent = d.title;
    infoTitle.setAttribute('data-article-url', d.url);
    infoExcerpt.textContent = d.excerpt;
    infoMeta.innerHTML = '<span>' + d.date + '</span><span class="dot"></span><span>' + d.readtime + '</span>';

    // Update main click target
    main.setAttribute('data-article-url', d.url);

    // Toggle active class on side items
    sideItems.forEach(function (el, j) {
      el.classList.toggle('active', j === index);
    });

    // Scroll active side item into view on tablet/mobile
    if (window.innerWidth <= 1024) {
      var activeItem = side.querySelector('.featured-side-item.active');
      if (activeItem) {
        activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }

  /* ---------- Side item click ---------- */
  sideItems.forEach(function (el) {
    el.addEventListener('click', function () {
      var idx = parseInt(el.getAttribute('data-index') || '0', 10);
      updateFeaturedMain(idx);
    });
  });

  /* ---------- Main card click → navigate to article ---------- */
  main.addEventListener('click', function () {
    var url = main.getAttribute('data-article-url');
    if (url) window.location.href = url;
  });

  /* ---------- Info title click → navigate to article ---------- */
  infoTitle.addEventListener('click', function (e) {
    e.stopPropagation();
    var url = infoTitle.getAttribute('data-article-url');
    if (url) window.location.href = url;
  });
}
