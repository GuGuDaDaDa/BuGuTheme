/**
 * BuGuBlog — Featured Carousel
 *
 * Horizontal sliding carousel with autoplay, touch support,
 * hover pause, arrow/dot navigation, and cyclic wrapping.
 *
 * @module carousel
 */

/**
 * Initialise the featured carousel on the current page.
 * No-op if the carousel element is not present.
 */
export function initCarousel() {
  /** @type {HTMLElement|null} */
  const container = document.getElementById('featured-carousel');
  if (!container) return;

  /** @type {HTMLElement} */
  const track = document.getElementById('carousel-track');
  /** @type {HTMLElement} */
  const dots = document.getElementById('carousel-dots');
  /** @type {HTMLButtonElement} */
  const prevBtn = document.getElementById('carousel-prev');
  /** @type {HTMLButtonElement} */
  const nextBtn = document.getElementById('carousel-next');

  const slides = /** @type {NodeListOf<HTMLElement>} */ (track.querySelectorAll('.carousel-slide'));
  const count = slides.length;
  if (count === 0) return;

  let currentIndex = 0;
  /** @type {ReturnType<typeof setInterval>|null} */
  let interval = null;
  let touchStartX = 0;

  /* ---------- Dot indicators ---------- */
  dots.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const btn = document.createElement('button');
    btn.setAttribute('aria-label', `第 ${i + 1} 张`);
    if (i === 0) btn.classList.add('active');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      goTo(i);
    });
    dots.appendChild(btn);
  }

  /* ---------- Slide navigation ---------- */
  /**
   * Navigate to a specific slide index.
   * @param {number} index
   */
  function goTo(index) {
    currentIndex = ((index % count) + count) % count;
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
    dots.querySelectorAll('button').forEach((b, j) => {
      b.classList.toggle('active', j === currentIndex);
    });
  }

  function next() { goTo(currentIndex + 1); resetAutoplay(); }
  function prev() { goTo(currentIndex - 1); resetAutoplay(); }

  /* ---------- Slide click → navigate to article ---------- */
  slides.forEach((slide) => {
    slide.addEventListener('click', () => {
      const url = slide.getAttribute('data-article-url');
      if (url) window.location.href = url;
    });
  });

  /* ---------- Arrow buttons ---------- */
  prevBtn.addEventListener('click', (e) => { e.stopPropagation(); prev(); });
  nextBtn.addEventListener('click', (e) => { e.stopPropagation(); next(); });

  /* ---------- Autoplay ---------- */
  function startAutoplay() {
    stopAutoplay();
    interval = setInterval(next, 5000);
  }

  function stopAutoplay() {
    if (interval) { clearInterval(interval); interval = null; }
  }

  function resetAutoplay() { stopAutoplay(); startAutoplay(); }

  container.addEventListener('mouseenter', stopAutoplay);
  container.addEventListener('mouseleave', startAutoplay);

  /* ---------- Touch ---------- */
  container.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  container.addEventListener('touchend', (e) => {
    const delta = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 50) {
      delta > 0 ? next() : prev();
    }
  });

  /* ---------- Start ---------- */
  goTo(0);
  startAutoplay();
}
