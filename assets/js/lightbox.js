/**
 * BuGuBlog — Image lazy loading + full-screen lightbox.
 *
 * IntersectionObserver-based lazy loading with fade-in animation.
 * Lightbox with prev/next navigation, keyboard controls, and
 * double-click / scroll / pinch zoom.
 *
 * @module lightbox
 */

/* ================================================================
   LazyLoader — IntersectionObserver for article images
   ================================================================ */

class LazyLoader {
  /** @type {IntersectionObserver} */
  observer;

  constructor() {
    this.observer = new IntersectionObserver(
      (entries) => this.onIntersect(entries),
      { rootMargin: '200px 0px' }
    );
  }

  /**
   * Find all article images, replace src with data-src, observe.
   * Skips images that already have data-src set or are SVGs.
   */
  init() {
    const images = document.querySelectorAll('.article-content img');
    images.forEach(img => {
      if (img.dataset.src) return; // already processed
      const src = img.getAttribute('src');
      if (!src) return;
      img.classList.add('lazy-img');
      img.dataset.src = src;
      img.removeAttribute('src');
      this.observer.observe(img);
    });
  }

  /**
   * Load images that intersect the viewport.
   * @param {IntersectionObserverEntry[]} entries
   */
  onIntersect(entries) {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const img = /** @type {HTMLImageElement} */ (entry.target);
      const src = img.dataset.src;
      if (!src) return;

      img.src = src;
      img.addEventListener('load', () => {
        img.classList.add('loaded');
      }, { once: true });

      // Handle cached images that fire load before the listener
      if (img.complete) {
        img.classList.add('loaded');
      }

      this.observer.unobserve(img);
      img.removeAttribute('data-src');
    });
  }

  /** Disconnect the observer. */
  destroy() {
    this.observer.disconnect();
  }
}

/* ================================================================
   Lightbox — full-screen image viewer
   ================================================================ */

class Lightbox {
  /** @type {HTMLElement} */
  el;
  /** @type {HTMLImageElement} */
  imgEl;
  /** @type {HTMLElement} */
  counter;
  /** @type {HTMLButtonElement} */
  prevBtn;
  /** @type {HTMLButtonElement} */
  nextBtn;
  /** @type {HTMLElement} */
  backdrop;
  /** @type {HTMLButtonElement} */
  closeBtn;

  /** @type {HTMLImageElement[]} */
  images = [];
  /** @type {number} */
  currentIndex = 0;

  /** Zoom state */
  /** @type {number} */
  scale = 1;
  /** @type {{ x: number; y: number }|null} */
  pinchStart = null;

  constructor() {
    this.el = document.getElementById('lightbox');
    this.imgEl = /** @type {HTMLImageElement} */ (document.getElementById('lightbox-img'));
    this.counter = /** @type {HTMLElement} */ (this.el.querySelector('.lightbox-counter'));
    this.prevBtn = /** @type {HTMLButtonElement} */ (this.el.querySelector('.lightbox-prev'));
    this.nextBtn = /** @type {HTMLButtonElement} */ (this.el.querySelector('.lightbox-next'));
    this.backdrop = /** @type {HTMLElement} */ (this.el.querySelector('.lightbox-backdrop'));
    this.closeBtn = /** @type {HTMLButtonElement} */ (this.el.querySelector('.lightbox-close'));

    if (!this.el || !this.imgEl) return;
    this.bindEvents();
  }

  /* ---------- Image collection ---------- */

  /** Collect all visible article images. */
  collectImages() {
    this.images = Array.from(document.querySelectorAll('.article-content img'));
  }

  /* ---------- Open / Close ---------- */

  /**
   * Open the lightbox at the given image index.
   * @param {number} index
   */
  open(index) {
    this.collectImages();
    if (this.images.length === 0) return;

    this.currentIndex = index;
    this.showImage();
    this.el.classList.add('active');
    this.el.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    this.resetZoom();

    // Hide arrows if only one image
    const single = this.images.length <= 1;
    this.prevBtn.classList.toggle('is-hidden', single);
    this.nextBtn.classList.toggle('is-hidden', single);
  }

  /** Close the lightbox. */
  close() {
    this.el.classList.remove('active');
    this.el.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    this.imgEl.src = '';
  }

  /* ---------- Navigation ---------- */

  /** Show previous image (circular). */
  prev() {
    if (this.images.length === 0) return;
    this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
    this.showImage();
    this.resetZoom();
  }

  /** Show next image (circular). */
  next() {
    if (this.images.length === 0) return;
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
    this.showImage();
    this.resetZoom();
  }

  /**
   * Load the current image into the lightbox.
   */
  showImage() {
    const img = this.images[this.currentIndex];
    const src = img.dataset.src || img.getAttribute('src');
    this.imgEl.src = src || '';
    this.imgEl.alt = img.alt || '';
    this.counter.textContent = `${this.currentIndex + 1} / ${this.images.length}`;
  }

  /* ---------- Zoom ---------- */

  /** Reset zoom to 1x. */
  resetZoom() {
    this.scale = 1;
    this.applyZoom();
  }

  /**
   * Set zoom scale (clamped 1–3).
   * @param {number} s
   */
  setZoom(s) {
    this.scale = Math.max(1, Math.min(3, s));
    this.applyZoom();
  }

  /** Apply current scale as CSS transform. */
  applyZoom() {
    this.imgEl.style.transform = `scale(${this.scale})`;
    this.imgEl.style.cursor = this.scale > 1 ? 'zoom-out' : 'zoom-in';
  }

  /** Toggle between 1x and 2x. */
  toggleZoom() {
    this.setZoom(this.scale > 1.5 ? 1 : 2);
  }

  /* ---------- Event binding ---------- */

  bindEvents() {
    // Image clicks in article content
    document.addEventListener('click', (e) => {
      const img = /** @type {HTMLElement} */ (e.target).closest('.article-content img');
      if (!img) return;
      if (this.el.classList.contains('active')) return;
      this.collectImages();
      const index = this.images.indexOf(/** @type {HTMLImageElement} */ (img));
      if (index >= 0) this.open(index);
    });

    // Close
    this.closeBtn.addEventListener('click', () => this.close());
    this.backdrop.addEventListener('click', () => this.close());

    // Navigation
    this.prevBtn.addEventListener('click', () => this.prev());
    this.nextBtn.addEventListener('click', () => this.next());

    // Double-click zoom
    this.imgEl.addEventListener('dblclick', (e) => {
      e.preventDefault();
      this.toggleZoom();
    });

    // Scroll wheel zoom
    this.imgEl.addEventListener('wheel', (e) => {
      if (!this.el.classList.contains('active')) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.3 : 0.3;
      this.setZoom(this.scale + delta);
    }, { passive: false });

    // Touch pinch zoom
    this.imgEl.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        this.pinchStart = {
          x: Math.abs(e.touches[0].clientX - e.touches[1].clientX),
          y: Math.abs(e.touches[0].clientY - e.touches[1].clientY)
        };
      }
    }, { passive: true });

    this.imgEl.addEventListener('touchmove', (e) => {
      if (!this.pinchStart || e.touches.length !== 2) return;
      const dx = Math.abs(e.touches[0].clientX - e.touches[1].clientX);
      const dy = Math.abs(e.touches[0].clientY - e.touches[1].clientY);
      const dist = Math.sqrt(dx * dx + dy * dy);
      const startDist = Math.sqrt(
        this.pinchStart.x * this.pinchStart.x +
        this.pinchStart.y * this.pinchStart.y
      );
      if (startDist > 0) {
        const newScale = this.scale * (dist / startDist);
        this.setZoom(newScale);
        this.pinchStart = { x: dx, y: dy };
      }
    }, { passive: true });

    this.imgEl.addEventListener('touchend', () => {
      this.pinchStart = null;
    });

    // Keyboard
    document.addEventListener('keydown', (e) => {
      if (!this.el.classList.contains('active')) return;
      switch (e.key) {
        case 'Escape': this.close(); break;
        case 'ArrowLeft': this.prev(); break;
        case 'ArrowRight': this.next(); break;
      }
    });
  }
}

/* ================================================================
   Initialisation
   ================================================================ */

/** @type {LazyLoader|null} */
let lazyLoader = null;
/** @type {Lightbox|null} */
let lightbox = null;

/**
 * Initialise lazy loading and lightbox.
 * Exported for main.js.
 */
export function initLightbox() {
  lazyLoader = new LazyLoader();
  lazyLoader.init();

  lightbox = new Lightbox();
}
